import { PrismaService } from '../../prisma/prisma.service';
export declare class EnquiryService {
    private prisma;
    constructor(prisma: PrismaService);
    postEnquiry(name: string, email: string, number: string, comments: string, lot_id: string, house_design_id: string, facade_id: string, builder: string[]): Promise<void>;
}
