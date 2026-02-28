import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn((dto) => 'This action adds a new user'),
    findAll: jest.fn(() => 'This action returns all users'),
    findOne: jest.fn((id) => `This action returns a #${id} user`),
    update: jest.fn((id, dto) => `This action updates a #${id} user`),
    remove: jest.fn((id) => `This action removes a #${id} user`),
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

  it('should create a user', () => {
    const dto: CreateUserDto = {
      username: 'test',
      password: 'pw',
      role: 'admin',
    } as any;
    expect(controller.create(dto)).toBe('This action adds a new user');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should find all users', () => {
    expect(controller.findAll()).toBe('This action returns all users');
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should find a user', () => {
    expect(controller.findOne('1')).toBe('This action returns a #1 user');
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update a user', () => {
    const dto: UpdateUserDto = { username: 'test' };
    expect(controller.update('1', dto)).toBe('This action updates a #1 user');
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should remove a user', () => {
    expect(controller.remove('1')).toBe('This action removes a #1 user');
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
