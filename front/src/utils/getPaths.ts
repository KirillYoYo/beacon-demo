import { SVGPathData, SVGCommand, SVGPathDataTransformer } from 'svg-pathdata'

// Константы для типов команд
const MOVE_TO = SVGPathData.MOVE_TO
const LINE_TO = SVGPathData.LINE_TO
const HORIZ_LINE_TO = SVGPathData.HORIZ_LINE_TO
const VERT_LINE_TO = SVGPathData.VERT_LINE_TO
const CLOSE_PATH = SVGPathData.CLOSE_PATH
const CURVE_TO = SVGPathData.CURVE_TO
const SMOOTH_CURVE_TO = SVGPathData.SMOOTH_CURVE_TO
const QUAD_TO = SVGPathData.QUAD_TO
const SMOOTH_QUAD_TO = SVGPathData.SMOOTH_QUAD_TO
const ARC = SVGPathData.ARC

// Наши типы
export type VertexType = SVGCommand['type']

export interface VertexUpdate {
    type?: VertexType
    x?: number
    y?: number
    [key: string]: any // Для остальных свойств команды
}

export interface PathEditorJSON {
    originalPathData: string
    commands: SVGCommand[]
    originalCommands: SVGCommand[]
}

export class PathVertexEditor {
    private originalPathData: string
    private commands: SVGCommand[]
    private originalCommands: SVGCommand[]

    constructor(pathData: string) {
        this.originalPathData = pathData
        // Парсим путь с помощью библиотеки
        this.commands = new SVGPathData(pathData).commands
        this.originalCommands = this.deepCopy(this.commands)
    }

    // Глубокое копирование
    private deepCopy<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj))
    }

    // Вспомогательный метод для преобразования в абсолютные координаты
    private getAbsoluteCommands(): SVGCommand[] {
        return new SVGPathData(this.commands).toAbs().commands
    }

    // Вспомогательный метод для преобразования в относительные координаты
    private getRelativeCommands(commands: SVGCommand[]): SVGCommand[] {
        return new SVGPathData(commands).toRel().commands
    }

    // Проверяем, есть ли относительные команды
    private hasRelativeCommands(): boolean {
        return this.commands.some(cmd => cmd.relative)
    }

    // --- Основные методы ---

    // Генерация path d из команд
    public generatePathData(): string {
        // Создаем новый SVGPathData из команд и кодируем
        return new SVGPathData(this.commands).encode()
    }

    // Получить все команды
    public getCommands(): SVGCommand[] {
        return this.deepCopy(this.commands)
    }

    // Получить упрощенное представление вершин
    public getVertices(): Array<{ x: number; y: number; type: VertexType }> {
        const vertices: Array<{ x: number; y: number; type: VertexType }> = []
        let lastX = 0,
            lastY = 0

        for (const cmd of this.commands) {
            let x = lastX,
                y = lastY

            // Извлекаем координаты в зависимости от типа команды
            if ('x' in cmd && cmd.x !== undefined) x = cmd.x
            if ('y' in cmd && cmd.y !== undefined) y = cmd.y

            vertices.push({ x, y, type: cmd.type })

            // Обновляем последние известные координаты
            if (cmd.type !== CLOSE_PATH) {
                lastX = x
                lastY = y
            }
        }
        return vertices
    }

    // Установить новые команды
    public setCommands(newCommands: SVGCommand[]): string {
        this.commands = this.deepCopy(newCommands)
        return this.generatePathData()
    }

    // Сбросить к исходному состоянию
    public reset(): string {
        this.commands = this.deepCopy(this.originalCommands)
        return this.generatePathData()
    }

    // Получить количество команд
    public getCommandCount(): number {
        return this.commands.length
    }

    // --- Работа с отдельными командами ---

    public getCommand(index: number): SVGCommand | null {
        if (index < 0 || index >= this.commands.length) return null
        return this.deepCopy(this.commands[index])
    }

    public updateCommand(index: number, updates: VertexUpdate): boolean {
        if (index < 0 || index >= this.commands.length) return false

        // Обновляем команду
        const command = this.commands[index]
        Object.assign(command, updates)

        return true
    }

    // --- Новые методы для работы с несколькими точками ---

    /**
     * Обновляет несколько вершин по их индексам (работает с абсолютными координатами)
     * @param updates Массив обновлений с полями originalIndex для сопоставления
     * @returns Новый path d строку
     */
    public updateVerticesByIndex(
        updates: Array<{
            originalIndex: number
            type?: VertexType
            x?: number
            y?: number
            relative?: boolean
            [key: string]: any
        }>
    ): string {
        // Преобразуем команды в абсолютные для простоты работы
        const absCommands = this.getAbsoluteCommands()

        // Создаем карту обновлений для быстрого доступа по индексу
        const updateMap = new Map<number, any>()

        updates.forEach(update => {
            if (update.originalIndex >= 0 && update.originalIndex < absCommands.length) {
                const { originalIndex, ...updateData } = update
                updateMap.set(originalIndex, updateData)
            }
        })

        // Применяем обновления
        const updatedCommands = absCommands.map((command, index) => {
            const update = updateMap.get(index)
            if (update) {
                // Создаем новую команду с обновленными данными
                const updatedCommand = { ...command }

                // Обновляем тип команды если нужно
                if (update.type !== undefined) {
                    updatedCommand.type = update.type
                }

                // Обновляем координаты
                if (update.x !== undefined && 'x' in updatedCommand) {
                    updatedCommand.x = update.x
                }
                if (update.y !== undefined && 'y' in updatedCommand) {
                    updatedCommand.y = update.y
                }

                // Обновляем другие параметры (контрольные точки для кривых и т.д.)
                Object.keys(update).forEach(key => {
                    if (!['originalIndex', 'x', 'y', 'type', 'relative'].includes(key)) {
                        ;(updatedCommand as any)[key] = update[key]
                    }
                })

                // Устанавливаем относительность если указана
                if (update.relative !== undefined) {
                    updatedCommand.relative = update.relative
                }

                return updatedCommand
            }
            return { ...command }
        })

        // Преобразуем обратно в исходный формат (абсолютный или относительный)
        if (this.hasRelativeCommands()) {
            this.commands = this.getRelativeCommands(updatedCommands)
        } else {
            this.commands = updatedCommands
        }

        return this.generatePathData()
    }

    /**
     * Обновляет вершины с поиском ближайшей точки (работает с абсолютными координатами)
     */
    public updateVerticesByProximity(
        updates: Array<{
            x: number
            y: number
            type?: VertexType
            relative?: boolean
            [key: string]: any
        }>,
        maxDistance: number = 10
    ): {
        pathData: string
        matchedIndices: number[]
        unmatchedUpdates: number[]
    } {
        // Преобразуем в абсолютные координаты
        const absCommands = this.getAbsoluteCommands()

        const matchedIndices: number[] = []
        const updateMap = new Map<number, any>()

        // Для каждого обновления находим ближайшую команду
        updates.forEach((update, updateIndex) => {
            let minDistance = Infinity
            let nearestIndex = -1

            // Ищем ближайшую команду
            absCommands.forEach((command, index) => {
                if (command.type === CLOSE_PATH) return
                if (!('x' in command) || !('y' in command)) return

                const dx = command.x - update.x
                const dy = command.y - update.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < minDistance && distance <= maxDistance) {
                    minDistance = distance
                    nearestIndex = index
                }
            })

            if (nearestIndex !== -1) {
                matchedIndices.push(nearestIndex)
                updateMap.set(nearestIndex, { ...update, distance: minDistance })
            }
        })

        // Применяем обновления
        const updatedCommands = absCommands.map((command, index) => {
            const update = updateMap.get(index)
            if (update) {
                const updatedCommand = { ...command }

                if (update.type !== undefined) {
                    updatedCommand.type = update.type
                }

                if ('x' in updatedCommand) updatedCommand.x = update.x
                if ('y' in updatedCommand) updatedCommand.y = update.y

                // Обновляем другие параметры
                Object.keys(update).forEach(key => {
                    if (!['x', 'y', 'type', 'relative', 'distance'].includes(key)) {
                        ;(updatedCommand as any)[key] = update[key]
                    }
                })

                if (update.relative !== undefined) {
                    updatedCommand.relative = update.relative
                }

                return updatedCommand
            }
            return { ...command }
        })

        // Преобразуем обратно
        if (this.hasRelativeCommands()) {
            this.commands = this.getRelativeCommands(updatedCommands)
        } else {
            this.commands = updatedCommands
        }

        const unmatchedUpdates = updates
            .map((_, index) => index)
            .filter(updateIndex => !matchedIndices.includes(updateIndex))

        return {
            pathData: this.generatePathData(),
            matchedIndices,
            unmatchedUpdates,
        }
    }

    /**
     * Более надежный метод обновления команд с сохранением относительности
     */
    public batchUpdateCommands(
        indices: number[],
        updater: (command: SVGCommand, index: number) => Partial<SVGCommand>
    ): string {
        // Преобразуем в абсолютные для консистентности
        const absCommands = this.getAbsoluteCommands()

        // Применяем обновления
        const updatedCommands = absCommands.map((command, index) => {
            if (indices.includes(index)) {
                const updates = updater(command, index)
                return { ...command, ...updates }
            }
            return { ...command }
        })

        // Восстанавливаем исходный формат
        if (this.hasRelativeCommands()) {
            this.commands = this.getRelativeCommands(updatedCommands)
        } else {
            this.commands = updatedCommands
        }

        return this.generatePathData()
    }

    /**
     * Упрощенный метод для обновления по индексам
     */
    public updatePoints(
        updates: Array<{
            originalIndex: number
            x?: number
            y?: number
            type?: VertexType
            relative?: boolean
        }>
    ): string {
        return this.updateVerticesByIndex(updates)
    }

    public getVerticesWithIndex(): Array<{
        index: number
        x: number
        y: number
        type: VertexType
        command: SVGCommand
        isRelative: boolean
    }> {
        const vertices: Array<{
            index: number
            x: number
            y: number
            type: VertexType
            command: SVGCommand
            isRelative: boolean
        }> = []

        // Получаем абсолютные команды для консистентности
        const absCommands = this.getAbsoluteCommands()

        absCommands.forEach((command, index) => {
            if (command.type === CLOSE_PATH) return

            let x = 0,
                y = 0
            if ('x' in command && command.x !== undefined) x = command.x
            if ('y' in command && command.y !== undefined) y = command.y

            vertices.push({
                index,
                x,
                y,
                type: command.type,
                command: this.deepCopy(command),
                isRelative: command.relative || false,
            })
        })

        return vertices
    }

    // --- Трансформации ---

    // Случайное смещение вершин
    public jitter(amplitude: number = 5): string {
        // Преобразуем в абсолютные координаты
        const absCommands = this.getAbsoluteCommands()

        const jitteredCommands = absCommands.map(cmd => {
            const newCmd = { ...cmd }

            // Применяем jitter только к командам с координатами
            if (cmd.type !== CLOSE_PATH) {
                if ('x' in newCmd && newCmd.x !== undefined) {
                    newCmd.x += (Math.random() - 0.5) * amplitude * 2
                }
                if ('y' in newCmd && newCmd.y !== undefined) {
                    newCmd.y += (Math.random() - 0.5) * amplitude * 2
                }
            }

            return newCmd
        })

        // Восстанавливаем относительность если нужно
        if (this.hasRelativeCommands()) {
            this.commands = this.getRelativeCommands(jitteredCommands)
        } else {
            this.commands = jitteredCommands
        }

        return this.generatePathData()
    }

    // Перемещение
    public translate(dx: number, dy: number): string {
        this.commands = new SVGPathData(this.commands)
            .toAbs()
            .transform(SVGPathDataTransformer.TRANSLATE(dx, dy)).commands
        return this.generatePathData()
    }

    // Масштабирование относительно точки
    public scale(scaleX: number, scaleY: number, originX: number = 0, originY: number = 0): string {
        this.commands = new SVGPathData(this.commands)
            .toAbs()
            .transform(SVGPathDataTransformer.TRANSLATE(-originX, -originY))
            .transform(SVGPathDataTransformer.SCALE(scaleX, scaleY))
            .transform(SVGPathDataTransformer.TRANSLATE(originX, originY)).commands
        return this.generatePathData()
    }

    // Поворот относительно точки
    public rotate(angleDegrees: number, originX: number = 0, originY: number = 0): string {
        const angleRad = (angleDegrees * Math.PI) / 180
        this.commands = new SVGPathData(this.commands)
            .toAbs()
            .transform(SVGPathDataTransformer.TRANSLATE(-originX, -originY))
            .transform(SVGPathDataTransformer.ROTATE(angleRad))
            .transform(SVGPathDataTransformer.TRANSLATE(originX, originY)).commands
        return this.generatePathData()
    }

    // Упрощенное сглаживание
    public smooth(iterations: number = 1, strength: number = 0.5): string {
        // Преобразуем в абсолютные координаты
        const absCommands = this.getAbsoluteCommands()

        for (let iter = 0; iter < iterations; iter++) {
            const smoothedCommands = [...absCommands]

            for (let i = 1; i < absCommands.length - 1; i++) {
                const prev = absCommands[i - 1]
                const curr = absCommands[i]
                const next = absCommands[i + 1]

                // Сглаживаем только команды LINE_TO
                if (
                    curr.type === LINE_TO &&
                    'x' in curr &&
                    'y' in curr &&
                    'x' in prev &&
                    'y' in prev &&
                    'x' in next &&
                    'y' in next
                ) {
                    const smoothed = { ...curr }
                    smoothed.x = curr.x * (1 - strength) + ((prev.x + next.x) / 2) * strength
                    smoothed.y = curr.y * (1 - strength) + ((prev.y + next.y) / 2) * strength
                    smoothedCommands[i] = smoothed
                }
            }

            // Обновляем absCommands для следующей итерации
            if (iter < iterations - 1) {
                absCommands.splice(0, absCommands.length, ...smoothedCommands)
            } else {
                // На последней итерации обновляем основной массив команд
                if (this.hasRelativeCommands()) {
                    this.commands = this.getRelativeCommands(smoothedCommands)
                } else {
                    this.commands = smoothedCommands
                }
            }
        }

        return this.generatePathData()
    }

    // Добавить новую вершину
    public addVertex(
        x: number,
        y: number,
        type: VertexType = LINE_TO,
        insertIndex: number = -1
    ): SVGCommand {
        const command: SVGCommand = {
            type,
            relative: false,
            ...(type === HORIZ_LINE_TO ? { x } : {}),
            ...(type === VERT_LINE_TO ? { y } : {}),
            ...(type === MOVE_TO ||
            type === LINE_TO ||
            type === CURVE_TO ||
            type === QUAD_TO ||
            type === ARC
                ? { x, y }
                : {}),
        }

        if (insertIndex === -1 || insertIndex >= this.commands.length) {
            this.commands.push(command)
        } else {
            this.commands.splice(insertIndex, 0, command)
        }

        return command
    }

    // Удалить команду
    public removeCommand(index: number): SVGCommand | null {
        if (index < 0 || index >= this.commands.length) return null
        return this.commands.splice(index, 1)[0]
    }

    // Найти ближайшую команду к точке
    public findNearestCommand(
        x: number,
        y: number,
        maxDistance: number = Infinity
    ): { index: number; command: SVGCommand; distance: number } | null {
        // Используем абсолютные координаты для поиска
        const absCommands = this.getAbsoluteCommands()

        let nearest = null
        let minDistance = Infinity

        absCommands.forEach((command, index) => {
            if (command.type === CLOSE_PATH) return
            if (!('x' in command) || !('y' in command)) return

            const dx = command.x - x
            const dy = command.y - y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < minDistance && distance <= maxDistance) {
                minDistance = distance
                nearest = {
                    index,
                    command: this.deepCopy(command),
                    distance,
                }
            }
        })

        return nearest
    }

    // --- Сериализация ---

    public toJSON(): PathEditorJSON {
        return {
            originalPathData: this.originalPathData,
            commands: this.deepCopy(this.commands),
            originalCommands: this.deepCopy(this.originalCommands),
        }
    }

    public static fromJSON(json: PathEditorJSON): PathVertexEditor {
        const editor = new PathVertexEditor(json.originalPathData)
        editor.commands = editor.deepCopy(json.commands)
        editor.originalCommands = editor.deepCopy(json.originalCommands)
        return editor
    }

    // --- Вспомогательные методы ---

    // Преобразовать все команды в абсолютные
    public toAbsolute(): string {
        this.commands = this.getAbsoluteCommands()
        return this.generatePathData()
    }

    // Преобразовать все команды в относительные
    public toRelative(): string {
        this.commands = this.getRelativeCommands(this.commands)
        return this.generatePathData()
    }

    // Упростить путь (удалить коллинеарные точки)
    public simplify(): string {
        this.commands = new SVGPathData(this.commands)
            .toAbs()
            .transform(SVGPathDataTransformer.REMOVE_COLLINEAR()).commands
        return this.generatePathData()
    }

    /**
     * Валидация обновлений перед применением
     */
    public validateUpdates(updates: Array<{ originalIndex: number }>): {
        valid: boolean
        errors: string[]
    } {
        const errors: string[] = []
        const commandCount = this.getCommandCount()

        updates.forEach((update, i) => {
            if (update.originalIndex < 0 || update.originalIndex >= commandCount) {
                errors.push(
                    `Update ${i}: invalid index ${update.originalIndex} (valid range: 0-${commandCount - 1})`
                )
            }
        })

        return {
            valid: errors.length === 0,
            errors,
        }
    }

    /**
     * Безопасное обновление с валидацией
     */
    public safeUpdateVerticesByIndex(
        updates: Array<{
            originalIndex: number
            [key: string]: any
        }>
    ): { success: boolean; pathData?: string; errors: string[] } {
        const validation = this.validateUpdates(updates)

        if (!validation.valid) {
            return { success: false, errors: validation.errors }
        }

        try {
            const pathData = this.updateVerticesByIndex(updates)
            return { success: true, pathData, errors: [] }
        } catch (error) {
            return {
                success: false,
                errors: [`Update failed: ${(error as Error).message}`],
            }
        }
    }
}
