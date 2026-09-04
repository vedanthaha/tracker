import { createClient } from '@supabase/supabase-js';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!GEMINI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing GEMINI_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Generates a retrieval-query embedding for the supplied text.
 * @param {string} text - The text to embed.
 * @return {number[]} The 1,536-dimensional embedding vector.
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
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: 1536
    })
  });
  const data = await response.json();
  return data.embedding.values;
}

/**
 * Queries design knowledge using a command-line query and displays the most relevant results.
 */
async function run() {
  const query = process.argv[2] || "How do I show tasks on the home screen?";
  console.log(`Querying: "${query}"`);
  
  const embedding = await generateEmbedding(query);
  
  const { data, error } = await supabase.rpc("match_design_knowledge", {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 5
  });

  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`\nFound ${data.length} results:\n`);
  data.forEach((r, i) => {
    console.log(`[${i+1}] ${r.title} (Score: ${r.similarity.toFixed(3)})`);
    console.log(`    ${r.content.substring(0, 100)}...`);
  });
}

run();
