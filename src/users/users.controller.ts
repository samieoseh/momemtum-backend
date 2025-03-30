import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../jwt/jwt.auth.guard';
import { Connection } from 'mongoose';

// user controller
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get()
  async getUsers(@Req() req: Request) {
    const tenantConnection: Connection = req['tenantConnection'];

    if (!tenantConnection) {
      throw new Error('Tenant database connection is missing');
    }

    const users = await this.userService.getUsers(tenantConnection);

    return users;
  }
}
