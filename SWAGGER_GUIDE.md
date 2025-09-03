# Swagger/OpenAPI Documentation Guide for LotLogic Backend

## Overview
This guide shows you how to document your NestJS API endpoints using Swagger decorators. Your API documentation will be available at `/api/docs` when you run your server.

## Basic Setup ✅
- Swagger packages installed: `@nestjs/swagger` and `swagger-ui-express`
- Main.ts configured with Swagger setup
- API documentation available at: `http://localhost:3000/api/docs`

## Current API Documentation Status ✅

### Documented Endpoints

#### Health & System (`health` tag)
- `GET /api` - API root endpoint
- `GET /api/health` - Health check endpoint

#### Estate Management (`estate` tag)
- `GET /api/estate` - Get all estates
- `GET /api/estate/:id` - Get estate by ID

#### Lot Management (`lot` tag)
- `GET /api/lot` - Get all lots
- `GET /api/lot/:id` - Get lot by ID

#### Floor Plan (`floor-plan` tag)
- `GET /api/house-design/:lot_id` - Filter house designs for a lot

#### Design on Lot (`design-on-lot` tag)
- `GET /api/design-on-lot/calculate` - Calculate design compatibility

#### Builder Management (`builder` tag)
- `GET /api/builders` - Get all builders
- `POST /api/builders` - Create new builder
- `GET /api/builders/:id` - Get builder by ID
- `PATCH /api/builders/:id` - Update builder
- `DELETE /api/builders/:id` - Delete builder

#### Enquiry Management (`enquiry` tag)
- `POST /api/enquiry` - Create new enquiry

#### Brand Configuration (`brand` tag)
- `GET /api/brand` - Get brand settings
- `POST /api/brand` - Create or update brand configuration

#### Mail Service (`mail` tag)
- `GET /api/mail` - Send test email

#### Facade Design (`facade` tag)
- Empty controller (placeholder for future endpoints)

## Available Swagger Decorators

### Controller Level Decorators

#### `@ApiTags(tag)`
Groups endpoints under a specific tag in the Swagger UI.
```typescript
@ApiTags('lot')
@Controller('lot')
export class LotController {}
```

### Endpoint Level Decorators

#### `@ApiOperation(options)`
Describes what the endpoint does.
```typescript
@ApiOperation({ 
  summary: 'Get all lots', 
  description: 'Retrieve a list of all available lots' 
})
```

#### `@ApiResponse(options)`
Documents possible response statuses.
```typescript
@ApiResponse({ status: 200, description: 'Successfully retrieved all lots' })
@ApiResponse({ status: 404, description: 'Lot not found' })
@ApiResponse({ status: 500, description: 'Internal server error' })
```

#### `@ApiBody(options)`
Documents the request body structure.
```typescript
@ApiBody({ 
  type: CreateEnquiryDto,
  description: 'Enquiry data including personal details and preferences'
})
```

#### `@ApiParam(options)`
Documents path parameters.
```typescript
@ApiParam({ 
  name: 'id', 
  description: 'The unique identifier of the lot', 
  type: 'string' 
})
```

#### `@ApiQuery(options)`
Documents query parameters.
```typescript
@ApiQuery({ 
  name: 'page', 
  description: 'Page number for pagination', 
  required: false,
  type: 'number' 
})
```

#### `@ApiHeader(options)`
Documents required headers.
```typescript
@ApiHeader({ 
  name: 'Authorization', 
  description: 'Bearer token for authentication' 
})
```

### DTO Classes

Create DTOs (Data Transfer Objects) to document request/response schemas:

#### Brand DTO Example (Current Implementation)
```typescript
export class UpsertBrandDto {
  @ApiProperty({
    description: 'Brand name',
    example: 'XYZ',
    type: 'string'
  })
  name: string;

  @ApiProperty({
    description: 'Brand title',
    example: 'XYZ',
    type: 'string'
  })
  title: string;

  @ApiProperty({
    description: 'Brand domain',
    example: 'localhost:3002',
    type: 'string'
  })
  domain: string;

  @ApiProperty({
    description: 'Brand logo URL',
    example: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0qCreqkTZL0F0bF9kZctFE1XVFocO__70kw&s',
    type: 'string'
  })
  logoUrl: string;

  @ApiProperty({
    description: 'Primary brand color in hex format',
    example: '#E4D00A',
    type: 'string'
  })
  primaryColor: string;

  @ApiProperty({
    description: 'Secondary brand color in hex format',
    example: '#8B8000',
    type: 'string'
  })
  secondaryColor: string;
}
```

#### Enquiry DTO Example
```typescript
export class CreateEnquiryDto {
  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  name: string;
  
  @ApiProperty({ description: 'Customer email', example: 'john@example.com' })
  email: string;
  
  @ApiProperty({ description: 'Phone number', example: '+1234567890' })
  number: string;
  
  @ApiProperty({ description: 'Selected builder IDs', type: [String] })
  builders: string[];
  
  @ApiProperty({ description: 'Additional comments', required: false })
  comments?: string;
  
  @ApiProperty({ description: 'Lot ID', example: 1 })
  lot_id: number;
  
  @ApiProperty({ description: 'House design ID' })
  house_design_id: string;
  
  @ApiProperty({ description: 'Facade ID' })
  facade_id: string;
}
```

## Complete Example

Here's a complete example of a documented controller:

```typescript
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';

@ApiTags('lot')
@Controller('lot')
export class LotController {
  
  @Get()
  @ApiOperation({ 
    summary: 'Get all lots', 
    description: 'Retrieve a paginated list of all available lots' 
  })
  @ApiQuery({ 
    name: 'page', 
    description: 'Page number', 
    required: false, 
    type: 'number' 
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Items per page', 
    required: false, 
    type: 'number' 
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved lots' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    // Implementation
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get lot by ID', 
    description: 'Retrieve a specific lot by its unique identifier' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'The unique identifier of the lot', 
    type: 'string' 
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved the lot' })
  @ApiResponse({ status: 404, description: 'Lot not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string) {
    // Implementation
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create new lot', 
    description: 'Create a new lot with the provided information' 
  })
  @ApiBody({ 
    type: CreateLotDto,
    description: 'Lot creation data' 
  })
  @ApiResponse({ status: 201, description: 'Lot created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() createLotDto: CreateLotDto) {
    // Implementation
  }
}
```

## Best Practices

1. **Use descriptive summaries**: Keep summaries concise but informative
2. **Provide detailed descriptions**: Explain what the endpoint does and any business logic
3. **Document all responses**: Include success and error responses
4. **Use proper DTOs**: Create DTOs for complex request/response structures
5. **Group related endpoints**: Use consistent tags across related controllers
6. **Include examples**: Use `@ApiProperty` with examples for better documentation
7. **Only document existing endpoints**: Don't add fake or placeholder endpoints

## Current Implementation Notes

- ✅ **All existing endpoints documented** with proper Swagger decorators
- ✅ **DTOs created** for request/response structures
- ✅ **Examples provided** for interactive testing
- ✅ **No fake endpoints** - only real, working APIs documented
- ✅ **Proper API tags** for organized documentation

## Next Steps

1. **Add new endpoints** as you develop them
2. **Update DTOs** when data structures change
3. **Add validation decorators** to your DTOs using `class-validator`
4. **Test your documentation** by visiting `/api/docs` in your browser
5. **Customize the Swagger UI** appearance if needed

## Useful Links

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Options](https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md)

## Example DTO with Validation

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNumber, IsOptional, IsArray, MinLength, MaxLength, Min } from 'class-validator';

export class CreateEnquiryDto {
  @ApiProperty({ 
    description: 'Customer name', 
    example: 'John Doe',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    description: 'Customer email', 
    example: 'john@example.com' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Phone number', 
    example: '+1234567890' 
  })
  @IsString()
  number: string;

  @ApiProperty({ 
    description: 'Selected builder IDs', 
    type: [String],
    example: ['builder1', 'builder2'] 
  })
  @IsArray()
  @IsString({ each: true })
  builders: string[];

  @ApiProperty({ 
    description: 'Additional comments', 
    required: false,
    example: 'I would like to discuss pricing options' 
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({ 
    description: 'Lot ID', 
    example: 1,
    minimum: 1 
  })
  @IsNumber()
  @Min(1)
  lot_id: number;

  @ApiProperty({ 
    description: 'House design ID',
    example: 'design-123' 
  })
  @IsString()
  house_design_id: string;

  @ApiProperty({ 
    description: 'Facade ID',
    example: 'facade-456' 
  })
  @IsString()
  facade_id: string;
}
```

This will give you comprehensive API documentation that developers can use to understand and test your API endpoints!
