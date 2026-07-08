import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Detail } from './entities/detail.entity';
import { DetailService } from './detail.service';
import { DetailController } from './detail.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Detail], 'work-sqlite')],
  controllers: [DetailController],
  providers: [DetailService],
  exports: [DetailService],
})
export class DetailModule {}
