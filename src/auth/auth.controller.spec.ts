import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TenantService } from '../tenant/tenant.service';
import { SignupDto } from './dto/signup-dto';
import { LoginDto } from './dto/login-dto';
import { ForgetPasswordDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { CompanyRegistrationDto } from './dto/company-registration-dto';
import { Connection } from 'mongoose';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let tenantService: TenantService;
  const mockTenantService = {
    createTenant: jest.fn(),
  };

  const mockAuthService = {
    registerCompany: jest.fn(),
    signup: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    tenantService = module.get<TenantService>(TenantService);
  });

  describe('registerCompany', () => {
    it('should call TenantService.createTenant and AuthService.registerCompany', async () => {
      const dto: CompanyRegistrationDto = {
        email: 'test@example.com',
        companyName: 'Test Company',
      };

      mockTenantService.createTenant.mockResolvedValue(undefined);
      mockAuthService.registerCompany.mockResolvedValue({
        id: 1,
        email: dto.email,
        companyName: dto.companyName,
      });

      await controller.registerCompany(dto);

      expect(tenantService.createTenant).toHaveBeenCalledWith(dto.companyName);
      expect(authService.registerCompany).toHaveBeenCalledWith(dto);
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
        id: 1,
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
});
