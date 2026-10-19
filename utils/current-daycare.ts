import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

export type CurrentDaycare = {
  id: string;
  name: string;
};

/**
 * Resuelve la guardería del usuario autenticado (users.daycare_id → daycares).
 * Envolta en `cache()` de React: layout y página comparten una sola query por request.
 */
export const getCurrentDaycare = cache(
  async (): Promise<CurrentDaycare | null> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("daycare_id")
      .eq("id", user.id)
      .single();
    if (!profile?.daycare_id) return null;

    const { data: daycare } = await supabase
      .from("daycares")
      .select("id, name")
      .eq("id", profile.daycare_id)
      .single();
    if (!daycare) return null;

    return { id: daycare.id, name: daycare.name };
  },
);
