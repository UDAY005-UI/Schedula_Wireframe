import { Module } from '@nestjs/common';
import { HelloModule } from './hello/hello.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientModule } from './patient/patient.module';
import { ConfigModule } from "@nestjs/config"
import { DoctorModule } from './doctor/doctor.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HelloModule,
    PrismaModule,
    AuthModule,
    PatientModule,
    DoctorModule,
  ],
})
export class AppModule {}
