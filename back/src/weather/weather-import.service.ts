import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class WeatherImportService {
  private readonly logger = new Logger(WeatherImportService.name);

  constructor(private prisma: PrismaService) {}
}
