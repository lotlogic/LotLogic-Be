import { SetMetadata } from '@nestjs/common';

export interface BuilderScopeOptions {
  builderIdParam?: string;
  builderIdBody?: string;
  builderIdQuery?: string;
  floorPlanIdParam?: string;
  floorPlanIdBody?: string;
  floorPlanIdQuery?: string;
  facadeIdParam?: string;
  facadeIdBody?: string;
  facadeIdQuery?: string;
}

export const BUILDER_SCOPE_KEY = 'builder_scope';

export const BuilderScope = (options: BuilderScopeOptions) =>
  SetMetadata(BUILDER_SCOPE_KEY, options);
