import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { HospitalUpdateDto } from './dto/hospital-update-dto';
import { Model } from 'mongoose';
import { Hospital } from './domain/hospital.schema';
import { InjectModel } from '@nestjs/mongoose';
import { TenantService } from '../tenant/tenant.service';
import { Tenant } from '../tenant/domain/tenant.schema';
import { TenantDatabaseService } from '../tenant/tenant.database.service';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<Hospital>,
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    private readonly tenantService: TenantService,
    private readonly tenantDatabaseService: TenantDatabaseService,
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

  async deleteHospital(tenantId: string, hospitalId: string) {
    // drop the hospital
    const hospital = await this.findHospital(hospitalId);

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    await this.hospitalModel.findByIdAndDelete(hospitalId);

    // drop the tenant
    const tenant = await this.tenantService.findByTenantId(tenantId);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.tenantModel.findByIdAndDelete(tenantId);

    const tenantConnection = await this.tenantDatabaseService.getConnection(
      tenant.databaseUri,
    );

    await tenantConnection?.dropDatabase();

    return { tenantId, hospitalId };
  }
}
