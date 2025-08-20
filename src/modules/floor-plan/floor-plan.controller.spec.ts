import { Test, TestingModule } from '@nestjs/testing';
import { FloorPlanController } from './floor-plan.controller';

describe('FloorPlanController', () => {
  let controller: FloorPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FloorPlanController],
    }).compile();

    controller = module.get<FloorPlanController>(FloorPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
