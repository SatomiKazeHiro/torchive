import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

import { Domain } from './entities/domain.entity';
import { DomainService } from './domain.service';
import { CreateDomainDto } from './dto/create-domain.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { FindByPageDto } from '@/common/typeorm/find.dto';

@Controller('domains')
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Post()
  create(@Body() createDomainDto: CreateDomainDto) {
    return this.domainService.create(createDomainDto);
  }

  @Get()
  findAll() {
    return this.domainService.findAll();
  }

  @Get(':domain')
  findOne(@Param('domain') domain: string) {
    return this.domainService.findOne(domain);
  }

  @Patch(':domain')
  update(
    @Param('domain') domain: string,
    @Body() updateDomainDto: UpdateDomainDto,
  ) {
    return this.domainService.update(domain, updateDomainDto);
  }

  @Delete(':domain')
  remove(@Param('domain') domain: string) {
    return this.domainService.remove(domain);
  }

  @Post('/page')
  getPage(@Body() body: FindByPageDto<Domain>) {
    return this.domainService.findByPage(body);
  }
}
