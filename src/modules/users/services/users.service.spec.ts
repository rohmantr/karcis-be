import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { User } from '../entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUsersRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
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
      } as any),
    ).toBe('This action adds a new user');
  });

  it('should find all users', () => {
    expect(service.findAll()).toBe('This action returns all users');
  });

  it('should find a user', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 user');
  });

  it('should update a user', () => {
    expect(service.update(1, { username: 'updated' })).toBe(
      'This action updates a #1 user',
    );
  });

  it('should remove a user', () => {
    expect(service.remove(1)).toBe('This action removes a #1 user');
  });
});
