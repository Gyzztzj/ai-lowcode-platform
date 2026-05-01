import { Injectable } from '@nestjs/common';

export interface Chunk {
  content: string;
  metadata: {
    chunkIndex: number;
    startPosition: number;
    endPosition: number;
  };
}

export interface SplitOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

@Injectable()
export class TextSplitterService {
  private readonly DEFAULT_CHUNK_SIZE = 500;
  private readonly DEFAULT_CHUNK_OVERLAP = 100;
  private readonly DEFAULT_SEPARATORS = [
    '\n\n',
    '\n',
    '。',
    '！',
    '？',
    '.',
    '!',
    '?',
    ' ',
    '',
  ];

  splitText(text: string, options: SplitOptions = {}): Chunk[] {
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const chunkOverlap = options.chunkOverlap || this.DEFAULT_CHUNK_OVERLAP;
    const separators = options.separators || this.DEFAULT_SEPARATORS;

    if (!text || text.trim().length === 0) {
      return [];
    }

    return this._splitTextRecursively(
      text,
      separators,
      chunkSize,
      chunkOverlap,
    );
  }

  private _splitTextRecursively(
    text: string,
    separators: string[],
    chunkSize: number,
    chunkOverlap: number,
    startPos: number = 0,
  ): Chunk[] {
    if (text.length <= chunkSize) {
      return [
        {
          content: text,
          metadata: {
            chunkIndex: 0,
            startPosition: startPos,
            endPosition: startPos + text.length,
          },
        },
      ];
    }

    const separator = separators[0];
    const remainingSeparators = separators.slice(1);
    const splits = this._splitWithSeparator(text, separator);

    const chunks: Chunk[] = [];
    let currentChunk = '';
    let currentStartPos = startPos;
    let chunkIndex = 0;

    for (const split of splits) {
      if (currentChunk.length + split.text.length > chunkSize) {
        if (currentChunk.length > 0) {
          chunks.push({
            content: currentChunk.trim(),
            metadata: {
              chunkIndex: chunkIndex++,
              startPosition: currentStartPos,
              endPosition: currentStartPos + currentChunk.length,
            },
          });

          currentChunk = this._getOverlapText(currentChunk, chunkOverlap);
          currentStartPos =
            currentStartPos + currentChunk.length - chunkOverlap;
        }
      }

      if (split.text.length > chunkSize) {
        if (remainingSeparators.length > 0) {
          const subChunks = this._splitTextRecursively(
            split.text,
            remainingSeparators,
            chunkSize,
            chunkOverlap,
            currentStartPos + currentChunk.length,
          );
          chunks.push(...subChunks);
          chunkIndex += subChunks.length;
        } else {
          chunks.push({
            content: split.text.trim(),
            metadata: {
              chunkIndex: chunkIndex++,
              startPosition: currentStartPos + currentChunk.length,
              endPosition:
                currentStartPos + currentChunk.length + split.text.length,
            },
          });
        }
        currentChunk = '';
      } else {
        currentChunk += split.text + separator;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          chunkIndex: chunkIndex,
          startPosition: currentStartPos,
          endPosition: currentStartPos + currentChunk.length,
        },
      });
    }

    return chunks;
  }

  private _splitWithSeparator(
    text: string,
    separator: string,
  ): Array<{ text: string; separator: string }> {
    if (!separator) {
      return text.split('').map((char) => ({ text: char, separator: '' }));
    }

    const parts = text.split(separator);
    return parts.map((part, i) => ({
      text: part,
      separator: i < parts.length - 1 ? separator : '',
    }));
  }

  private _getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) {
      return text;
    }
    return text.slice(-overlapSize);
  }
}
