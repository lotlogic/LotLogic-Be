import { Test, TestingModule } from '@nestjs/testing';
import { EnquiryController } from './enquiry.controller';

describe('EnquiryController', () => {
  let controller: EnquiryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnquiryController],
    }).compile();

    controller = module.get<EnquiryController>(EnquiryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
