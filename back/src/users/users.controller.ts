import { Controller, Post, UseGuards } from '@nestjs/common';
import { UsersService } from '@src/users/users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  deleteByEmail(email: string) {
    this.usersService.deleteByEmail(email);
  }
}
