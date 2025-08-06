import { Controller, Get, Post } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
    constructor(private readonly mailService: MailService) {}

    @Get()
    async sendMail() {
        await this.mailService.sendEmail({
            subject: 'Lot Overview for Builder Selection',
            template: 'builder-selection-email',
            context: {
                builderName: "Lakpa Lama",
                lotNumber: "Lot 42",
                lotAddress: "123 Main St, Springfield",
                lotSize: "450",
                lotZoning: "Residential",
                lotStatus: "Available",
                imageUrl: 'https://i.pinimg.com/originals/20/9d/6f/209d6f3896b1a9f4ff1c6fd53cd9e788.jpg',
            },
            emailsList: 'sherpalakpa443@gmail.com',
        });
        return { message: "Mail sent successfully" };
    }
}