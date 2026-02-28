import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { EntityManager } from '@mikro-orm/postgresql';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    findAllPaginated: jest
      .fn()
      .mockResolvedValue({ data: [], total: 0, limit: 10, offset: 0 }),
  };

  const mockEntityManager = {
    getRepository: jest.fn().mockReturnValue(mockUserRepository),
    findOne: jest.fn().mockResolvedValue({ id: '1', username: 'test' }),
    persistAndFlush: jest.fn(),
    flush: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all users with pagination via query builder', async () => {
    const query = { limit: 10, offset: 0 };
    const result = await service.findAll(query as any);
    expect(result).toEqual({ data: [], total: 0, limit: 10, offset: 0 });
    expect(mockEntityManager.getRepository).toHaveBeenCalledWith(User);
    expect(mockUserRepository.findAllPaginated).toHaveBeenCalledWith(query);
  });

  it('should find a user', async () => {
    expect(await service.findOne('1')).toEqual({ id: '1', username: 'test' });
  });
});
