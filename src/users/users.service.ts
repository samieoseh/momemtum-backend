import { Injectable } from '@nestjs/common';
import { Connection } from 'mongoose';
import { UserSchema } from './domain/user.schema';

@Injectable()
export class UsersService {
  async getUsers(tenantConnection: Connection) {
    const userModel = tenantConnection.model('User', UserSchema);
    const users = await userModel.find({});
    return users;
  }
}
