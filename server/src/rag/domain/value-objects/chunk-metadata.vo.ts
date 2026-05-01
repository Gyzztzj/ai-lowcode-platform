export interface ChunkMetadata {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  totalChunks: number;
  startPosition: number;
  endPosition: number;
  createdAt: Date;
  [key: string]: any;
}

export class ChunkMetadataVO {
  constructor(public readonly data: ChunkMetadata) {
    if (!data.documentId) {
      throw new Error('Chunk metadata must have documentId');
    }
  }

  get documentId(): string {
    return this.data.documentId;
  }

  get documentName(): string {
    return this.data.documentName || '';
  }

  get chunkIndex(): number {
    return this.data.chunkIndex;
  }

  get totalChunks(): number {
    return this.data.totalChunks;
  }

  toJSON(): ChunkMetadata {
    return { ...this.data };
  }

  static fromJSON(json: ChunkMetadata): ChunkMetadataVO {
    return new ChunkMetadataVO(json);
  }
}
