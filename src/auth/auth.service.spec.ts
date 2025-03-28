import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { SignupDto } from './dto/signup-dto';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ForgetPasswordDto } from './dto/forgot-password-dto';
import { MailerService } from '@nestjs-modules/mailer';
import { mock } from 'node:test';
import { ConfigModule } from '@nestjs/config';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { verify } from 'crypto';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mailService: MailerService;

  let mockSendMail;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    updateOne: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({}),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'mocked-sub' }),
  };

  const mockMailerService = {
    sendMail: jest.fn().mockResolvedValue(true), // Mock sendMail
  };

  beforeEach(async () => {
    mockSendMail = jest.fn().mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailerService>(MailerService);

    if (mockUserModel.deleteMany) {
      await mockUserModel.deleteMany();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const mockUser = { _id: '123', email: 'test@example.com' };
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const user = await service.findByEmail('test@example.com');
      expect(user).toEqual(mockUser);
    });

    it('should return null if no user is found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const user = await service.findByEmail('notfound@example.com');
      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a user and return the ID', async () => {
      const signupDto: SignupDto = {
        email: 'new@example.com',
        password: '123456',
        firstName: 'Test',
        lastName: 'User',
      };
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('mocked-salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockUser = { _id: '123', ...signupDto, save: jest.fn() };

      mockUserModel.create.mockReturnValue(mockUser);
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.signup(signupDto);
      expect(result).toEqual({ _id: '123' });
    });

    it('should throw NotFoundException if user is not found after creation', async () => {
      const signupDto: SignupDto = {
        email: 'new@example.com',
        password: '123456',
        firstName: 'Test',
        lastName: 'User',
      };

      (bcrypt.genSalt as jest.Mock).mockResolvedValue('mocked-salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      mockUserModel.create.mockReturnValue({ save: jest.fn() });
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.signup(signupDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('login', () => {
    it('should authenticate a user and return a JWT', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: '123456',
      };
      const mockUser = {
        _id: '123',
        email: loginDto.email,
        password: '123456',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        _id: mockUser._id,
        email: mockUser.email,
        accessToken: 'mocked-jwt-token',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: '123' });
      expect(bcrypt.compare).toHaveBeenCalledWith('123456', '123456');
    });
  });

  describe('forgotPassword', () => {
    it('should send a jwt token with 15 minutes expiry time attached to the url sent to the email', async () => {
      const forgotPasswordDto: ForgetPasswordDto = {
        email: 'test@example.com',
      };

      await service.forgotPassword(forgotPasswordDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: forgotPasswordDto.email },
        { expiresIn: '15m' },
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        from: '"Support" <samueloseh007@gmail.com>',
        to: forgotPasswordDto.email,
        subject: 'Password Reset',
        html: `<a href="${process.env.FRONTEND_DOMAIN}/auth/reset-password/mocked-jwt-token">Click here to reset your password</a>`,
      });
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
      await service.resetPassword(resetPasswordDto);
      expect(bcrypt.hash).toHaveBeenCalledWith(
        resetPasswordDto.password,
        'mocked-salt',
      );
      expect(mockUserModel.updateOne).toHaveBeenCalledWith({
        password: 'hashed-newpassword',
      });
    });

    it('should throw UnauthorizedException if passwords do not match', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        password: 'newpassword',
        confirmPassword: 'differentpassword',
        token: 'mocked-jwt-token',
      };

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if token is invalid', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        password: 'newpassword',
        confirmPassword: 'newpassword',
        token: '123',
      };
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedException('Invalid token');
      });
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
