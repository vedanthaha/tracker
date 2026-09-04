import { LayoutSpec, LayoutNode, LLMOutput } from "./types.ts";

export class PatchEngine {
  /**
   * Applies a series of JSON-patch style operations to a LayoutSpec.
   * Path example: "root.children.0.children.1"
   */
  static apply(current: LayoutSpec, patch: NonNullable<LLMOutput["patch"]>): LayoutSpec {
    // Deep clone to avoid mutating the original
    const result: LayoutSpec = JSON.parse(JSON.stringify(current));

    for (const op of patch) {
      if (op.op === "replace" && op.value) {
        this.setPath(result, op.path, op.value);
      } else if (op.op === "remove") {
        this.removePath(result, op.path);
      } else if (op.op === "add" && op.value) {
        this.addPath(result, op.path, op.value);
      }
    }

    return result;
  }

  private static getParentAndKey(obj: any, path: string): { parent: any; key: string | number } | null {
    const parts = path.split(".");
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current || typeof current !== "object") return null;
      current = current[parts[i]];
    }
    if (!current || typeof current !== "object") return null;
    
    const keyStr = parts[parts.length - 1];
    const key = Array.isArray(current) ? parseInt(keyStr, 10) : keyStr;
    return { parent: current, key };
  }

  private static setPath(obj: any, path: string, value: any) {
    const target = this.getParentAndKey(obj, path);
    if (target) {
      target.parent[target.key] = value;
    }
  }

  private static removePath(obj: any, path: string) {
    const target = this.getParentAndKey(obj, path);
    if (target) {
      if (Array.isArray(target.parent)) {
        target.parent.splice(target.key as number, 1);
      } else {
        delete target.parent[target.key];
      }
    }
  }

  private static addPath(obj: any, path: string, value: any) {
    const target = this.getParentAndKey(obj, path);
    if (target) {
      if (Array.isArray(target.parent)) {
        target.parent.splice(target.key as number, 0, value);
      } else {
        target.parent[target.key] = value;
      }
    }
  }
}
