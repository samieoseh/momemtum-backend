import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Tenant {
  @Prop({ required: true, unique: true })
  subdomain: string;

  @Prop({ required: true, unique: true })
  databaseUri: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
