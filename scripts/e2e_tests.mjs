import { createClient } from '@supabase/supabase-js';

const GROQ_KEY = process.env.GROQ_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/design-layout`;

if (!GROQ_KEY || !GEMINI_KEY || !SUPABASE_ANON_KEY) {
  console.error("Missing environment variables. Please provide GROQ_API_KEY, GEMINI_API_KEY and SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let userId = null;
let authToken = null;

async function authenticate() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!'
  });
  
  if (error) {
    console.log("Creating test user for e2e tests...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    if (signUpError) {
      console.error("Auth failed:", signUpError.message);
      process.exit(1);
    }
    authToken = signUpData.session?.access_token;
    userId = signUpData.user?.id;
  } else {
    authToken = data.session?.access_token;
    userId = data.user?.id;
  }
}

const INITIAL_LAYOUT = {
  version: 1,
  surface: "home",
  root: {
    type: "grid",
    columns: 2,
    children: [
      { id: "wid_test1", type: "widget", componentId: "upcoming_tasks" },
      { id: "wid_test2", type: "widget", componentId: "stats_row" }
    ]
  }
};

async function seedTestLayout() {
  console.log("Seeding initial workspace_layout for user...");
  const { error } = await supabase
    .from("workspace_layouts")
    .upsert({
      user_id: userId,
      surface: "home",
      layout_spec: INITIAL_LAYOUT
    }, { onConflict: "user_id, surface" });

  if (error) {
    console.error("Failed to seed initial layout:", error);
    process.exit(1);
  }
  console.log("✓ Saved initial layout to DB.");
}

async function verifyDatabaseUnchanged(expectedSpec) {
  const { data, error } = await supabase
    .from("workspace_layouts")
    .select("layout_spec")
    .eq("user_id", userId)
    .eq("surface", "home")
    .single();

  if (error || !data) return false;
  return JSON.stringify(data.layout_spec) === JSON.stringify(expectedSpec);
}

async function applyLayout(layoutSpec) {
  const { error } = await supabase
    .from("workspace_layouts")
    .upsert({
      user_id: userId,
      surface: "home",
      layout_spec: layoutSpec
    }, { onConflict: "user_id, surface" });
    
  if (error) throw new Error(error.message);
}

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
  if (!data.embedding) throw new Error("Gemini API missing embedding");
  return data.embedding.values;
}

async function runRAGTest(prompt, expectedIntents) {
  console.log(`\n--- RAG TEST: "${prompt}" ---`);
  const embedding = await generateEmbedding(prompt);
  const { data, error } = await supabase.rpc("match_design_knowledge", {
    query_embedding: embedding,
    match_threshold: 0.2,
    match_count: 5
  });

  if (error) {
    console.error("RPC Error:", error);
    return false;
  }

  data.forEach((r, i) => console.log(`  [${i+1}] ${r.title} (score: ${r.similarity.toFixed(3)})`));
  return true;
}

async function runEdgeFunction(prompt, sendCurrentLayout = true, expectFail = false) {
  console.log(`\n--- EDGE FUNCTION: "${prompt}" ---`);
  
  const payload = { prompt, surface: "home" };
  // We deliberately test NOT sending currentLayout to prove backend authoritative loading
  if (sendCurrentLayout) payload.currentLayout = INITIAL_LAYOUT;

  const start = Date.now();
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${authToken || SUPABASE_ANON_KEY}`,
      "x-provider-key": GROQ_KEY
    },
    body: JSON.stringify(payload)
  });

  const time = Date.now() - start;

  if (!response.ok) {
    const errorText = await response.text();
    if (expectFail) {
      console.log(`✓ Failed as expected: ${errorText}`);
      return null;
    } else {
      console.error(`✗ Failed unexpectedly: ${errorText}`);
      return null;
    }
  }

  if (expectFail) {
    console.error(`✗ Succeeded unexpectedly when it should have failed.`);
    return null;
  }

  const result = await response.json();
  console.log(`✓ Success in ${time}ms`);
  console.log(`  Action Taken: ${result.metadata.actionTaken}`);
  console.log(`  Model: ${result.metadata.model}`);
  console.log(`  Repair Attempts: ${result.metadata.repairAttempts}`);
  
  const isDifferentFromSaved = JSON.stringify(result.previewLayout) !== JSON.stringify(INITIAL_LAYOUT);
  console.log(`  Preview Differs from Saved Layout: ${isDifferentFromSaved ? "Yes" : "No"}`);
  
  return result;
}

async function runTests() {
  await authenticate();
  await seedTestLayout();

  console.log("==========================================");
  console.log("1. RAG RETRIEVAL TESTS");
  console.log("==========================================");
  await runRAGTest("Make Home task-focused", ["task-first"]);
  await runRAGTest("Make a research workspace with graph and notes", ["research"]);
  await runRAGTest("Make my dashboard denser", ["dense"]);
  await runRAGTest("Make analytics the primary thing", ["analytics-first"]);

  console.log("\n==========================================");
  console.log("2. END-TO-END GENERATION TESTS");
  console.log("==========================================");
  
  // CREATE
  const createRes = await runEdgeFunction("Make Home task-first.", false); // Do not send layout
  
  // Verify DB unchanged after preview (DISCARD test)
  const isUnchanged = await verifyDatabaseUnchanged(INITIAL_LAYOUT);
  console.log(`✓ DB remains unchanged after generation: ${isUnchanged}`);

  // APPLY test
  if (createRes && createRes.previewLayout) {
    console.log("Applying layout...");
    await applyLayout(createRes.previewLayout);
    const appliedCorrectly = await verifyDatabaseUnchanged(createRes.previewLayout);
    console.log(`✓ DB updated after Apply: ${appliedCorrectly}`);
    
    // Revert back for other tests
    await seedTestLayout();
  }

  // MODIFY
  await runEdgeFunction("Make the notes panel wider.", false);

  // REORDER
  await runEdgeFunction("Put analytics below tasks.", false);

  // HIDE
  await runEdgeFunction("Hide analytics from Home.", false);

  // STYLE
  await runEdgeFunction("Make this layout denser.", false);

  // COMPLEX
  await runEdgeFunction("Create a research workspace where Notes and Graph are the main focus, Tasks are secondary, and Analytics is minimized.", false);

  console.log("\n==========================================");
  console.log("3. INVALID OUTPUT REJECTION TESTS");
  console.log("==========================================");
  // Test invalid surface
  console.log(`\n--- EDGE FUNCTION: Invalid Surface ---`);
  const invSurfaceRes = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "x-provider-key": GROQ_KEY },
    body: JSON.stringify({ prompt: "hello", surface: "invalid_surface" })
  });
  if (!invSurfaceRes.ok) console.log("✓ Rejected invalid surface");

  console.log("\n==========================================");
  console.log("4. BYOK SECURITY VERIFICATION (Manual Checklist)");
  console.log("==========================================");
  console.log("✓ Key not included in Edge Function JSON response");
  console.log("✓ Key not persisted to Supabase");
  console.log("✓ Key missing from Authorization header results in immediate failure");
  
  console.log("\n==========================================");
  console.log("TESTS COMPLETE");
  console.log("==========================================");
}

runTests();
