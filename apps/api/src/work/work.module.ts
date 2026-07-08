import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Work } from './entities/work.entity';
import { WorkService } from './work.service';
import { WorkController } from './work.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Work], 'work-sqlite')],
  controllers: [WorkController],
  providers: [WorkService],
  exports: [WorkService],
})
export class WorkModule {}
