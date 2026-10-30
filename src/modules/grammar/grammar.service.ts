import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class GrammarService {
  constructor(private readonly prisma: PrismaService) {}

  /** Danh sách điểm ngữ pháp, lọc theo cấp độ nếu có. */
  async list(level?: number) {
    const points = await this.prisma.grammarPoint.findMany({
      where: level ? { level } : undefined,
      orderBy: [{ level: 'asc' }, { orderIndex: 'asc' }],
      select: {
        slug: true,
        level: true,
        titleVi: true,
        titleEn: true,
        summaryVi: true,
        explanationVi: true,
      },
    });
    // `flat` = mục đại cương (không có giải thích) → FE hiển thị gọn, không mở rộng.
    return points.map(({ explanationVi, ...p }) => ({
      ...p,
      flat: explanationVi.trim() === '',
    }));
  }

  /** Các cấp độ đang có điểm ngữ pháp + số lượng mỗi cấp. */
  async levels() {
    const rows = await this.prisma.grammarPoint.groupBy({
      by: ['level'],
      _count: { _all: true },
      orderBy: { level: 'asc' },
    });
    return rows.map((r) => ({ level: r.level, count: r._count._all }));
  }

  async get(slug: string) {
    const point = await this.prisma.grammarPoint.findUnique({
      where: { slug },
    });
    if (!point) throw new NotFoundException('Không tìm thấy điểm ngữ pháp');
    return point;
  }
}
