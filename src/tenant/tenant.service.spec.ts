import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { getModelToken } from '@nestjs/mongoose';

describe('TenantService', () => {
  let service: TenantService;

  const mockTenantModel = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: getModelToken('Tenant'), useValue: mockTenantModel },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
