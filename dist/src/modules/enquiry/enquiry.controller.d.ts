import { EnquiryService } from './enquiry.service';
import { MailService } from '../mail/mail.service';
import { BuilderService } from '../builder/builder.service';
import { LotService } from '../lot/lot.service';
import { HouseDesignService } from '../house-design/house-design.service';
export declare class EnquiryController {
    private readonly enquiryService;
    private readonly builderService;
    private readonly lotService;
    private readonly houseDesignService;
    private readonly mailService;
    constructor(enquiryService: EnquiryService, builderService: BuilderService, lotService: LotService, houseDesignService: HouseDesignService, mailService: MailService);
    postEnquiryData(name: string, email: string, number: string, builders: string[], comments: string, lot_id: string, house_design_id: string, facade_id: string): Promise<{
        message: string;
    }>;
}
