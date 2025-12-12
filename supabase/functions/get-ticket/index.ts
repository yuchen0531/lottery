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
    const { userId} = await req.json();
    if (!userId) {
      return jsonResponse({ error: "Missing userId" }, 400);
    }
    const { data: existing, error: checkError } = await supabase
      .from("account")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    console.log('26',existing)

    const couponCode = `20250520${String(existing?.id).padStart(4, '0')}`;
    const { data: insertedData, error: upsertError } = await supabase.from("account").upsert(
      [
        {
          user_id: userId,
          coupon_id: couponCode
        },
      ],
      { onConflict: "user_id" }
    );
    console.log('insertedData', insertedData)
    if (upsertError) {
      console.error("領取失敗：", upsertError.message);
      return jsonResponse({ success: false, error: upsertError.message }, 500);
    }
    const { data: latest, error: fetchError } = await supabase
      .from("account")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError) {
      return jsonResponse({ success: false, error: fetchError.message }, 500);
    }

    return jsonResponse({
      success: true,
      data: latest,
      msg: "領取成功",
    });
  } catch (err) {
    console.error("領取錯誤：", err);
    return jsonResponse({ success: false, error: "Internal Server Error" }, 500);
  }
});
