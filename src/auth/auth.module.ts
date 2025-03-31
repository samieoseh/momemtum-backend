import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/domain/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { JWTStrategy } from 'src/jwt/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Hospital, HospitalSchema } from '../hospitals/domain/hospital.schema';
import { TenantModule } from 'src/tenant/tenant.module';
import { UsersModule } from 'src/users/users.module';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule], // Load ConfigModule before JwtModule
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('SECRET_KEY'),
          signOptions: { expiresIn: '1d' },
        };
      },
    }),
    TenantModule,
    UsersModule,
    RolesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JWTStrategy],
  exports: [AuthService],
})
export class AuthModule {}
