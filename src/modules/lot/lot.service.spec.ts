import { Test, TestingModule } from '@nestjs/testing';
import { LotService } from './lot.service';

describe('LotService', () => {
  let service: LotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LotService],
    }).compile();

    service = module.get<LotService>(LotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
