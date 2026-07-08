import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DetailService } from './detail.service';
import { Detail } from './entities/detail.entity';

interface MockDetailRepository {
  findOne: jest.Mock;
  find: jest.Mock;
}

describe('DetailService', () => {
  let service: DetailService;
  let detailRepository: MockDetailRepository;

  const fixture: Partial<Detail> = {
    hash_id: 'det-1',
    domain: 'manga',
    category: 'shonen',
    name: 'demo',
    cover: 'cover.jpg',
    title: 'Demo Title',
    intro: 'Intro',
    amount: 24,
    size: 1024,
    has_section: 0,
    is_orphan: 0,
    create_time: '2026-01-01 00:00:00',
    update_time: '2026-01-01 00:00:00',
    entities_json: '{}',
  };

  beforeEach(async () => {
    detailRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DetailService,
        {
          provide: getRepositoryToken(Detail, 'work-sqlite'),
          useValue: detailRepository,
        },
        {
          provide: getDataSourceToken('work-sqlite'),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DetailService>(DetailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('returns the detail when found', async () => {
      detailRepository.findOne.mockResolvedValue(fixture);

      const result = await service.findOne('det-1');

      expect(result).toEqual(fixture);
      expect(detailRepository.findOne).toHaveBeenCalledWith({
        where: { hash_id: 'det-1' },
      });
    });

    it('returns null when not found', async () => {
      detailRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('missing');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns every detail row from the repository', async () => {
      detailRepository.find.mockResolvedValue([fixture]);

      const result = await service.findAll();

      expect(result).toEqual([fixture]);
      expect(detailRepository.find).toHaveBeenCalledTimes(1);
    });

    it('returns an empty array when there are no rows', async () => {
      detailRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
