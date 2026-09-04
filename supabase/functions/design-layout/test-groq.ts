import { GroqProvider } from "./provider.ts";
import { generateLayoutPrompt } from "./prompts.ts";
import { LayoutSchema } from "./types.ts";

async function main() {
  const providerKey = process.env.GROQ_API_KEY || "dummy_key";
  const provider = new GroqProvider(providerKey);

  const promptText = generateLayoutPrompt(
    "make the frontend look professional and glass morphic",
    "home",
    null,
    "No contextual knowledge provided for test."
  );

  console.log("Generating...");
  try {
    const rawResult = await provider.generateStructuredLayout(promptText);
    console.log("Raw Result:", rawResult);

    const parsed = LayoutSchema.safeParse(rawResult);
    if (!parsed.success) {
      console.error("Zod Validation Failed:", parsed.error);
    } else {
      console.log("Zod Validation Passed!");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
