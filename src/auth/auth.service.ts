import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dto/signup-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './domain/user.schema';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';
import { ForgetPasswordDto } from './dto/forgot-password-dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ResetPasswordDto } from './dto/reset-password-dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
  ) {}

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }

  async signup(signupDto: SignupDto) {
    try {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(signupDto.password, salt);

      await this.userModel.create({ ...signupDto, password: passwordHash });

      // get the saved user
      const savedUser = await this.findByEmail(signupDto.email);
      if (!savedUser) {
        throw new NotFoundException('User not found');
      }

      return { _id: savedUser?._id.toString() };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const userAccount = await this.findByEmail(loginDto.email);

    if (!userAccount) {
      throw new UnauthorizedException('User does not exists');
    }

    const passwordMatched = await bcrypt.compare(
      loginDto.password,
      userAccount.password,
    );

    if (!passwordMatched) {
      throw new UnauthorizedException('Password does not match');
    }

    const payload = { sub: userAccount._id };

    const accessToken = this.jwtService.sign(payload);
    return {
      _id: userAccount?._id.toString(),
      email: userAccount?.email,
      accessToken,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgetPasswordDto) {
    const user = await this.findByEmail(forgotPasswordDto.email);

    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    const token = this.jwtService.sign(
      { sub: forgotPasswordDto.email },
      { expiresIn: '15m' },
    );
    const resetLinkHtml = `<a href="${process.env.FRONTEND_DOMAIN}/auth/reset-password/${token}">Click here to reset your password</a>`;

    await this.mailService.sendMail({
      from: '"Support" <samueloseh007@gmail.com>',
      to: forgotPasswordDto.email,
      subject: 'Password Reset',
      html: resetLinkHtml,
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { password, confirmPassword, token } = resetPasswordDto;

    try {
      const decodedToken = this.jwtService.verify(token);
      if (!decodedToken) {
        throw new UnauthorizedException('Invalid token');
      }

      if (password !== confirmPassword) {
        console.log('Password does not match');
        throw new UnauthorizedException('Password does not match');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await this.userModel.updateOne({ password: passwordHash });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw error;
    }
  }
}
