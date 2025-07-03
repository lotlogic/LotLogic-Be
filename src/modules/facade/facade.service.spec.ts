import { Test, TestingModule } from '@nestjs/testing';
import { FacadeService } from './facade.service';

describe('FacadeService', () => {
  let service: FacadeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FacadeService],
    }).compile();

    service = module.get<FacadeService>(FacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
