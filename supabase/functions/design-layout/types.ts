import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { Surface, getWidgetsForSurface } from "./manifest.ts";

// -----------------------------------------------------
// 1. Zod Schemas for the LayoutSpec
// -----------------------------------------------------

// Recursive type requires z.lazy
const layoutNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal("widget"),
      widgetId: z.string(),
      id: z.string().optional(),
      props: z.record(z.any()).optional(),
    }),
    z.object({
      type: z.literal("grid"),
      columns: z.number().min(1).max(12),
      gap: z.enum(["sm", "md", "lg"]).optional(),
      id: z.string().optional(),
      children: z.array(layoutNodeSchema),
    }),
    z.object({
      type: z.literal("stack"),
      direction: z.enum(["row", "col"]),
      gap: z.enum(["sm", "md", "lg"]).optional(),
      id: z.string().optional(),
      children: z.array(layoutNodeSchema),
    }),
  ])
);

export const layoutSpecSchema = z.object({
  version: z.number(),
  surface: z.string(),
  theme: z.object({
    background: z.string().optional(),
    foreground: z.string().optional(),
    card: z.string().optional(),
    cardBorder: z.string().optional(),
    muted: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),
  root: layoutNodeSchema,
});

export type LayoutNode = z.infer<typeof layoutNodeSchema>;
export type LayoutSpec = z.infer<typeof layoutSpecSchema>;

// -----------------------------------------------------
// 2. Schema for the LLM Output Contract
// -----------------------------------------------------

export const llmOutputSchema = z.object({
  action: z.enum(["create", "patch"]),
  explanation: z.string(),
  // For 'create' requests
  layout: layoutSpecSchema.optional(),
  // For 'patch' requests
  patch: z.array(
    z.object({
      op: z.enum(["replace", "remove", "add"]),
      path: z.string(), // A dot-notation path like "root.children.1"
      value: layoutNodeSchema.optional(), // Omitted for remove
    })
  ).optional()
});

export type LLMOutput = z.infer<typeof llmOutputSchema>;

// -----------------------------------------------------
// 3. Dailys Semantic Validator
// -----------------------------------------------------

export class SemanticValidator {
  static validate(spec: LayoutSpec, surface: Surface): { valid: boolean; error?: string } {
    if (spec.surface !== surface) {
      return { valid: false, error: `Layout surface ${spec.surface} does not match requested surface ${surface}.` };
    }

    const allowedWidgets = getWidgetsForSurface(surface);
    return this.validateNode(spec.root, allowedWidgets, 0);
  }

  private static validateNode(node: LayoutNode, allowedWidgets: string[], depth: number): { valid: boolean; error?: string } {
    if (depth > 10) {
      return { valid: false, error: "Nesting depth exceeds maximum allowed (10)." };
    }

    if (node.type === "widget") {
      if (!allowedWidgets.includes(node.widgetId)) {
        return { valid: false, error: `Widget ID '${node.widgetId}' is not allowed on this surface.` };
      }
      return { valid: true };
    }

    if (node.type === "grid" || node.type === "stack") {
      if (!node.children || node.children.length === 0) {
        return { valid: false, error: `${node.type} must contain at least one child.` };
      }
      
      for (const child of node.children) {
        const res = this.validateNode(child, allowedWidgets, depth + 1);
        if (!res.valid) return res;
      }
      return { valid: true };
    }

    return { valid: false, error: "Unknown node type." };
  }
}
