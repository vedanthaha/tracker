import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { isValidSurface, Surface } from "./manifest.ts";
import { llmOutputSchema, SemanticValidator, LayoutSpec } from "./types.ts";
import { PatchEngine } from "./patch.ts";
import { RAGPipeline } from "./rag.ts";
import { GroqProvider, GeminiEmbeddingProvider } from "./provider.ts";
import { buildSystemPrompt } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-provider-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // 1. Authenticate user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // 2. Parse Request
    const { prompt, surface } = await req.json();
    const providerKey = req.headers.get("x-provider-key");

    if (!prompt || typeof prompt !== "string") throw new Error("Invalid prompt");
    if (prompt.length > 1000) throw new Error("Prompt exceeds maximum length of 1000 characters.");
    
    // Fallback to environment variable if the user didn't provide a key
    const resolvedProviderKey = providerKey || Deno.env.get("GROQ_API_KEY");
    if (!resolvedProviderKey) throw new Error("Missing provider key. Please set GROQ_API_KEY or provide it in the UI.");
    
    if (!isValidSurface(surface)) throw new Error("Invalid surface");

    // 3. Load authoritative current layout from DB
    const { data: layoutData, error: layoutError } = await supabaseClient
      .from("workspace_layouts")
      .select("layout_spec")
      .eq("user_id", user.id)
      .eq("surface", surface)
      .single();
      
    // If they have no saved layout, use a blank spec as baseline
    const currentLayout: LayoutSpec = layoutData?.layout_spec || {
      version: 1,
      surface,
      root: { type: "stack", direction: "col", children: [] }
    };

    // Temporarily hardcoded for testing because local Docker is unavailable
    const geminiKey = Deno.env.get("GEMINI_API_KEY") || "dummy_key";
    if (!geminiKey) {
      console.warn("Missing GEMINI_API_KEY for embedding generation.");
    }
    const embeddingProvider = new GeminiEmbeddingProvider(geminiKey);
    const rag = new RAGPipeline(supabaseClient, embeddingProvider);
    const ragContext = await rag.retrieveContext(prompt);

    // 5. Construct Prompts & Call Provider
    const systemPrompt = buildSystemPrompt(surface as Surface, ragContext);
    const provider = new GroqProvider(resolvedProviderKey, "openai/gpt-oss-120b");
    
    const startTime = Date.now();
    let llmOutput = await provider.generateLayout(systemPrompt, prompt, currentLayout);
    let repairAttempts = 0;

    // 6. Validation & Repair Loop (Max 1 retry)
    let finalLayout: LayoutSpec | null = null;
    let semanticError: string | null = null;

    for (let i = 0; i < 2; i++) {
      try {
        // Zod structure validation
        const parsedOutput = llmOutputSchema.parse(llmOutput);
        
        if (parsedOutput.action === "patch" && parsedOutput.patch) {
          finalLayout = PatchEngine.apply(currentLayout, parsedOutput.patch);
        } else if (parsedOutput.action === "create" && parsedOutput.layout) {
          finalLayout = parsedOutput.layout as LayoutSpec;
        } else {
          throw new Error("Missing layout or patch data based on action.");
        }

        // Semantic validation (Widgets, Depth, Surface Match)
        const semanticCheck = SemanticValidator.validate(finalLayout, surface as Surface);
        if (!semanticCheck.valid) {
          throw new Error(semanticCheck.error || "Semantic validation failed.");
        }

        // Success!
        semanticError = null;
        break; 

      } catch (err: any) {
        semanticError = err.message;
        if (i === 0) {
          repairAttempts++;
          const repairPrompt = `Your previous output was invalid: ${err.message}. Please fix it and return a valid JSON payload.`;
          llmOutput = await provider.generateLayout(systemPrompt, prompt + "\n\n" + repairPrompt, currentLayout);
        }
      }
    }

    if (semanticError || !finalLayout) {
      throw new Error(`Failed to generate a valid layout after repair attempt: ${semanticError}`);
    }

    // 7. Return Result (NO DB MUTATION)
    return new Response(
      JSON.stringify({
        previewLayout: finalLayout,
        explanation: llmOutput.explanation || "Layout generated successfully.",
        metadata: {
          model: "openai/gpt-oss-120b",
          actionTaken: llmOutput.action,
          generationTimeMs: Date.now() - startTime,
          repairAttempts
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    // Return raw error for debugging
    const safeError = error.message;
                      
    return new Response(JSON.stringify({ error: safeError, stack: error.stack }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message === "Unauthorized" ? 401 : 400,
    });
  }
});
