import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { BeaconService } from './beacon.service';
import { CreateBeaconDto } from './create-beacon.dto';

@Controller('beacon')
export class BeaconController {
  constructor(private readonly beaconService: BeaconService) {}

  @Post()
  @HttpCode(HttpStatus.OK) // Beacon ожидает 200 OK, можно также 204 No Content
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async track(@Body() createDto: CreateBeaconDto, @Req() req: Request) {
    console.log('Тело запроса:', createDto);
    console.log('Заголовки:', req.headers);
    // Асинхронно сохраняем, но не ждём результата, чтобы ответить быстро
    // Можно использовать .then() или await, но мы всё равно не возвращаем данные клиенту
    await this.beaconService.create(createDto, req);
    return { success: true }; // или ничего не возвращать (204)
  }
}