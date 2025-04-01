import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcryptjs';
import { ConfigModule } from '@nestjs/config';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { Connection } from 'mongoose';
import { RolesService } from '../roles/roles.service';
import { LoginDto } from './dto/login-dto';
import { HospitalRegistrationDto } from '../hospitals/dto/hospital-registration-dto';
import { TenantService } from '../tenant/tenant.service';
import { SignupDto } from './dto/signup-dto';
import { DoctorDto } from './dto/doctor-signup-dto';
import { NotFoundException } from '@nestjs/common';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
}));

describe('AuthService (Tenant-Aware)', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mailService: MailerService;
  let roleService: RolesService;
  let tenantService: TenantService;
  let tenantConnection: Connection;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
  };

  const mockDoctorModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockHospitalModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockTenantConnection = {
    model: jest.fn().mockReturnValue(mockUserModel),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'mocked-email@example.com' }),
  };

  const mockMailerService = {
    sendMail: jest.fn().mockResolvedValue(true),
  };

  const mockRoleService = {
    createDefaultRoles: jest.fn().mockResolvedValue([
      { name: 'admin', description: 'Admin role', permissions: [] },
      { name: 'user', description: 'User role', permissions: [] },
    ]),
  };

  const mockTenantService = {
    findBySubdomain: jest.fn().mockResolvedValue({ _id: 'tenant-id' }),
    createTenant: jest.fn().mockResolvedValue({
      _id: 'tenant-id',
      hospitalName: 'Test Hospital',
      databaseUri: 'mongodb://localhost/test_db',
    }),
    createSubdomain: jest.fn().mockResolvedValue('test-domain'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailerService, useValue: mockMailerService },
        { provide: RolesService, useValue: mockRoleService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: getModelToken('Hospital'), useValue: mockHospitalModel },
        { provide: getModelToken('Doctor'), useValue: mockDoctorModel },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailerService>(MailerService);
    roleService = module.get<RolesService>(RolesService);
    tenantService = module.get<TenantService>(TenantService);
    tenantConnection = mockTenantConnection as unknown as Connection;
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = { _id: '123', email: 'test@example.com' };
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const user = await service.findByEmail(
        'test@example.com',
        tenantConnection,
      );
      expect(user).toEqual(mockUser);
    });
  });

  describe('registerHospital', () => {
    it('should create a hospital and return the ID', async () => {
      const dto: HospitalRegistrationDto = {
        name: 'Test Hospital',
        email: 'test@example.com',
      };

      const mockHospital = { _id: '123', ...dto };

      mockHospitalModel.create.mockResolvedValue(mockHospital);

      const result = await service.registerHospital(dto, 'test-domain');
      expect(result).toEqual({ _id: '123', tenantId: 'tenant-id' });
      expect(mockHospitalModel.create).toHaveBeenCalledWith({
        ...dto,
        tenantId: 'tenant-id',
        subdomain: 'test-domain',
      });
      expect(mockHospitalModel.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerAdmin', () => {
    it('should create an admin user and return the ID', async () => {
      const dto: SignupDto = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      };

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('mocked-salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserModel.create.mockResolvedValue({ _id: '123', ...dto });

      mockRoleService.createDefaultRoles.mockResolvedValue([
        { _id: 'admin-role-id' },
      ]);

      await service.registerAdmin(dto, tenantConnection);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        ...dto,
        password: 'hashed-password',
      });
      expect(mockRoleService.createDefaultRoles).toHaveBeenCalledWith(
        tenantConnection,
      );
      expect(mockUserModel.updateOne).toHaveBeenCalledWith(
        { _id: '123' },
        { $addToSet: { roles: 'admin-role-id' } },
      );
      expect(mockUserModel.updateOne).toHaveBeenCalledTimes(1);
      expect(mockUserModel.create).toHaveBeenCalledTimes(1);
      expect(mockRoleService.createDefaultRoles).toHaveBeenCalledTimes(1);
    });
  });

  describe('signup', () => {
    it('should create a user and return the ID', async () => {
      const signupDto: SignupDto = {
        email: 'new@example.com',
        password: '123456',
        firstName: 'Test',
        lastName: 'User',
      };
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('mocked-salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      mockUserModel.create.mockReturnValue({ _id: '123', ...signupDto });
      mockUserModel.findOne.mockResolvedValue({ _id: '123' });

      const result = await service.signup(signupDto, tenantConnection);
      expect(result).toEqual({ _id: '123' });
    });
  });

  describe('registerDoctor', () => {
    it('should create a doctor with an ID', async () => {
      const doctorDto: DoctorDto = {
        medicalLicenseNumber: '12345678',
        yearsOfExperience: 10,
        userId: '123',
        specialization: 'Radiology',
      };

      mockUserModel.findOne.mockResolvedValue({ _id: '123' });
      mockDoctorModel.create.mockReturnValue(doctorDto);

      const result = await service.registerDoctor(doctorDto, tenantConnection);
      expect(result).toEqual({ _id: '123' });
    });

    it('should throw a 404 error if user does not exists', async () => {
      const doctorDto: DoctorDto = {
        medicalLicenseNumber: '12345678',
        yearsOfExperience: 10,
        userId: '123',
        specialization: 'Radiology',
      };
      mockUserModel.findOne.mockResolvedValue(null);
      mockDoctorModel.create.mockReturnValue(doctorDto);

      await expect(
        service.registerDoctor(doctorDto, tenantConnection),
      ).rejects.toThrow(new NotFoundException('User does not exist'));
    });
  });
  describe('login', () => {
    it('should return a user if credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: '123',
        email: loginDto.email,
        password: 'hashed-password',
      };
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserModel.findOne.mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('mocked-jwt-token');
      const result = await service.login(loginDto, tenantConnection);
      expect(result).toEqual({
        _id: mockUser._id,
        email: mockUser.email,
        accessToken: 'mocked-jwt-token',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('should throw an error if user does not exist', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto, tenantConnection)).rejects.toThrow(
        'User does not exists',
      );

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: loginDto.email,
      });
    });

    it('should throw an error if password does not match', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const mockUser = {
        _id: '123',
        email: loginDto.email,
        password: 'hashed-password',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      await expect(service.login(loginDto, tenantConnection)).rejects.toThrow(
        'Password does not match',
      );
    });
  });

  describe('resetPassword', () => {
    it("should reset the user's password", async () => {
      const resetPasswordDto: ResetPasswordDto = {
        password: 'newpassword',
        confirmPassword: 'newpassword',
        token: 'mocked-jwt-token',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-newpassword');
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('mocked-salt');

      await service.resetPassword(resetPasswordDto, tenantConnection);

      expect(mockUserModel.updateOne).toHaveBeenCalledWith({
        password: 'hashed-newpassword',
      });
    });
  });
});
