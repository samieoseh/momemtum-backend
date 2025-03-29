import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from './domain/tenant.schema';
import { env } from 'process';

@Injectable()
export class TenantService {
  constructor(@InjectModel(Tenant.name) private tenantModel: Model<Tenant>) {}

  async createTenant(companyName: string): Promise<Tenant> {
    let databaseUri: string;
    if (process.env.NODE_ENV === 'development') {
      databaseUri = `${process.env.COMPANY_URI}/${companyName}_db`;
    } else {
      databaseUri = `${process.env.COMPANY_URI}/${companyName}_db?retryWrites=true&w=majority&appName=Cluster0`;
    }

    const newTenant = new this.tenantModel({ companyName, databaseUri });
    return newTenant.save();
  }

  async findByCompanyName(companyName: string) {
    return await this.tenantModel.findOne({ companyName: companyName });
  }
}
