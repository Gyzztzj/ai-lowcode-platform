import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class CrawlUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;
}
