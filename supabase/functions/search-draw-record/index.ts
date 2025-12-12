import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { supabase } from "../lib/supabaseClient.ts";
import { jsonResponse, optionsResponse } from "../lib/responseHelper.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return optionsResponse();
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return jsonResponse({ error: "Missing userId" }, 400);
    }

    const { data: eventRecord } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

    const { data: accountRecord } = await supabase
      .from("account")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return jsonResponse({
      success: true,
      alreadyDone: !!eventRecord,
      data: eventRecord,
      profile: accountRecord,
    });
  } catch (err) {
    console.error("查詢失敗：", err);
    return jsonResponse({ success: false, error: "Internal Server Error" }, 500);
  }
});
