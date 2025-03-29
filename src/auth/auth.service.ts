import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dto/signup-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserSchema } from './domain/user.schema';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';
import { ForgetPasswordDto } from './dto/forgot-password-dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { CompanyRegistrationDto } from './dto/company-registration-dto';
import { Company } from './domain/company.schema';
import { Connection } from 'mongoose';
import { RolesService } from '../roles/roles.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
    private readonly roleService: RolesService,
    private readonly tenantService: TenantService,
  ) {}

  async findByEmail(email: string, tenantConnection: Connection) {
    const userModel = tenantConnection.model('User', UserSchema);
    return await userModel.findOne({ email });
  }

  async registerCompany(companyRegistrationDto: CompanyRegistrationDto) {
    try {
      const company = await this.companyModel.create(companyRegistrationDto);
      const tenant = await this.tenantService.findByCompanyName(
        company.companyName,
      );

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      return { _id: company._id.toString(), tenantId: tenant?._id.toString() };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Company already exists');
      }
      throw error;
    }
  }

  async registerAdmin(signupDto: SignupDto, tenantConnection: Connection) {
    try {
      const userModel = tenantConnection.model('User', UserSchema);

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(signupDto.password, salt);

      const user = await userModel.create({
        ...signupDto,
        password: passwordHash,
      });

      // create the default roles for the database
      const roles = await this.roleService.createDefaultRoles(tenantConnection);

      // assign the admin role to the user
      await userModel.updateOne(
        { _id: user._id },
        { $addToSet: { roles: roles[0]._id } },
      );

      return { _id: user._id.toString() };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }
  async signup(signupDto: SignupDto, tenantConnection: Connection) {
    try {
      const userModel = tenantConnection.model('User', UserSchema);

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(signupDto.password, salt);

      await userModel.create({ ...signupDto, password: passwordHash });

      // get the saved user
      const savedUser = await this.findByEmail(
        signupDto.email,
        tenantConnection,
      );
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

  async login(loginDto: LoginDto, tenantConnection: Connection) {
    const userModel = tenantConnection.model('User', UserSchema);
    const userAccount = await this.findByEmail(
      loginDto.email,
      tenantConnection,
    );

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

  async forgotPassword(
    forgotPasswordDto: ForgetPasswordDto,
    tenantConnection: Connection,
  ) {
    const userModel = tenantConnection.model('User', UserSchema);
    const user = await this.findByEmail(
      forgotPasswordDto.email,
      tenantConnection,
    );

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

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    tenantConnection: Connection,
  ) {
    const userModel = tenantConnection.model('User', UserSchema);
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

      await userModel.updateOne({ password: passwordHash });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid token');
      }

      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token expired');
      }

      throw error;
    }
  }
}
