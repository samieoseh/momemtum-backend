import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TenantService } from '../tenant/tenant.service';
import { LoginDto } from './dto/login-dto';
import { ForgetPasswordDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { HospitalRegistrationDto } from '../hospitals/dto/hospital-registration-dto';
import { Connection } from 'mongoose';
import { SignupDto } from './dto/signup-dto';
import { DoctorDto } from './dto/doctor-signup-dto';
import { HospitalsService } from '../hospitals/hospitals.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let hospitalsService: HospitalsService;
  let tenantService: TenantService;

  const mockHospitalService = {
    findHospitalByEmail: jest.fn(),
  };

  const mockTenantService = {
    createTenant: jest.fn(),
    getTenantId: jest.fn(),
    findBySubdomain: jest.fn(),
    createSubdomain: jest.fn().mockReturnValue('mocked-subdomain'),
  };

  const mockAuthService = {
    registerHospital: jest.fn(),
    signup: jest.fn(),
    registerDoctor: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    registerAdmin: jest.fn(),
  };

  const mockTenantConnection = {} as Connection;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: HospitalsService, useValue: mockHospitalService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    tenantService = module.get<TenantService>(TenantService);
    hospitalsService = module.get<HospitalsService>(HospitalsService);
  });

  describe('registerHospital', () => {
    it('should call TenantService.createTenant and AuthService.registerHospital', async () => {
      const dto: HospitalRegistrationDto = {
        email: 'test@example.com',
        name: 'Test Hospital',
      };

      mockTenantService.createTenant.mockResolvedValue(undefined);
      mockAuthService.registerHospital.mockResolvedValue({
        id: 1,
        email: dto.email,
        name: dto.name,
      });

      await controller.registerHospital(dto);

      expect(tenantService.createTenant).toHaveBeenCalledWith(
        'mocked-subdomain',
      );
      expect(authService.registerHospital).toHaveBeenCalledWith(
        dto,
        'mocked-subdomain',
      );
    });
  });

  describe('registerAdmin', () => {
    it('should call AuthService.registerAdmin with tenantConnection', async () => {
      const dto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockAuthService.registerAdmin.mockResolvedValue({
        id: 1,
        email: dto.email,
      });
      const req = { tenantConnection: mockTenantConnection } as any;
      await controller.registerAdmin(dto, req);
      expect(authService.registerAdmin).toHaveBeenCalledWith(
        dto,
        mockTenantConnection,
      );
    });

    it('should return the created user and a success message', async () => {
      const dto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const req = { tenantConnection: mockTenantConnection } as any;
      const result = {
        id: 1,
      };

      mockAuthService.registerAdmin.mockResolvedValue(result);
      const response = await controller.registerAdmin(dto, req);
      expect(response).toEqual({
        user: result,
        message: 'Admin created successfully',
      });
      expect(authService.registerAdmin).toHaveBeenCalledWith(
        dto,
        mockTenantConnection,
      );
    });
  });

  describe('signup', () => {
    it('should call AuthService.signup with tenantConnection', async () => {
      const dto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockAuthService.signup.mockResolvedValue({
        _id: '123',
        email: dto.email,
      });
      const req = { tenantConnection: mockTenantConnection } as any;
      await controller.signup(dto, req);

      expect(authService.signup).toHaveBeenCalledWith(
        dto,
        mockTenantConnection,
      );
    });
  });

  describe('registerDoctor', () => {
    it('should call AuthService.registerDoctor with tenantConnection', async () => {
      const dto: DoctorDto = {
        medicalLicenseNumber: '12345678',
        specialization: 'Radiology',
        yearsOfExperience: 2,
        userId: '123',
      };

      const req = { tenantConnection: mockTenantConnection } as any;
      await controller.registerDoctor(dto, req);

      expect(authService.registerDoctor).toHaveBeenCalledWith(
        dto,
        mockTenantConnection,
      );
    });
  });

  describe('login', () => {
    it('should call AuthService.login with tenantConnection', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password@123',
      };

      mockAuthService.login.mockResolvedValue({
        id: 1,
        email: dto.email,
      });

      const req = { tenantConnection: mockTenantConnection } as any;
      await controller.login(dto, req);

      expect(authService.login).toHaveBeenCalledWith(dto, mockTenantConnection);
    });
  });

  describe('forgotPassword', () => {
    it('should call AuthService.forgotPassword with tenantConnection', async () => {
      const dto: ForgetPasswordDto = { email: 'test@example.com' };

      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'A password reset link has been sent',
      });

      const req = { tenantConnection: mockTenantConnection } as any;
      await controller.forgotPassword(dto, req);

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        dto,
        mockTenantConnection,
      );
    });
  });

  describe('resetPassword', () => {
    it('should call AuthService.resetPassword with tenantConnection', async () => {
      const dto: ResetPasswordDto = {
        password: '123456',
        confirmPassword: '123456',
        token: 'mocked-jwt-token',
      };

      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully',
      });

      const req = { tenantConnection: mockTenantConnection } as any;
      await controller.resetPassword(dto, req);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        dto,
        mockTenantConnection,
      );
    });
  });

  describe('getTenantId', () => {
    it('should call TenantService.getTenantId with the subdomain', async () => {
      const subdomain = 'test-subdomain';

      mockTenantService.getTenantId.mockResolvedValue({
        tenantId: '123',
      });

      await controller.getTenantId(subdomain);

      expect(tenantService.getTenantId).toHaveBeenCalledWith(subdomain);
    });
  });
});
