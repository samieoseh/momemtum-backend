import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type HospitalDocument = HydratedDocument<Hospital>;

@Schema({ timestamps: true })
export class Hospital {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
  })
  tenantId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, unique: true })
  subdomain: string;

  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({ unique: true, trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  website?: string;

  @Prop({ trim: true })
  logo?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  adminId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  roles: string[];

  @Prop({
    type: [{ name: String, description: String }],
    default: [],
  })
  departments: { name: string; description?: string }[];

  @Prop({ trim: true, default: 'UTC' })
  timezone: string;

  @Prop({ trim: true, default: 'USD' })
  currency: string;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  @Prop({ type: [String], default: ['In-person', 'Telemedicine'] })
  appointmentTypes: string[];

  @Prop({ default: 7 })
  dataRetentionPeriod: number;

  @Prop({ default: true })
  hipaaCompliant: boolean;

  @Prop({ default: true })
  gdprCompliant: boolean;

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'suspended';
}

export const HospitalSchema = SchemaFactory.createForClass(Hospital);
