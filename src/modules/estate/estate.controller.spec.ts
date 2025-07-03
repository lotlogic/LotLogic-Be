import { Test, TestingModule } from '@nestjs/testing';
import { EstateController } from './estate.controller';

describe('EstateController', () => {
  let controller: EstateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstateController],
    }).compile();

    controller = module.get<EstateController>(EstateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
