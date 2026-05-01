import { IsUUID } from 'class-validator';

export class ReprocessDocumentDto {
  @IsUUID()
  documentId: string;
}
