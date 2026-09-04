import { ThemeDefinition } from "./types";

export type PartialThemeJson = Omit<ThemeDefinition, "id">;

const isValidColor = (val: any): boolean => {
  if (typeof val !== 'string') return false;
  // allow hex (#abc, #abcdef, #abcdef12)
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(val)) return true;
  // allow rgb/rgba
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0|1|0\.\d+|\.\d+)\s*)?\)$/i.test(val)) return true;
  return false;
};

const isValidTypography = (val: any): boolean => {
  if (typeof val !== 'string') return false;
  // Do not allow arbitrary CSS (e.g. semicolons, quotes that could break injection)
  if (!/^[a-zA-Z0-9\- ,\.]+$/.test(val)) return false;
  return true;
};

export const validateThemeJson = (jsonStr: string): PartialThemeJson => {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error("Invalid JSON formatting.");
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error("Theme must be a JSON object.");
  }

  if (typeof parsed.name !== 'string' || !parsed.name.trim()) {
    throw new Error("Theme must have a valid 'name' property.");
  }

  // 1. Check top-level keys
  const allowedTopLevel = ["name", "colors", "typography", "shape", "density"];
  for (const key of Object.keys(parsed)) {
    if (!allowedTopLevel.includes(key)) {
      throw new Error(`Unknown theme property: ${key}`);
    }
  }

  // 2. Validate Colors
  if (!parsed.colors || typeof parsed.colors !== 'object') {
    throw new Error("Missing or invalid 'colors' object.");
  }
  const requiredColors = [
    "background", "surface", "surfaceElevated", "foreground", "muted",
    "border", "accent", "accentSoft", "success", "warning", "danger",
    "selection", "focus"
  ];
  for (const key of Object.keys(parsed.colors)) {
    if (!requiredColors.includes(key)) {
      throw new Error(`Unknown color property: colors.${key}`);
    }
  }
  for (const req of requiredColors) {
    if (!isValidColor(parsed.colors[req])) {
      throw new Error(`colors.${req} must be a valid hex or rgb/rgba color.`);
    }
  }

  // 3. Validate Typography
  if (!parsed.typography || typeof parsed.typography !== 'object') {
    throw new Error("Missing or invalid 'typography' object.");
  }
  const requiredTypography = ["display", "body", "mono"];
  for (const key of Object.keys(parsed.typography)) {
    if (!requiredTypography.includes(key)) {
      throw new Error(`Unknown typography property: typography.${key}`);
    }
  }
  for (const req of requiredTypography) {
    if (!isValidTypography(parsed.typography[req])) {
      throw new Error(`typography.${req} contains invalid characters.`);
    }
  }

  // 4. Validate Shape
  if (!parsed.shape || typeof parsed.shape !== 'object') {
    throw new Error("Missing or invalid 'shape' object.");
  }
  const requiredShape = ["radiusSm", "radiusMd", "radiusLg", "borderWidth"];
  for (const key of Object.keys(parsed.shape)) {
    if (!requiredShape.includes(key)) {
      throw new Error(`Unknown shape property: shape.${key}`);
    }
  }
  for (const req of requiredShape) {
    const val = parsed.shape[req];
    if (typeof val !== 'number' || val < 0) {
      throw new Error(`shape.${req} must be a positive number.`);
    }
    if (req.startsWith("radius") && val > 48) {
      throw new Error(`shape.${req} cannot exceed 48.`);
    }
    if (req === "borderWidth" && val > 8) {
      throw new Error(`shape.${req} cannot exceed 8.`);
    }
  }

  // 5. Validate Density
  if (!["compact", "comfortable", "spacious"].includes(parsed.density)) {
    throw new Error("density must be 'compact', 'comfortable', or 'spacious'.");
  }

  return parsed as PartialThemeJson;
};
