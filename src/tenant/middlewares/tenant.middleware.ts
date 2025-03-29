import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../domain/tenant.schema';
import { TenantDatabaseService } from '../tenant.database.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    private tenantService: TenantDatabaseService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    const tenant = await this.tenantModel.findOne({ _id: tenantId }).exec();
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    req['tenantConnection'] = await this.tenantService.getConnection(
      tenant.databaseUri,
    );
    next();
  }
}
