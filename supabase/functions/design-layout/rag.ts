import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { EmbeddingProvider } from "./provider.ts";

export class RAGPipeline {
  constructor(
    private supabaseClient: SupabaseClient,
    private embeddingProvider: EmbeddingProvider
  ) {}

  async retrieveContext(prompt: string): Promise<string[]> {
    try {
      // 1. Generate embedding for the prompt
      const embedding = await this.embeddingProvider.embedQuery(prompt);

      // 2. Query Postgres via Supabase RPC
      const { data, error } = await this.supabaseClient.rpc("match_design_knowledge", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5
      });

      if (error || !data) {
        console.error("RAG Retrieval error:", error);
        return [];
      }

      // 3. Format the results
      return data.map((row: any) => `[${row.type.toUpperCase()}] ${row.title}\n${row.content}`);
    } catch (err) {
      console.error("RAG Pipeline error:", err);
      return [];
    }
  }
}
