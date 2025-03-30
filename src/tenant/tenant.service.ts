import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from './domain/tenant.schema';
import { Company } from '../auth/domain/company.schema';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

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

  async getTenantId(subdomain: string) {
    const company = await this.companyModel.findOne({ subdomain: subdomain });

    if (!company) {
      throw new NotFoundException('Company does not exist');
    }

    const tenant = await this.tenantModel.findOne({
      companyName: company.companyName,
    });

    if (!tenant) {
      throw new NotFoundException('Tenant does not exist');
    }

    return tenant._id;
  }

  async createSubdomain(companyName: string): Promise<string> {
    const subdomain = companyName.toLowerCase().replace(/\s+/g, '-');
    return subdomain;
  }
}
