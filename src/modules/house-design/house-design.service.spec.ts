import { Test, TestingModule } from '@nestjs/testing';
import { HouseDesignService } from './house-design.service';

describe('HouseDesignService', () => {
  let service: HouseDesignService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HouseDesignService],
    }).compile();

    service = module.get<HouseDesignService>(HouseDesignService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
