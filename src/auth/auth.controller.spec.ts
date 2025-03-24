import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { SignupDto } from './dto/signup-dto';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  const mockAuthService = {
    signup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

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
    const expectedResponse = { id: 1, email: dto.email };
    mockAuthService.signup.mockResolvedValue(expectedResponse);

    const result = await controller.signup(dto);

    expect(result).toEqual(expectedResponse);
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
