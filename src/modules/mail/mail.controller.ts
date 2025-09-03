import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MailService } from '@modules/mail/mail.service';

@ApiTags('mail')
@Controller('mail')
export class MailController {
    constructor(private readonly mailService: MailService) {}

    @Get()
    @ApiOperation({ 
        summary: 'Send test email', 
        description: 'Send a test email using the builder selection template with sample data' 
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Test email sent successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Mail sent successfully' }
            }
        }
    })
    @ApiResponse({ status: 500, description: 'Internal server error or email sending failed' })
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