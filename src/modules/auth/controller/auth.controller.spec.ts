import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { CreateAuthDto } from '../dto/create-auth.dto';
import { UpdateAuthDto } from '../dto/update-auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    create: jest.fn((dto) => 'This action adds a new auth'),
    findAll: jest.fn(() => 'This action returns all auth'),
    findOne: jest.fn((id) => `This action returns a #${id} auth`),
    update: jest.fn((id, dto) => `This action updates a #${id} auth`),
    remove: jest.fn((id) => `This action removes a #${id} auth`),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an auth', () => {
    const dto: CreateAuthDto = { username: 'test', password: 'pw' } as any;
    expect(controller.create(dto)).toBe('This action adds a new auth');
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should find all auth', () => {
    expect(controller.findAll()).toBe('This action returns all auth');
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should find an auth', () => {
    expect(controller.findOne('1')).toBe('This action returns a #1 auth');
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update an auth', () => {
    const dto: UpdateAuthDto = { username: 'updated' } as any;
    expect(controller.update('1', dto)).toBe('This action updates a #1 auth');
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('should remove an auth', () => {
    expect(controller.remove('1')).toBe('This action removes a #1 auth');
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
