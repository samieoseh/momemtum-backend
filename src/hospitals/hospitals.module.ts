import { Module } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Hospital, HospitalSchema } from './domain/hospital.schema';
import { TenantModule } from '../tenant/tenant.module';
import { Tenant, TenantSchema } from '../tenant/domain/tenant.schema';
import { TenantDatabaseService } from 'src/tenant/tenant.database.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    TenantModule,
  ],
  controllers: [HospitalsController],
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule {}
