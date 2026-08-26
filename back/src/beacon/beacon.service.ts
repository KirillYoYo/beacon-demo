import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBeaconDto } from './create-beacon.dto';
import { Request } from 'express';

@Injectable()
export class BeaconService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateBeaconDto, req: Request) {
    // Извлекаем все поля из DTO, которые соответствуют модели
    const {
      fingerprint,
      sessionId,
      url,
      screenResolution,
      colorDepth,
      language,
      platform,
      timezoneOffset,
      deviceMemory,
      hardwareConcurrency,
      touchSupport,
      firstPaint,
      domReadyTime,
      clicksCount,
      connectionType,
      canvasFingerprint,
      payload,
    } = createDto;

    // Сохраняем запись в БД
    return this.prisma.beaconRecord.create({
      data: {
        fingerprint,
        sessionId,
        url,
        screenResolution,
        colorDepth,
        language,
        platform,
        timezoneOffset,
        deviceMemory,
        hardwareConcurrency,
        touchSupport,
        firstPaint,
        domReadyTime,
        clicksCount,
        connectionType,
        canvasFingerprint,
        // Поля, получаемые из заголовков запроса
        userAgent: req.headers['user-agent'],
        referrer: req.headers['referer'] || req.headers['origin'],
        ipAddress: req.ip,
        // Дополнительные произвольные данные
        payload: payload || {},
      },
    });
  }
}