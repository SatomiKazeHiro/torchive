import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';

type Stats = { workCount: number; totalAmount: number; totalSize: number };
type CategoryWithStats = Category & { stats: Stats };

interface MockCategoryRepository {
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

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: MockCategoryRepository;
  let dataSource: MockDataSource;

  const fixtures: Partial<Category>[] = [
    {
      hash_id: 'cat-1',
      category: 'seasonal',
      name: 'Seasonal',
      domain: 'anime',
      work_page_template: 'mixture',
      state: 1,
      exist: 1,
    },
    {
      hash_id: 'cat-2',
      category: 'movie',
      name: 'Movie',
      domain: 'anime',
      work_page_template: 'video',
      state: 1,
      exist: 1,
    },
  ];

  beforeEach(async () => {
    categoryRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };
    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category, 'work-sqlite'),
          useValue: categoryRepository,
        },
        {
          provide: getDataSourceToken('work-sqlite'),
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByPage', () => {
    it('returns paginated categories without stats when withStats is false/missing', async () => {
      const qb = makeQueryBuilder(fixtures, fixtures.length);
      categoryRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByPage({ page: 1, limit: 10 });

      expect(result.data).toEqual(fixtures);
      expect(result.meta.total).toBe(2);
      expect(dataSource.query).not.toHaveBeenCalled();
      expect(qb.andWhere).toHaveBeenCalledWith('category.exist = :exist', {
        exist: 1,
      });
    });

    it('applies domain filter when provided', async () => {
      const qb = makeQueryBuilder([fixtures[0]], 1);
      categoryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findByPage({ page: 1, limit: 10, domain: 'anime' });

      expect(qb.andWhere).toHaveBeenCalledWith('category.domain = :domain', {
        domain: 'anime',
      });
    });

    it('attaches stats to each row when withStats is true and rows exist', async () => {
      const qb = makeQueryBuilder(fixtures, fixtures.length);
      categoryRepository.createQueryBuilder.mockReturnValue(qb);
      dataSource.query.mockResolvedValue([
        {
          categoryId: 'cat-1',
          workCount: 7,
          totalAmount: 42,
          totalSize: 1024,
        },
        {
          categoryId: 'cat-2',
          workCount: '3',
          totalAmount: '15',
          totalSize: '512',
        },
      ]);

      const result = await service.findByPage({
        page: 1,
        limit: 10,
        withStats: true,
      });

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      const callArgs = dataSource.query.mock.calls[0] as [string, string[]];
      expect(callArgs[0]).toContain('FROM categories_index c');
      expect(callArgs[0]).toContain('GROUP BY c.hash_id');
      expect(callArgs[1]).toEqual(['cat-1', 'cat-2']);

      const rows = result.data as CategoryWithStats[];
      expect(rows[0].stats).toEqual({
        workCount: 7,
        totalAmount: 42,
        totalSize: 1024,
      });
      // Aggregate values come back as strings from sqlite — must be coerced
      expect(rows[1].stats).toEqual({
        workCount: 3,
        totalAmount: 15,
        totalSize: 512,
      });
    });

    it('fills zero defaults for categories missing from the stats query', async () => {
      const qb = makeQueryBuilder(fixtures, fixtures.length);
      categoryRepository.createQueryBuilder.mockReturnValue(qb);
      // only cat-1 returned by stats query
      dataSource.query.mockResolvedValue([
        {
          categoryId: 'cat-1',
          workCount: 5,
          totalAmount: 10,
          totalSize: 100,
        },
      ]);

      const result = await service.findByPage({
        page: 1,
        limit: 10,
        withStats: true,
      });

      const rows = result.data as CategoryWithStats[];
      expect(rows[0].stats).toEqual({
        workCount: 5,
        totalAmount: 10,
        totalSize: 100,
      });
      expect(rows[1].stats).toEqual({
        workCount: 0,
        totalAmount: 0,
        totalSize: 0,
      });
    });

    it('skips stats query entirely when result set is empty', async () => {
      const qb = makeQueryBuilder([], 0);
      categoryRepository.createQueryBuilder.mockReturnValue(qb);

      await service.findByPage({ page: 1, limit: 10, withStats: true });

      expect(dataSource.query).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns the category when found', async () => {
      categoryRepository.findOne.mockResolvedValue(fixtures[0]);
      const result = await service.findOne('cat-1');
      expect(result).toEqual(fixtures[0]);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { hash_id: 'cat-1' },
      });
    });

    it('returns null when not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);
      const result = await service.findOne('nope');
      expect(result).toBeNull();
    });
  });
});
