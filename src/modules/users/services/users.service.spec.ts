import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { EntityManager } from '@mikro-orm/core';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockEntityManager = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: '1', username: 'test' }),
    persistAndFlush: jest.fn(),
    flush: jest.fn(),
    create: jest.fn(),
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

  it('should create a user', () => {
    expect(
      service.create({
        username: 'test',
        password: 'password',
        role: 'admin',
      } as never),
    ).toBe('This action adds a new user');
  });

  it('should find all users', async () => {
    expect(await service.findAll()).toEqual([]);
  });

  it('should find a user', async () => {
    expect(await service.findOne('1')).toEqual({ id: '1', username: 'test' });
  });

  it('should update a user', () => {
    expect(service.update('1', { username: 'updated' })).toBe(
      'This action updates a #1 user',
    );
  });

  it('should remove a user', () => {
    expect(service.remove('1')).toBe('This action removes a #1 user');
  });
});
