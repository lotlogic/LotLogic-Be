import { Test, TestingModule } from '@nestjs/testing';
import { HouseDesignController } from './house-design.controller';

describe('HouseDesignController', () => {
  let controller: HouseDesignController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HouseDesignController],
    }).compile();

    controller = module.get<HouseDesignController>(HouseDesignController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
