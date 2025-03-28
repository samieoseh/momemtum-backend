import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SignupDto } from './dto/signup-dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { ForgetPasswordDto } from './dto/forgot-password-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('/signup')
  async signup(@Body() signupDto: SignupDto) {
    const newUser = await this.authService.signup(signupDto);
    return { user: newUser, message: 'User created successfully' };
  }

  @Post('/login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.login(loginDto);
    return { user, message: 'User login successfully' };
  }

  @Post('/forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() forgotPasswordDto: ForgetPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message: 'A password reset link have been sent to the provided email',
    };
  }
}
