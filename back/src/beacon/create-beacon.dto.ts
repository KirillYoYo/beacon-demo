// beacon/dto/create-beacon.dto.ts
import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  IsBoolean,
  MaxLength,
  IsUrl,
  IsInt,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBeaconDto {
  // --- Обязательные поля ---
  @IsString()
  @MaxLength(500)
  fingerprint: string;

  // --- Опциональные поля, передаваемые с клиента ---
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @IsUrl({ require_tld: false, require_protocol: false })
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  screenResolution?: string; // например, "1920x1080"

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(48)
  colorDepth?: number; // бит на пиксель

  @IsOptional()
  @IsNumber()
  @Min(-720)
  @Max(840)
  timezoneOffset?: number; // минут от UTC

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string; // например, "en-US"

  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string; // например, "Win32"

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(64)
  deviceMemory?: number; // ГБ

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1024)
  hardwareConcurrency?: number; // количество ядер

  @IsOptional()
  @IsBoolean()
  touchSupport?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  firstPaint?: number; // время в мс

  @IsOptional()
  @IsNumber()
  @Min(0)
  domReadyTime?: number; // время в мс

  @IsOptional()
  @IsNumber()
  @Min(0)
  clicksCount?: number; // количество кликов

  @IsOptional()
  @IsString()
  @MaxLength(20)
  connectionType?: string; // "4g", "wifi" и т.д.

  @IsOptional()
  @IsString()
  @MaxLength(500)
  canvasFingerprint?: string; // дополнительный отпечаток

  // --- Дополнительные произвольные данные ---
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}