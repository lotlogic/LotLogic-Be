import { SetMetadata } from '@nestjs/common';

export interface EstateScopeOptions {
  estateIdParam?: string;
  estateIdBody?: string;
  estateIdQuery?: string;
  lotIdParam?: string;
  lotIdBody?: string;
  lotIdQuery?: string;
}

export const ESTATE_SCOPE_KEY = 'estate_scope';

export const EstateScope = (options: EstateScopeOptions) =>
  SetMetadata(ESTATE_SCOPE_KEY, options);
