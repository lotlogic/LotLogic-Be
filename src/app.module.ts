import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EstateModule } from './modules/estate/estate.module';
import { LotModule } from './modules/lot/lot.module';
import { PlanModule } from './modules/plan/plan.module';
import { FacadeModule } from './modules/facade/facade.module';
import { EnquiryModule } from './modules/enquiry/enquiry.module';
import { ZoningModule } from './modules/zoning/zoning.module';
import { GeoModule } from './modules/geo/geo.module';

@Module({
  imports: [
    EstateModule,
    LotModule,
    PlanModule,
    FacadeModule,
    EnquiryModule,
    ZoningModule,
    GeoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
