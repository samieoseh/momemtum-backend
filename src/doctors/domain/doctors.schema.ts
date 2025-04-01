import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DoctorDocument = HydratedDocument<Doctor>;

@Schema()
export class Doctor {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  specialization: string;

  @Prop({ required: true, unique: true, trim: true })
  medicalLicenseNumber: string;

  @Prop({ required: true, min: 0 })
  yearsOfExperience: number;

  @Prop({ trim: true })
  clinicAddress?: string;

  @Prop({ trim: true })
  phoneNumber?: string;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
