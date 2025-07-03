import { Test, TestingModule } from '@nestjs/testing';
import { FacadeController } from './facade.controller';

describe('FacadeController', () => {
  let controller: FacadeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacadeController],
    }).compile();

    controller = module.get<FacadeController>(FacadeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
