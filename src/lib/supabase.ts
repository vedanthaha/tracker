import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      flowType: "pkce",
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  }
);

export async function checkDbReady(): Promise<boolean> {
  try {
    const { error } = await supabase.from("profiles").select("id").limit(0);
    return !error;
  } catch {
    return false;
  }
}

export function getAvatarUrl(userId: string, path: string): string {
  return `https://${projectId}.supabase.co/storage/v1/object/public/avatars/${userId}/${path}`;
}
