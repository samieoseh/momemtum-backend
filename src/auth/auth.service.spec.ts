import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { SignupDto } from './dto/signup-dto';
import { NotFoundException } from '@nestjs/common';
import { LoginDto } from './dto/login-dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
  genSalt: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
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
        user: { _id: mockUser._id, email: mockUser.email },
        accessToken: 'mocked-jwt-token',
        message: 'User login successful',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: '123' });
      expect(bcrypt.compare).toHaveBeenCalledWith('123456', '123456');
    });
  });
});
