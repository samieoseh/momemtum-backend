import { Test, TestingModule } from '@nestjs/testing';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { Connection } from 'mongoose';

describe('HospitalsController', () => {
  let controller: HospitalsController;
  let hospitalService: HospitalsService;

  const mockHospitalService = {
    updateHospital: jest.fn(),
    deleteHospital: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HospitalsController],
      providers: [{ provide: HospitalsService, useValue: mockHospitalService }],
    }).compile();

    controller = module.get<HospitalsController>(HospitalsController);
    hospitalService = module.get<HospitalsService>(HospitalsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateHospital', () => {
    it('should call the HospitalService.updateHospital', async () => {
      const mockId = '123';

      const mockHospitalUpdateDto = {
        name: 'ABC hospital',
        email: 'abc@hospital.com',
        tenantId: 'tenant-id',
      };
      mockHospitalService.updateHospital.mockResolvedValue(
        mockHospitalUpdateDto,
      );

      controller.updateHospital(mockId, mockHospitalUpdateDto);
      expect(hospitalService.updateHospital).toHaveBeenCalledWith(
        mockId,
        mockHospitalUpdateDto,
      );
    });
  });

  describe('deleteHospital', () => {
    it('should call the HospitalService.deleteHospital', async () => {
      const mockTenantId = '123';
      const mockHospitalId = '456';
      mockHospitalService.deleteHospital.mockResolvedValue({
        tenantId: mockTenantId,
        hospitalId: mockHospitalId,
      });

      controller.deleteHospital(mockTenantId, mockHospitalId);
      expect(hospitalService.deleteHospital).toHaveBeenCalledWith(
        mockTenantId,
        mockHospitalId,
      );
    });
  });
});
