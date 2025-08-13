import { Controller, Post, Body } from '@nestjs/common';
import { EnquiryService } from './enquiry.service';
import { MailService } from '../mail/mail.service';
import { BuilderService } from '../builder/builder.service';
import { LotService } from '../lot/lot.service';
import { HouseDesignService } from '../house-design/house-design.service';
@Controller('enquiry')
export class EnquiryController {
    constructor(
        private readonly enquiryService: EnquiryService,
        private readonly builderService: BuilderService,
        private readonly lotService: LotService,
        private readonly houseDesignService: HouseDesignService,
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
        @Body('facade_id') facade_id: string
    ) {
        await this.enquiryService.postEnquiry(
            name,
            email,
            number,
            comments,
            lot_id,
            house_design_id,
            facade_id,
            builders
        );
        const lotData = await this.lotService.findLot(lot_id);
        const houseDesignData = await this.houseDesignService.getHouseDesignById(house_design_id);
        const builderData = await this.builderService.findByIds(builders);
        if(lotData && houseDesignData && builderData.length) {
            await this.mailService.sendEmail({
                subject: 'Lot Overview for Builder Selection',
                template: 'builder-selection-email',
                context: {
                    builderName: "Concern",
                    lotNumber: lotData.id,
                    lotAddress: lotData.address,
                    lotSize: lotData.areaSqm,
                    lotZoning: "Residential",
                    lotStatus: "Available",
                    imageUrl: houseDesignData.floorplanUrl
                },
                emailsList: builderData.map((builder: { email }) => { return builder.email }).toString(),
            });
        }
        return { message: "Posted"};
    }
}
