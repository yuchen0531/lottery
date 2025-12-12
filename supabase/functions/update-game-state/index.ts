// .supabase/functions/exchange-gift/index.ts
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
    const { userId, gameState } = await req.json();
    console.log(gameState)
    if (!userId) {
      return jsonResponse({ error: "Missing userId" }, 400);
    }
    const { data: insertedData, error: upsertError } = await supabase.from("account").upsert(
      [
        {
          user_id: userId,
          game_state: gameState
        },
      ],
      { onConflict: "user_id", returning: "representation" }
    );

    if (upsertError) {
      console.error("更新失敗：", upsertError.message);
      return jsonResponse({ success: false, error: upsertError.message }, 500);
    }
    return jsonResponse({
      success: true,
      data: insertedData,
      msg: "更新成功",
    });
  } catch (err) {
    console.error("更新錯誤：", err);
    return jsonResponse({ success: false, error: "Internal Server Error" }, 500);
  }
});
