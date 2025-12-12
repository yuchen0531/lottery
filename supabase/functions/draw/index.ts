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
    const { data, error } = await supabase
      .from("account")
      .select("coupon_id, user_id, user_name") // 只取需要的欄位
      // .eq("user_id", userId)
      .not("coupon_id", "is", null) // 過濾掉 null

    if (error) {
      return jsonResponse({ success: false, error: error.message }, 500);
    }

    return jsonResponse({
      success: true,
      data, // 這裡就是 { coupon_id, user_id }
    });
  } catch (err) {
    console.error("查詢失敗：", err);
    return jsonResponse({ success: false, error: "Internal Server Error" }, 500);
  }
});
