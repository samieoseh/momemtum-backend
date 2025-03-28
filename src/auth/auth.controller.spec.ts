import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { SignupDto } from './dto/signup-dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { ForgetPasswordDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should call AuthService.signup with correct data', async () => {
      const dto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      mockAuthService.signup.mockResolvedValue({
        id: 1,
        message: 'User signup successful',
      });

      await controller.signup(dto);

      expect(authService.signup).toHaveBeenCalledWith(dto);
    });

    it('should return the result from AuthService.signup', async () => {
      const dto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      const expectedResponse = {
        id: 1,
        email: dto.email,
      };
      mockAuthService.signup.mockResolvedValue(expectedResponse);

      const result = await controller.signup(dto);

      expect(result).toEqual({
        user: expectedResponse,
        message: 'User created successfully',
      });
    });

    it('should throw an error if AuthService.signup fails', async () => {
      const dto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };
      mockAuthService.signup.mockRejectedValue(new Error('Signup failed'));

      await expect(controller.signup(dto)).rejects.toThrow('Signup failed');
    });
  });

  describe('login', () => {
    it('should call the AuthService.login with correct data', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password@123',
      };

      mockAuthService.login.mockResolvedValue({
        id: 1,
        message: 'User login successful',
      });
      await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });

    it('should return the result from AuthService.login', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password@123',
      };
      const expectedResponse = { id: 1, email: dto.email };
      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(dto);
      expect(result).toEqual({
        user: expectedResponse,
        message: 'User login successfully',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should call the AuthService.forgetPassword with correct data', async () => {
      const dto: ForgetPasswordDto = {
        email: 'test@example.com',
      };

      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'A password reset linked have been sent to the provided email',
      });

      await controller.forgotPassword(dto);
      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
    });

    it('should return the correct response on success', async () => {
      const dto: ForgetPasswordDto = {
        email: 'test@example.com',
      };

      const expectedResponse = {
        message: 'A password reset link have been sent to the provided email',
      };
      mockAuthService.forgotPassword.mockResolvedValue({
        message: 'A password reset link have been sent to the provided email',
      });

      const result = await controller.forgotPassword(dto);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('resetPassword', () => {
    it('should call the AuthService.resetPassword with correct data', async () => {
      const dto: ResetPasswordDto = {
        password: '123456',
        confirmPassword: '123456',
        token: 'mocked-jwt-token',
      };

      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully',
      });
      await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
    });
    it('should return the correct response on success', async () => {
      const dto: ResetPasswordDto = {
        password: '123456',
        confirmPassword: '123456',
        token: 'mocked-jwt-token',
      };
      const expectedResponse = {
        message: 'Password has been reset successfully',
      };

      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Password has been reset successfully',
      });
      const result = await controller.resetPassword(dto);
      expect(result).toEqual(expectedResponse);
    });
  });
});
