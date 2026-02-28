import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { UserRepository } from '../../users/repositories/user.repository';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: 'UserRepository',
          useValue: userRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return user', async () => {
    const payload = { sub: '1', email: 'test@test.com' };
    const user = { id: '1', email: 'test@test.com' };
    userRepository.findOne.mockResolvedValue(user);

    const result = await strategy.validate(payload);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      id: '1',
      email: 'test@test.com',
    });
    expect(result).toEqual(user);
  });

  it('should throw UnauthorizedException if user not found', async () => {
    const payload = { sub: '1', email: 'test@test.com' };
    userRepository.findOne.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
