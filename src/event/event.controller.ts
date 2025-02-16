import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    UseInterceptors,
    UploadedFile,
    NotFoundException,
    UnauthorizedException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
  Req
  } from '@nestjs/common';
  import { EventService } from './event.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { Event } from '@prisma/client';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  
  @Controller('events')
  export class EventController {
    private readonly logger = new Logger(EventController.name);

    constructor(private readonly eventService: EventService) {}
  
    @UseGuards(JwtAuthGuard)
    @Post()
    @UseInterceptors(
      FileInterceptor('thumbnail', {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
      }),
    )
    async createEvent(@Body() eventData: Event, @UploadedFile() file): Promise<Event> {
      if (file) {
        eventData.thumbnailUrl = file.path;
      }
      return this.eventService.createEvent(eventData);
    }
  
    @Get()
    async getEvents(
      @Query('skip') skip?: number,
      @Query('take') take?: number,
      @Query('orderBy') orderBy?: string,
      @Query('filter') filter?: string,
    ): Promise<Event[]> {
      const where = filter ? { name: { contains: filter } } : {};
      return this.eventService.events({
        skip: Number(skip) || undefined,
        take: Number(take) || undefined,
        orderBy: orderBy ? { [orderBy]: 'asc' } : undefined,
        where,
      });
    }
  
    @Get(':id')
    async getEvent(@Param('id') id: string): Promise<Event> {
      const event = await this.eventService.event({ id: Number(id) });
      if (!event) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }
      return event;
    }
  
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @UseInterceptors(
      FileInterceptor('thumbnail', {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
      }),
    )
    async updateEvent(
      @Param('id') id: string,
      @Body() eventData: Event,
      @UploadedFile() file,
    ): Promise<Event> {
      if (file) {
        eventData.thumbnailUrl = file.path;
      }
      return this.eventService.updateEvent({
        where: { id: Number(id) },
        data: eventData,
      });
    }

    @Get('protected')
    @UseGuards(JwtAuthGuard)
    async protectedRoute(@Req() req) {
      console.log('User from JWT:', req.user);
      return { message: 'This is a protected route', user: req.user };
    }
  
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteEvent(
      @Param('id') id: string,
      @Body('password') password: string,
    ): Promise<{ message: string }> {
    try {
      this.logger.debug(`Attempting to delete event with ID: ${id}`);
      
      const user = this.eventService.getAuthenticatedUser();
      this.logger.debug(`User from request: ${JSON.stringify(user)}`);

      if (!user) {
        this.logger.error('No user found in request');
        throw new UnauthorizedException('Unauthorized');
      }

      const isPasswordValid = await this.eventService.validateUserPassword(user.id, password);
      if (!isPasswordValid) {
        this.logger.error('Invalid password provided');
        throw new ForbiddenException('Invalid password');
      }

      await this.eventService.deleteEvent({ id: Number(id) });
      this.logger.debug(`Event with ID ${id} has been deleted`);
      return { message: `Event with ID ${id} has been deleted.` };
    } catch (error) {
      this.logger.error(`Error deleting event: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to delete event: ${error.message}`);
    }
  }
  }