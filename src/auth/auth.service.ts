import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DoctorDto } from './dto/doctor-signup-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserSchema } from '../users/domain/user.schema';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';
import { ForgetPasswordDto } from './dto/forgot-password-dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { HospitalRegistrationDto } from '../hospitals/dto/hospital-registration-dto';
import { Hospital } from '../hospitals/domain/hospital.schema';
import { Connection } from 'mongoose';
import { RolesService } from '../roles/roles.service';
import { TenantService } from '../tenant/tenant.service';
import { SignupDto } from './dto/signup-dto';
import { Doctor, DoctorSchema } from '../doctors/domain/doctors.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<Hospital>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
    private readonly roleService: RolesService,
    private readonly tenantService: TenantService,
  ) {}

  async findByEmail(email: string, tenantConnection: Connection) {
    const userModel = tenantConnection.model('User', UserSchema);
    return await userModel.findOne({ email });
  }

  async registerHospital(
    hospitalRegistrationDto: HospitalRegistrationDto,
    subdomain: string,
  ) {
    try {
      const tenant = await this.tenantService.findBySubdomain(subdomain);

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      const hospital = await this.hospitalModel.create({
        ...hospitalRegistrationDto,
        subdomain,
        tenantId: tenant._id,
      });

      return {
        _id: hospital._id.toString(),
        tenantId: tenant?._id.toString(),
        subdomain: hospital.subdomain,
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Hospital already exists');
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

      const savedUser = await userModel.create({
        ...signupDto,
        password: passwordHash,
      });

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

  async registerDoctor(doctorDto: DoctorDto, tenantConnection: Connection) {
    try {
      const doctorModel = tenantConnection.model('Doctor', DoctorSchema);
      const userModel = tenantConnection.model('User', UserSchema);

      const user = await userModel.findOne({ _id: doctorDto.userId });

      if (!user) {
        throw new NotFoundException('User does not exist');
      }

      const savedDoctor = await doctorModel.create(doctorDto);

      if (!savedDoctor) {
        throw new NotFoundException('Doctor not found');
      }

      return { _id: savedDoctor._id.toString() };
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Doctor already exists');
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
