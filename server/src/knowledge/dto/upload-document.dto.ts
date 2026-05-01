import { IsString, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  title: string;

  @IsUUID()
  knowledgeBaseId: string;
}
