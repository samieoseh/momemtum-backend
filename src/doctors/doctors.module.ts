import { Module } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Doctor, DoctorSchema } from './domain/doctors.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Doctor.name, schema: DoctorSchema }]),
  ],
  providers: [DoctorsService],
})
export class DoctorsModule {}
