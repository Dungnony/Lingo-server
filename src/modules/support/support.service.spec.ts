import type { PrismaService } from '../../infra/prisma/prisma.service';
import { SupportService } from './support.service';

function makePrisma() {
  return {
    supportFeedback: {
      create: jest.fn(),
    },
  };
}

describe('SupportService', () => {
  it('trims fields and stores null when email is empty or omitted', async () => {
    const prisma = makePrisma();
    prisma.supportFeedback.create.mockResolvedValue({
      id: 'fb-1',
      status: 'OPEN',
      createdAt: new Date('2026-11-22T05:00:00Z'),
    });
    const service = new SupportService(prisma as unknown as PrismaService);

    const res = await service.create({
      name: '  Thu Trang  ',
      email: '   ',
      topic: ' Đề xuất tính năng ',
      message: '  Lộ trình phần đầu hơi chậm  ',
    });

    expect(prisma.supportFeedback.create).toHaveBeenCalledWith({
      data: {
        name: 'Thu Trang',
        email: null,
        topic: 'Đề xuất tính năng',
        message: 'Lộ trình phần đầu hơi chậm',
      },
      select: { id: true, status: true, createdAt: true },
    });
    expect(res.status).toBe('OPEN');
  });
});
