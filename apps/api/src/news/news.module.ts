import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.service';
import { NewsRepository } from './news.repository';

@Module({
  imports: [PrismaModule],
  providers: [NewsRepository],
  exports: [NewsRepository],
})
export class NewsModule {}
