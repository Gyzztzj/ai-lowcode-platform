import { IsUUID } from 'class-validator';

export class BatchUploadDto {
  @IsUUID()
  knowledgeBaseId: string;
}
