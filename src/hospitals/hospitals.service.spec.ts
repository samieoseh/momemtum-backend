import { Test, TestingModule } from '@nestjs/testing';
import { HospitalsService } from './hospitals.service';
import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';
import { TenantDatabaseService } from '../tenant/tenant.database.service';

describe('HospitalsService', () => {
  let service: HospitalsService;
  let tenantService: TenantService;
  let tenantDatabaseService: TenantDatabaseService;
  let tenantConnection: Connection;

  const mockHospitalModel = {
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTenantModel = {
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockDropDatabase = jest.fn().mockResolvedValue(true);

  const mockTenantDatabaseService = {
    getConnection: jest.fn(),
  };

  const mockTenantConnection = {
    model: jest.fn().mockReturnValue(mockHospitalModel),
    dropDatabase: mockDropDatabase,
  };

  mockTenantDatabaseService.getConnection.mockResolvedValue(
    mockTenantConnection,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        HospitalsService,
        TenantService,
        { provide: TenantDatabaseService, useValue: mockTenantDatabaseService },
        { provide: getModelToken('Hospital'), useValue: mockHospitalModel },
        { provide: getModelToken('Tenant'), useValue: mockTenantModel },
      ],
    }).compile();

    service = module.get<HospitalsService>(HospitalsService);
    tenantConnection = mockTenantConnection as unknown as Connection;
    tenantService = module.get<TenantService>(TenantService);
    tenantDatabaseService = module.get<TenantDatabaseService>(
      TenantDatabaseService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateHospital', () => {
    it('should update the hospital with the correct data', async () => {
      const mockUpdateHospitalDto = {
        name: 'Mock hospital',
        email: 'mock@hospital.com',
        tenantId: 'tenant-id',
      };
      const mockId = '123';

      mockHospitalModel.findOne.mockResolvedValue(mockUpdateHospitalDto);

      mockHospitalModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUpdateHospitalDto,
        _id: mockId,
      });

      const result = await service.updateHospital(
        mockId,
        mockUpdateHospitalDto,
      );
      expect(result).toEqual({
        ...mockUpdateHospitalDto,
        _id: mockId,
      });
    });
    it('should throw a 404 error if hospital cannot be found', async () => {
      const mockUpdateHospitalDto = {
        name: 'Mock hospital',
        email: 'mock@hospital.com',
        tenantId: 'tenant-id',
      };
      const mockId = '123';
      mockHospitalModel.findOne.mockResolvedValue(null);

      await expect(
        service.updateHospital(mockId, mockUpdateHospitalDto),
      ).rejects.toThrow(new NotFoundException('Hospital not found'));
    });
  });

  describe('deleteHospital', () => {
    it('should delete the hospital and tenant data', async () => {
      const mockTenantId = '123';
      const mockHospitalId = '456';

      const mockTenant = {
        _id: 'tenant-id',
      };

      const mockHospital = {
        _id: 'hospital_id',
      };

      mockTenantModel.findByIdAndDelete.mockResolvedValue(true);
      mockHospitalModel.findByIdAndDelete.mockResolvedValue(true);

      mockTenantModel.findOne.mockResolvedValue(mockTenant);
      mockHospitalModel.findOne.mockResolvedValue(mockHospital);

      const result = await service.deleteHospital(mockTenantId, mockHospitalId);
      expect(result).toEqual({
        tenantId: mockTenantId,
        hospitalId: mockHospitalId,
      });
    });
    it('it should throw a 404 error if the hospital is not found', async () => {
      const mockTenantId = '123';
      const mockHospitalId = '456';

      const mockTenant = {
        _id: 'tenant-id',
      };

      mockTenantModel.findByIdAndDelete.mockResolvedValue(true);
      mockHospitalModel.findByIdAndDelete.mockResolvedValue(true);

      mockTenantModel.findOne.mockResolvedValue(mockTenant);
      mockHospitalModel.findOne.mockResolvedValue(null);

      await expect(
        service.deleteHospital(mockTenantId, mockHospitalId),
      ).rejects.toThrow(new NotFoundException('Hospital not found'));
    });
    it('it should throw a 404 error if the tenant is not found', async () => {
      const mockTenantId = '123';
      const mockHospitalId = '456';

      const mockHospital = {
        _id: 'tenant-id',
      };

      mockTenantModel.findByIdAndDelete.mockResolvedValue(true);
      mockHospitalModel.findByIdAndDelete.mockResolvedValue(true);

      mockTenantModel.findOne.mockResolvedValue(null);
      mockHospitalModel.findOne.mockResolvedValue(mockHospital);

      await expect(
        service.deleteHospital(mockTenantId, mockHospitalId),
      ).rejects.toThrow(new NotFoundException('Tenant not found'));
    });
  });
});
