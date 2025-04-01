import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsService } from './doctors.service';
import { getModelToken } from '@nestjs/mongoose';

describe('DoctorsService', () => {
  let service: DoctorsService;

  const mockDoctor = {
    _id: '123',
    specialization: 'Radiology',
    userId: {
      _id: '456',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
  };

  const mockDoctorModel = {
    findOne: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockDoctor),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        {
          provide: getModelToken('Doctor'),
          useValue: mockDoctorModel,
        },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDoctor', () => {
    it('should return the doctor with populated user', async () => {
      const mockId = '123';

      const result = await service.findDoctor(mockId);

      expect(mockDoctorModel.findOne).toHaveBeenCalledWith({ _id: mockId });
      expect(mockDoctorModel.findOne().populate).toHaveBeenCalledWith('userId');
      expect(result).toEqual(mockDoctor);
    });
  });
});
