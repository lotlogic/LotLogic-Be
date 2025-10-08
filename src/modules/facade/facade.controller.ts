import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('facade')
@Controller('facade')
export class FacadeController {}
