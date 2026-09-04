import { LLMOutput } from "./types.ts";

export interface AIProvider {
  generateLayout(systemPrompt: string, userPrompt: string, currentLayout: any): Promise<LLMOutput>;
}

export interface EmbeddingProvider {
  embedDocument(text: string): Promise<number[]>;
  embedQuery(text: string): Promise<number[]>;
  getDimensions(): number;
}

export class GroqProvider implements AIProvider {
  // Using openai/gpt-oss-120b which is the largest available model on this tier for best JSON reasoning
  constructor(private apiKey: string, private model: string = "openai/gpt-oss-120b") {}

  async generateLayout(systemPrompt: string, userPrompt: string, currentLayout: any): Promise<LLMOutput> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `CURRENT LAYOUT:\n${JSON.stringify(currentLayout)}\n\nUSER REQUEST: ${userPrompt}\n\nIMPORTANT: Return ONLY valid JSON wrapped in \`\`\`json ... \`\`\` blocks, and no other text or reasoning.` }
        ],
        temperature: 0.2,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq Error:", errorText);
      throw new Error(`Groq API Error: ${errorText}`);
    }

    const data = await response.json();
    try {
      let content = data.choices[0].message.content;
      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }
      return JSON.parse(content) as LLMOutput;
    } catch (err) {
      throw new Error("Failed to parse LLM structured output.");
    }
  }
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private url: string;
  constructor(private apiKey: string, private model: string = "gemini-embedding-2") {
    this.url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;
  }

  getDimensions(): number {
    return 1536;
  }

  async embedDocument(text: string): Promise<number[]> {
    return this.embed(text, "RETRIEVAL_DOCUMENT");
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embed(text, "RETRIEVAL_QUERY");
  }

  private async embed(text: string, taskType: string): Promise<number[]> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: `models/${this.model}`,
        content: {
          parts: [{ text }]
        },
        taskType: taskType,
        outputDimensionality: this.getDimensions()
      })
    });

    if (!response.ok) {
      console.error("Gemini Embedding Error:", await response.text());
      throw new Error("Failed to generate embeddings via Gemini.");
    }

    const data = await response.json();
    if (!data.embedding || !data.embedding.values || data.embedding.values.length !== this.getDimensions()) {
      throw new Error(`Invalid embedding returned from Gemini. Expected ${this.getDimensions()} dims.`);
    }

    return data.embedding.values;
  }
}
