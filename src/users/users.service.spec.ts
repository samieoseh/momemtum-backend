import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { User } from 'src/auth/domain/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let tenantConnection: Connection;
  const mockUserModel = {
    find: jest.fn(),
  };

  const mockTenantConnection = {
    model: jest.fn().mockReturnValue(mockUserModel),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    tenantConnection = mockTenantConnection as unknown as Connection;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    it('should get return an empty array if there are no users', async () => {
      mockUserModel.find.mockResolvedValue([]);

      const result = await service.getUsers(tenantConnection);
      expect(result).toEqual([]);
    });
    it('should return a correct list of users if there are users', async () => {
      const mockUsers = [
        { _id: '1', firstName: 'Test', lastName: 'User 1' },
        { _id: '2', firstName: 'Test', lastName: 'User 2' },
      ];
      mockUserModel.find.mockResolvedValue(mockUsers);

      const result = await service.getUsers(tenantConnection);
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });
  });
});
