/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { RolesModule } from './roles/roles.module';
import { TenantModule } from './tenant/tenant.module';
import { Tenant, TenantSchema } from './tenant/domain/tenant.schema';
import { TenantMiddleware } from './tenant/middlewares/tenant.middleware';
import { TenantDatabaseService } from './tenant/tenant.database.service';
import { HospitalsModule } from './hospitals/hospitals.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_URI || ''),
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),

    MailerModule.forRootAsync({
      imports: [ConfigModule], // Ensure ConfigModule is available
      inject: [ConfigService], // Inject ConfigService for access to env variables
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          auth: {
            user: configService.get<string>('EMAIL_USERNAME'),
            pass: configService.get<string>('EMAIL_PASSWORD'),
          },
        },
      }),
    }),
    UsersModule,
    AuthModule,
    RolesModule,
    TenantModule,
    HospitalsModule,
  ],
  controllers: [AppController],
  providers: [AppService, TenantDatabaseService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude({ path: 'auth/register-hospital', method: RequestMethod.POST })
      .exclude({ path: 'hospitals/*path', method: RequestMethod.ALL })
      .exclude({
        path: 'auth/get-tenant-id/:subdomain',
        method: RequestMethod.GET,
      })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
