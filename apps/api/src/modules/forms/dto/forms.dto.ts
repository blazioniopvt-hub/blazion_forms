import { IsString, IsOptional, IsArray, IsBoolean, IsObject, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFormDto {
  @IsString()
  workspaceId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateFormDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  totalPages?: number;

  @IsObject()
  @IsOptional()
  themeSettings?: any;

  @IsObject()
  @IsOptional()
  settings?: any;

  @IsOptional()
  conditionalLogic?: any;

  @IsString()
  @IsOptional()
  customCss?: string;

  @IsString()
  @IsOptional()
  thankYouMessage?: string;

  @IsString()
  @IsOptional()
  redirectUrl?: string;
}

export class UpdateFormFieldsDto {
  @IsArray()
  fields: {
    id?: string;
    type: string;
    label: string;
    description?: string;
    placeholder?: string;
    required: boolean;
    orderIndex: number;
    pageNumber: number;
    properties?: any;
    validation?: any;
    conditional?: any;
  }[];
}
