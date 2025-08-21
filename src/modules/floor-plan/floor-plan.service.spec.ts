import { Test, TestingModule } from '@nestjs/testing';
import { FloorPlanService } from './floor-plan.service';

describe('FloorPlanService', () => {
  let service: FloorPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FloorPlanService],
    }).compile();

    service = module.get<FloorPlanService>(FloorPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
