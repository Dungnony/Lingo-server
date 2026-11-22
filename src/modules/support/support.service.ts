import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { CreateFeedbackDto } from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeedbackDto) {
    const email = dto.email?.trim() || null;
    return this.prisma.supportFeedback.create({
      data: {
        name: dto.name.trim(),
        email,
        topic: dto.topic.trim(),
        message: dto.message.trim(),
      },
      select: { id: true, status: true, createdAt: true },
    });
  }
}
