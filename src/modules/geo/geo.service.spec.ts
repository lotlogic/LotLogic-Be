import { Test, TestingModule } from '@nestjs/testing';
import { GeoService } from '@modules/geo/geo.service';
import { PrismaService } from '@/prisma/prisma.service';
import { LotCheckRulesService } from '@modules/geo/lotcheck-rules.service';

describe('GeoService', () => {
  let service: GeoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: LotCheckRulesService,
          useValue: {
            extractZoneCodeFromBlockLandUsePolicyZones: () => null,
            getRulesForZone: () => [],
          },
        },
      ],
    }).compile();

    service = module.get<GeoService>(GeoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
