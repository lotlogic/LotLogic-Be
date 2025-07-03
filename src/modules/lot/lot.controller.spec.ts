import { Test, TestingModule } from '@nestjs/testing';
import { LotController } from './lot.controller';

describe('LotController', () => {
  let controller: LotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotController],
    }).compile();

    controller = module.get<LotController>(LotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
