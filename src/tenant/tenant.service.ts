import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from './domain/tenant.schema';

@Injectable()
export class TenantService {
  constructor(@InjectModel(Tenant.name) private tenantModel: Model<Tenant>) {}

  async createTenant(companyName: string): Promise<Tenant> {
    const databaseUri = `${process.env.COMPANY_URI}/${companyName}_db`;

    const newTenant = new this.tenantModel({ companyName, databaseUri });
    console.log({ newTenant });
    return newTenant.save();
  }
}
