import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Auth } from '../entities/auth.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockAuthRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Auth),
          useValue: mockAuthRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an auth', () => {
    expect(service.create({ username: 'test', password: 'pw' } as any)).toBe('This action adds a new auth');
  });

  it('should find all auth', () => {
    expect(service.findAll()).toBe('This action returns all auth');
  });

  it('should find an auth', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 auth');
  });

  it('should update an auth', () => {
    expect(service.update(1, { username: 'updated' } as any)).toBe('This action updates a #1 auth');
  });

  it('should remove an auth', () => {
    expect(service.remove(1)).toBe('This action removes a #1 auth');
  });
});
