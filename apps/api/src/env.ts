/** Only what the Worker uses from Cloudflare, so tests can fake it. */
export interface PreparedStatement {
  bind(...values: readonly unknown[]): PreparedStatement;
  all<T>(): Promise<{ readonly results: readonly T[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface Database {
  prepare(sql: string): PreparedStatement;
  batch(statements: readonly PreparedStatement[]): Promise<readonly { readonly results?: readonly unknown[] }[]>;
}

export interface WorkersAi {
  run(model: string, input: { readonly text: readonly string[] }): Promise<{ readonly data: readonly (readonly number[])[] }>;
}

export interface VectorIndex {
  query(
    vector: readonly number[],
    options: { readonly topK: number; readonly filter?: Record<string, unknown>; readonly returnValues: boolean; readonly returnMetadata: 'none' },
  ): Promise<{ readonly matches: readonly { readonly id: string; readonly score: number }[] }>;
  upsert(vectors: readonly { readonly id: string; readonly values: readonly number[]; readonly metadata: Record<string, string | number> }[]): Promise<unknown>;
}

export interface Env {
  readonly DB: Database;
  readonly AI: WorkersAi;
  readonly VECTORS: VectorIndex;
  readonly MODEL_API_KEY: string;
  /** Only set while seeding the search index. Without it, the admin route stays closed. */
  readonly ADMIN_TOKEN?: string;
}
