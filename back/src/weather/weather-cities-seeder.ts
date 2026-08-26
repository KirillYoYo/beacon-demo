import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedCities() {
  try {
    console.log('📖 Чтение файла russian_cities_array.json...');
    const filePath = path.join(__dirname, 'russian_cities_array.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    console.log(`📄 Всего записей в файле: ${data.length}`);

    // Берем все города (или ограничимся, например, 1000 первыми)
    const cities = data
      .filter((c) => c.coord && c.coord.lat != null && c.coord.lon != null) // только с координатами
      .slice(0, 1000)
      .map((c) => ({
        name: c.name,
        country: c.country || 'RU',
        lat: c.coord.lat,
        lon: c.coord.lon,
        population: c.population ? Number(c.population) : null,
        timezone: c.timezone || null,
      }));

    console.log(`🏙️ Подготовлено ${cities.length} городов для вставки`);

    const result = await prisma.city.createMany({
      data: cities,
      skipDuplicates: true,
    });
    console.log(`✅ Города загружены: ${result.count} записей`);
  } catch (error) {
    console.error('❌ Ошибка при импорте городов:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedCities()
  .catch(console.error)
  .finally(() => prisma.$disconnect());