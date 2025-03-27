import { Body, Controller, Post } from '@nestjs/common';
import { SignupDto } from './dto/signup-dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('/signup')
  async signup(@Body() signupDto: SignupDto) {
    const newUser = await this.authService.signup(signupDto);
    return { user: newUser, message: 'User created successfully' };
  }

  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.login(loginDto);
    return { user, message: 'User login successfully' };
  }
}
