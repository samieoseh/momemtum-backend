import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { SignupDto } from './dto/signup-dto';
import { NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
      mockUserModel.create.mockReturnValue({ save: jest.fn() });
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.signup(signupDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
