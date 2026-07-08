import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DomainService } from './domain.service';
import { Domain } from './entities/domain.entity';

type Stats = { workCount: number; totalAmount: number; totalSize: number };
type DomainWithStats = Domain & { stats: Stats };

interface MockDomainRepository {
  createQueryBuilder: jest.Mock;
  findOne: jest.Mock;
}

interface MockDataSource {
  query: jest.Mock;
}

type QB = {
  where: jest.Mock;
  leftJoinAndSelect: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  select: jest.Mock;
  andWhere: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
};

function makeQueryBuilder(data: unknown[], total: number): QB {
  return {
    where: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([data, total]),
  };
}

describe('DomainService', () => {
  let service: DomainService;
  let domainRepository: MockDomainRepository;
  let dataSource: MockDataSource;

  const fixtures: Partial<Domain>[] = [
    {
      domain: 'anime',
      name: '动画',
      state: 1,
      exist: 1,
    },
    {
      domain: 'manga',
      name: '漫画',
      state: 1,
      exist: 1,
    },
  ];

  beforeEach(async () => {
    domainRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainService,
        {
          provide: getRepositoryToken(Domain, 'work-sqlite'),
          useValue: domainRepository,
        },
        {
          provide: getDataSourceToken('work-sqlite'),
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<DomainService>(DomainService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByPage', () => {
    it('returns paginated domains without stats by default', async () => {
      const qb = makeQueryBuilder(fixtures, fixtures.length);
      domainRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByPage({ page: 1, limit: 10 });

      expect(result.data).toEqual(fixtures);
      expect(dataSource.query).not.toHaveBeenCalled();
      expect(qb.andWhere).toHaveBeenCalledWith('domain.exist = :exist', {
        exist: 1,
      });
    });

    it('joins against works_index / work_detail when withStats is true', async () => {
      const qb = makeQueryBuilder(fixtures, fixtures.length);
      domainRepository.createQueryBuilder.mockReturnValue(qb);
      dataSource.query.mockResolvedValue([
        {
          domainId: 'anime',
          workCount: 12,
          totalAmount: 100,
          totalSize: 4096,
        },
      ]);

      const result = await service.findByPage({
        page: 1,
        limit: 10,
        withStats: true,
      });

      const callArgs = dataSource.query.mock.calls[0] as [string, string[]];
      expect(callArgs[0]).toContain('FROM domains_index d');
      expect(callArgs[0]).toContain('LEFT JOIN works_index w');
      expect(callArgs[0]).toContain('LEFT JOIN work_detail det');
      expect(callArgs[0]).toContain('GROUP BY d.domain');
      expect(callArgs[1]).toEqual(['anime', 'manga']);

      const rows = result.data as DomainWithStats[];
      expect(rows[0].stats).toEqual({
        workCount: 12,
        totalAmount: 100,
        totalSize: 4096,
      });
      // manga was missing from the stats result → zero defaults
      expect(rows[1].stats).toEqual({
        workCount: 0,
        totalAmount: 0,
        totalSize: 0,
      });
    });

    it('coerces string aggregate values from sqlite to numbers', async () => {
      const qb = makeQueryBuilder([fixtures[0]], 1);
      domainRepository.createQueryBuilder.mockReturnValue(qb);
      dataSource.query.mockResolvedValue([
        {
          domainId: 'anime',
          workCount: '99',
          totalAmount: '2048',
          totalSize: '99999',
        },
      ]);

      const result = await service.findByPage({
        page: 1,
        limit: 10,
        withStats: true,
      });

      const rows = result.data as DomainWithStats[];
      expect(rows[0].stats).toEqual({
        workCount: 99,
        totalAmount: 2048,
        totalSize: 99999,
      });
    });

    it('returns pagination meta correctly', async () => {
      const qb = makeQueryBuilder(fixtures, 25);
      domainRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByPage({ page: 2, limit: 10 });

      expect(result.meta).toMatchObject({ page: 2, limit: 10, total: 25 });
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('returns the domain when found', async () => {
      domainRepository.findOne.mockResolvedValue(fixtures[0]);
      const result = await service.findOne('anime');
      expect(result).toEqual(fixtures[0]);
      expect(domainRepository.findOne).toHaveBeenCalledWith({
        where: { domain: 'anime' },
      });
    });

    it('returns null when not found', async () => {
      domainRepository.findOne.mockResolvedValue(null);
      const result = await service.findOne('nope');
      expect(result).toBeNull();
    });
  });
});
