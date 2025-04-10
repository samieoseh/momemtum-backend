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

  async createTenant(subdomain: string): Promise<Tenant> {
    let databaseUri: string;
    if (process.env.NODE_ENV === 'development') {
      databaseUri = `${process.env.HOSPITAL_URI}/${subdomain}_db`;
    } else {
      databaseUri = `${process.env.HOSPITAL_URI}/${subdomain}_db?retryWrites=true&w=majority&appName=Cluster0`;
    }

    const newTenant = new this.tenantModel({ subdomain, databaseUri });
    return newTenant.save();
  }

  async findBySubdomain(subdomain: string) {
    return await this.tenantModel.findOne({ subdomain });
  }

  async getTenantId(subdomain: string) {
    const hospital = await this.hospitalModel.findOne({ subdomain: subdomain });

    if (!hospital) {
      throw new NotFoundException('Hospital does not exist');
    }

    const tenant = await this.tenantModel.findOne({
      subdomain: hospital.subdomain,
    });

    if (!tenant) {
      throw new NotFoundException('Tenant does not exist');
    }

    return tenant._id;
  }

  async findByTenantId(tenantId: string) {
    const tenant = await this.tenantModel.findOne({ _id: tenantId });
    return tenant;
  }

  async createSubdomain(hospitalName: string): Promise<string> {
    const subdomain = hospitalName.toLowerCase().replace(/\s+/g, '-');
    return subdomain;
  }
}
