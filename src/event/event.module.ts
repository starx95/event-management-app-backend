import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaModule } from "../prisma/prisma.module"
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [PrismaModule,  MulterModule.register({
    dest: './uploads',
  }),],
  providers: [EventService],
  controllers: [EventController]
})
export class EventModule {}
