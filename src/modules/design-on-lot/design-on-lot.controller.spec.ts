import { Test, TestingModule } from '@nestjs/testing';
import { DesignOnLotController } from './design-on-lot.controller';

describe('DesignOnLotController', () => {
  let controller: DesignOnLotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DesignOnLotController],
    }).compile();

    controller = module.get<DesignOnLotController>(DesignOnLotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
