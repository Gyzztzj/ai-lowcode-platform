export class EmbeddingVector {
  constructor(public readonly values: number[]) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Embedding vector must be a non-empty array');
    }
  }

  get dimension(): number {
    return this.values.length;
  }

  toJSON(): number[] {
    return [...this.values];
  }

  static fromJSON(json: number[]): EmbeddingVector {
    return new EmbeddingVector(json);
  }

  equals(other: EmbeddingVector): boolean {
    if (this.dimension !== other.dimension) return false;
    return this.values.every((v, i) => Math.abs(v - other.values[i]) < 1e-9);
  }

  dotProduct(other: EmbeddingVector): number {
    if (this.dimension !== other.dimension) {
      throw new Error('Vectors must have same dimension for dot product');
    }
    return this.values.reduce((sum, v, i) => sum + v * other.values[i], 0);
  }

  cosineSimilarity(other: EmbeddingVector): number {
    const dot = this.dotProduct(other);
    const norm1 = Math.sqrt(this.values.reduce((sum, v) => sum + v * v, 0));
    const norm2 = Math.sqrt(other.values.reduce((sum, v) => sum + v * v, 0));
    if (norm1 === 0 || norm2 === 0) return 0;
    return dot / (norm1 * norm2);
  }
}
