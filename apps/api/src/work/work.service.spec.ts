import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { WorkService } from './work.service';
import { Work } from './entities/work.entity';

describe('WorkService', () => {
  let service: WorkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkService,
        {
          provide: getRepositoryToken(Work, 'work-sqlite'),
          useValue: {},
        },
        {
          provide: getDataSourceToken('work-sqlite'),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WorkService>(WorkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
