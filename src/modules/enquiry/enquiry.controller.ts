import { BuilderService } from '@modules/builder/builder.service';
import { EnquiryService } from '@modules/enquiry/enquiry.service';
import { FloorPlanService } from '@modules/floor-plan/floor-plan.service';
import { LotService } from '@modules/lot/lot.service';
import { MailService } from '@modules/mail/mail.service';
import { Body, Controller, Post } from '@nestjs/common';
@Controller('enquiry')
export class EnquiryController {
    constructor(
        private readonly enquiryService: EnquiryService,
        private readonly builderService: BuilderService,
        private readonly lotService: LotService,
        private readonly FloorPlanService: FloorPlanService,
        private readonly mailService: MailService
    ) { }

    @Post()
    async postEnquiryData(
        @Body('name') name: string,
        @Body('email') email: string,
        @Body('number') number: string,
        @Body('builders') builders: string[],
        @Body('comments') comments: string,
        @Body('lot_id') lot_id: number,
        @Body('house_design_id') house_design_id: string,
        @Body('facade_id') facade_id: string,
        @Body('hot_lead') hot_lead: boolean
    ) {
        await this.enquiryService.postEnquiry(
            name,
            email,
            number,
            comments,
            lot_id,
            house_design_id,
            facade_id,
            builders,
            hot_lead
        );
        const lotData = await this.lotService.findLot(lot_id);
        const houseDesignData = await this.FloorPlanService.getHouseDesignById(house_design_id);
        const builderData = await this.builderService.findByIds(builders);
        if(lotData && houseDesignData && builderData.length) {
            // Send individual emails to each builder
            for(const builder of builderData) {
                await this.mailService.sendEmail({
                    subject: hot_lead ? 'HOT LEAD: Lot Overview — Immediate Attention' : 'Lot Overview for Builder Selection',
                    template: 'builder-selection-email',
                    context: {
                        builderName: builder.name,
                        lotNumber: lotData.id,
                        lotAddress: lotData.address,
                        lotSize: lotData.areaSqm,
                        lotZoning: lotData.zoning,
                        lotStatus: lotData.lifecycleStage,
                        imageUrl: houseDesignData.floorplanUrl,
                        comments: comments,
                        hotLead: !!hot_lead

                    },
                    emailsList: builder.email,
                });
            }
        }
        return { message: "Posted"};
    }
}
