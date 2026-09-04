import { createClient } from '@supabase/supabase-js';
import { designCorpus } from './corpus.mjs';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!GEMINI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing environment variables. Please provide GEMINI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Generates a 1,536-dimensional document embedding for the supplied text.
 * @param {string} text - The text to embed.
 * @return {number[]} The embedding values.
 * @throws {Error} If the Gemini API request fails.
 */
async function generateEmbedding(text) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GEMINI_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "models/gemini-embedding-2",
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: 1536
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${await response.text()}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

/**
 * Seeds the design knowledge table with embeddings for each corpus entry.
 *
 * Processes entries independently and continues after individual failures.
 */
async function seed() {
  console.log(`Starting seed process for ${designCorpus.length} design knowledge entries using Gemini Embeddings...`);
  let successCount = 0;

  for (const entry of designCorpus) {
    try {
      // We embed a combination of title and content for better retrieval
      const embedding = await generateEmbedding(`[${entry.type.toUpperCase()}] ${entry.title}\n${entry.content}`);
      
      if (!embedding || embedding.length !== 1536) {
        throw new Error(`Invalid embedding dimension. Expected 1536, got ${embedding?.length}`);
      }

      // Upsert using the canonical ID
      const { error, data } = await supabase
        .from('design_knowledge')
        .upsert({
          id: entry.id,
          type: entry.type,
          title: entry.title,
          content: entry.content,
          metadata: entry.metadata,
          embedding: embedding
        }, {
          onConflict: 'id'
        })
        .select();

      if (error) {
        throw new Error(error.message);
      }

      console.log(`✓ Upserted: "${entry.title}" (${entry.id})`);
      successCount++;
      
      // Small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.error(`✗ Failed to seed "${entry.title}":`, err.message);
    }
  }

  console.log(`\nSeed complete! Processed ${successCount} entries successfully.`);
}

seed();
