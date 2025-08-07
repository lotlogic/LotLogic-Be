import { Test, TestingModule } from '@nestjs/testing';
import { DesignOnLotService } from './design-on-lot.service';

describe('DesignOnLotService', () => {
  let service: DesignOnLotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DesignOnLotService],
    }).compile();

    service = module.get<DesignOnLotService>(DesignOnLotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
