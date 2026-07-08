import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Domain } from './entities/domain.entity';
import { DomainService } from './domain.service';
import { DomainController } from './domain.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Domain], 'work-sqlite')], // 使用实体+连接名
  controllers: [DomainController],
  providers: [DomainService],
  exports: [DomainService],
})
export class DomainModule {}
