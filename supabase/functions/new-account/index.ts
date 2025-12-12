// supabase/functions/add-account/index.ts
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
    const { userId, userName } = await req.json();

    if (!userId || !userName) {
      return jsonResponse({ error: "Missing userId or userName" }, 400);
    }

    // ✅ 查詢是否已有帳號
    const { data: existing, error: checkError } = await supabase
      .from("account")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    console.log('28',existing)
    if (checkError) {
      console.error("查詢帳號失敗：", checkError.message);
      return jsonResponse({ success: false, error: checkError.message }, 500);
    }

    // ✅ 如果尚未建立帳號，就新增
    if (!existing) {
      const { data: insertedData, error: upsertError } = await supabase
        .from("account")
        .upsert(
          [
            {
              user_id: userId,
              user_name: userName
            },
          ],
          { onConflict: "user_id", returning: "representation" } // 👈 加上這行！
        );

      if (upsertError) {
        console.error("新增帳號失敗：", upsertError.message);
        return jsonResponse({ success: false, error: upsertError.message }, 500);
      }

      return jsonResponse({
        success: true,
        data: insertedData,
      });
    }
    // ✅ 已存在帳號就直接回傳現有資料
    console.log('60', existing)
    return jsonResponse({
      success: true,
      data: existing,
    });
  } catch (err) {
    console.error("發生錯誤：", err);
    return jsonResponse({ success: false, error: "Internal Server Error" }, 500);
  }
});
