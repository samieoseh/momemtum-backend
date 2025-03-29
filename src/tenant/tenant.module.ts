import { Module } from '@nestjs/common';
import { TenantDatabaseService } from './tenant.database.service';
import { Tenant, TenantSchema } from './domain/tenant.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantService } from './tenant.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]), // Register model
  ],
  providers: [TenantDatabaseService, TenantService],
  exports: [TenantDatabaseService, TenantService],
})
export class TenantModule {}
