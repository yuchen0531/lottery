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
    const { userId } = await req.json();

    if (!userId) {
      return jsonResponse({ error: "Missing userId" }, 400);
    }

    // 查詢是否抽過
    const { data: existing, error: checkError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("查詢是否抽過失敗：", checkError.message);
      return jsonResponse({ success: false, error: checkError.message }, 500);
    }
    // 查詢是否換過
    const { data: userInfo, error: checkError2 } = await supabase
      .from("account")
      .select("already_exchange")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError2) {
      console.error("查詢是否換過失敗：", checkError2.message);
      return jsonResponse({ success: false, error: checkError2.message }, 500);
    }
    const alreadyExchanged = userInfo?.already_exchange ?? false;

    if (existing?.is_winner && !alreadyExchanged) {
      const { error: upsertError } = await supabase.from("account").upsert(
        [
          {
            user_id: userId,
            already_exchange: true,
          },
        ],
        { onConflict: "user_id" }
      );

      if (upsertError) {
        console.error("兌換失敗：", upsertError.message);
        return jsonResponse({ success: false, error: upsertError.message }, 500);
      }

      const { data: newData } = await supabase
        .from("account")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      return jsonResponse({
        success: true,
        data: newData,
        msg: "兌換成功",
      });
    } else {
      return jsonResponse({
        success: true,
        msg: "您不符合兌換資格",
      });
    }
  } catch (err) {
    console.error("兌換錯誤：", err);
    return jsonResponse({ success: false, error: "Internal Server Error" }, 500);
  }
});
