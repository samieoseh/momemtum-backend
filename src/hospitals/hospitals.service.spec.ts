import { Test, TestingModule } from '@nestjs/testing';
import { HospitalsService } from './hospitals.service';
import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

describe('HospitalsService', () => {
  let service: HospitalsService;
  let tenantConnection: Connection;

  const mockHospitalModel = {
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTenantConnection = {
    model: jest.fn().mockReturnValue(mockHospitalModel),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        HospitalsService,
        { provide: getModelToken('Hospital'), useValue: mockHospitalModel },
      ],
    }).compile();

    service = module.get<HospitalsService>(HospitalsService);
    tenantConnection = mockTenantConnection as unknown as Connection;
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
});
