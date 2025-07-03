import { Test, TestingModule } from '@nestjs/testing';
import { ZoningService } from './zoning.service';

describe('ZoningService', () => {
  let service: ZoningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZoningService],
    }).compile();

    service = module.get<ZoningService>(ZoningService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
