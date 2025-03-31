import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Connection } from 'mongoose';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  const mockTenantConnection = {} as Connection;

  const mockUserService = {
    getUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should test that the UserService.getUsers is called with the tenant connection', async () => {
      mockUserService.getUsers.mockResolvedValue([
        {
          _id: '1',
        },
        {
          _id: '2',
        },
      ]);
      const req = { tenantConnection: mockTenantConnection } as any;

      await controller.getUsers(req);
      expect(usersService.getUsers).toHaveBeenCalledWith(mockTenantConnection);
    });
  });
});
