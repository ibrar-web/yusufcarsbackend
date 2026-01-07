import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/ormconfig';
import { S3Service } from './common/aws/s3.service';
import { KycDocsService } from './common/aws/kyc-docs.service';
import { AdminModule } from './modules/admin/admin.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { SocketsModule } from './modules/sockets/sockets.module';
import { HealthController } from './health/health.controller';
import { PublicModule } from './modules/public/public.module';
import { BlogModule } from './modules/blog/blog.module';
import { BadgesModule } from './modules/badges/badges.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),
    ScheduleModule.forRoot(),
    AdminModule,
    SupplierModule,
    UserModule,
    AuthModule,
    SocketsModule,
    PublicModule,
    BlogModule,
    BadgesModule,
  ],
  controllers: [HealthController],
  providers: [S3Service, KycDocsService],
})
export class AppModule {}
