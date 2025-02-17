import { Injectable, Inject, Scope, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Event, Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable({ scope: Scope.REQUEST })
export class EventService {
  private readonly logger = new Logger(EventService.name);
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  async event(
    eventWhereUniqueInput: Prisma.EventWhereUniqueInput,
  ): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: eventWhereUniqueInput,
    });
  }

  async events(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.EventWhereUniqueInput;
    where?: Prisma.EventWhereInput;
    orderBy?: Prisma.EventOrderByWithRelationInput;
  }): Promise<Event[]> {
    const { skip, take, cursor, where, orderBy } = params;
  
    // Ensure proper case-insensitive filtering on the "name" field
    const updatedWhere: Prisma.EventWhereInput = {
      ...where,
      name: where?.name
        ? { contains: where.name["contains"] ?? where.name, mode: "insensitive" }
        : undefined,
    };
  
    const events = await this.prisma.event.findMany({
      skip,
      take,
      cursor,
      where: Object.keys(updatedWhere).length > 0 ? updatedWhere : undefined, // Avoid empty object
      orderBy,
    });
  
    return events.map(event => ({
      ...event,
      thumbnailUrl: event.thumbnailUrl
        ? `http://localhost:3000/${event.thumbnailUrl.replace(/\\/g, '/')}`
        : null,
    }));
  }
  

  async createEvent(data: Prisma.EventCreateInput): Promise<Event> {
    if (data.thumbnailUrl) {
      data.thumbnailUrl = data.thumbnailUrl;
    }
  
    return this.prisma.event.create({ data });
  }

  async updateEvent(params: { where: Prisma.EventWhereUniqueInput; data: Prisma.EventUpdateInput }): Promise<Event> {
    const { where, data } = params;
  
    if (data.thumbnailUrl) {
      data.thumbnailUrl = data.thumbnailUrl;
    }
  
    return this.prisma.event.update({ where, data });
  }

  async deleteEvent(where: Prisma.EventWhereUniqueInput): Promise<Event> {
    this.logger.debug(`Deleting event: ${JSON.stringify(where)}`);
    try {
      const deletedEvent = await this.prisma.event.delete({ where });
      this.logger.debug(`Event deleted successfully: ${JSON.stringify(deletedEvent)}`);
      return deletedEvent;
    } catch (error) {
      this.logger.error(`Error deleting event: ${error.message}`, error.stack);
      throw error;
    }
  }

  getAuthenticatedUser(): User | null {
    const user = this.request.user as User;
    this.logger.debug(`Authenticated user: ${JSON.stringify(user)}`);
    return user;
  }
  
  async validateUserPassword(userId: number, password: string): Promise<boolean> {
    this.logger.debug(`Validating password for user ID: ${userId}`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      this.logger.error(`User with ID ${userId} not found`);
      return false;
    }
    const isValid = await bcrypt.compare(password, user.password);
    this.logger.debug(`Password validation result: ${isValid}`);
    return isValid;
  }
}