import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { SignupDto } from './dto/signup-dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { ForgetPasswordDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { CompanyRegistrationDto } from './dto/company-registration-dto';
import { TenantService } from '../tenant/tenant.service';
import { Connection } from 'mongoose';
import { Sign } from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantService: TenantService,
  ) {}
  @Post('/register-company')
  @HttpCode(201)
  async registerCompany(
    @Body() companyRegistrationDto: CompanyRegistrationDto,
  ) {
    // create user database
    await this.tenantService.createTenant(companyRegistrationDto.companyName);

    const newUser = await this.authService.registerCompany(
      companyRegistrationDto,
    );
    return { user: newUser, message: 'Company created successfully' };
  }

  @Post('/register-admin')
  @HttpCode(201)
  async registerAdmin(@Body() signupDto: SignupDto, @Req() req: Request) {
    const tenantConnection: Connection = req['tenantConnection'];

    if (!tenantConnection) {
      throw new Error('Tenant database connection is missing');
    }

    const newUser = await this.authService.registerAdmin(
      signupDto,
      tenantConnection,
    );
    return { user: newUser, message: 'Admin created successfully' };
  }

  @Post('/signup')
  async signup(@Body() signupDto: SignupDto, @Req() req: Request) {
    const tenantConnection: Connection = req['tenantConnection'];

    if (!tenantConnection) {
      throw new Error('Tenant database connection is missing');
    }

    const newUser = await this.authService.signup(signupDto, tenantConnection);
    return { user: newUser, message: 'User created successfully' };
  }

  @Post('/login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const tenantConnection: Connection = req['tenantConnection'];

    if (!tenantConnection) {
      throw new Error('Tenant database connection is missing');
    }
    const user = await this.authService.login(loginDto, tenantConnection);
    return { user, message: 'User login successfully' };
  }

  @Post('/forgot-password')
  @HttpCode(200)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgetPasswordDto,
    @Req() req: Request,
  ) {
    const tenantConnection: Connection = req['tenantConnection'];

    if (!tenantConnection) {
      throw new Error('Tenant database connection is missing');
    }
    await this.authService.forgotPassword(forgotPasswordDto, tenantConnection);
    return {
      message: 'A password reset link have been sent to the provided email',
    };
  }

  @Post('/reset-password')
  @HttpCode(200)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    const tenantConnection: Connection = req['tenantConnection'];

    if (!tenantConnection) {
      throw new Error('Tenant database connection is missing');
    }
    await this.authService.resetPassword(resetPasswordDto, tenantConnection);
    return {
      message: 'Password has been reset successfully',
    };
  }
}
