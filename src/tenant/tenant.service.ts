import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from './domain/tenant.schema';
import { Hospital } from '../hospitals/domain/hospital.schema';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(Hospital.name) private hospitalModel: Model<Hospital>,
  ) {}

  async createTenant(hospitalName: string): Promise<Tenant> {
    let databaseUri: string;
    if (process.env.NODE_ENV === 'development') {
      databaseUri = `${process.env.HOSPITAL_URI}/${hospitalName}_db`;
    } else {
      databaseUri = `${process.env.HOSPITAL_URI}/${hospitalName}_db?retryWrites=true&w=majority&appName=Cluster0`;
    }

    const newTenant = new this.tenantModel({ hospitalName, databaseUri });
    return newTenant.save();
  }

  async findByHospitalName(name: string) {
    return await this.tenantModel.findOne({ hospitalName: name });
  }

  async getTenantId(subdomain: string) {
    const hospital = await this.hospitalModel.findOne({ subdomain: subdomain });

    if (!hospital) {
      throw new NotFoundException('Hospital does not exist');
    }

    const tenant = await this.tenantModel.findOne({
      hospitalName: hospital.name,
    });

    if (!tenant) {
      throw new NotFoundException('Tenant does not exist');
    }

    return tenant._id;
  }

  async createSubdomain(hospitalName: string): Promise<string> {
    const subdomain = hospitalName.toLowerCase().replace(/\s+/g, '-');
    return subdomain;
  }
}
