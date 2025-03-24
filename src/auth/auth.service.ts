import { Injectable, NotFoundException } from '@nestjs/common';
import { SignupDto } from './dto/signup-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './domain/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }

  async signup(signupDto: SignupDto): Promise<{ _id: string }> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(signupDto.password, salt);

    await this.userModel.create({ ...signupDto, password: passwordHash });

    // find the user by email
    const user = await this.findByEmail(signupDto.email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { _id: user?._id.toString() };
  }
}
