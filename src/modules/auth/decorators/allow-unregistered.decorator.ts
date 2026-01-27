import { SetMetadata } from '@nestjs/common';

export const ALLOW_UNREGISTERED_KEY = 'allow_unregistered';

export const AllowUnregistered = () => SetMetadata(ALLOW_UNREGISTERED_KEY, true);

