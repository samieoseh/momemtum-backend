import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { HospitalUpdateDto } from './dto/hospital-update-dto';
import { Model } from 'mongoose';
import { Hospital } from './domain/hospital.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<Hospital>,
  ) {}
  async findHospital(id: string) {
    return await this.hospitalModel.findOne({ _id: id });
  }

  async findHospitalByTenantId(id: string) {
    return await this.hospitalModel.findOne({ tenantId: id });
  }
  async updateHospital(id: string, hospitalUpdateDto: HospitalUpdateDto) {
    const hospital = await this.findHospitalByTenantId(
      hospitalUpdateDto.tenantId,
    );

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    const updatedHospital = await this.hospitalModel.findByIdAndUpdate(
      id,
      hospitalUpdateDto,
      {
        new: true,
      },
    );

    return updatedHospital;
  }
}
