import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn((query) => ({
      data: [],
      total: 0,
      limit: query.limit,
      offset: query.offset,
    })),
    findOne: jest.fn((id) => `This action returns a #${id} user`),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find all users', () => {
    const query = { limit: 10, offset: 0 };
    expect(controller.findAll(query as any)).toEqual({
      data: [],
      total: 0,
      limit: query.limit,
      offset: query.offset,
    });
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should find a user', () => {
    expect(controller.findOne('1')).toBe('This action returns a #1 user');
    expect(service.findOne).toHaveBeenCalledWith('1');
  });
});
