import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { supabase } from "../lib/supabaseClient.ts";
import { jsonResponse, optionsResponse } from "../lib/responseHelper.ts";

const winnerMsgs = ["🎉 中獎啦！🎉"];
const loserMsgs  = ["🎉 差點就中了獎！😅","💫 雖然沒有中獎，但獲得祝福一枚～","😇 我們下次再一起努力！"];
const pickMsg = (win: boolean, prizeIndex: number) => {
  const arr = win ? winnerMsgs : loserMsgs;
  return arr[prizeIndex - 1 ];
};

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const userId = String(body?.userId || "").trim();
    if (!userId) return jsonResponse({ success: false, error: "Missing userId" }, 400);

    const { data, error } = await supabase.rpc("draw_lottery", { p_user_id: userId });
    if (error || !data?.ok) {
      console.error("抽獎失敗：", error?.message, data);
      return jsonResponse({ success: false, error: error?.message || "抽獎失敗" }, 500);
    }

    const isWinner = data.is_winner === true;
    const prizeIndex = data.prize_index;
    const prizeCode = data.prize_code ?? null;
    const drawNo = data.draw_no ?? null;
    const debug = data.debug_log ?? null;

    const { error: upsertError } = await supabase.from("account").upsert(
      [
        {
          user_id: userId,
          prize_index: prizeIndex,
          game_state: isWinner ? "wheel_success" : "wheel_fail",
        },
      ],
      { onConflict: "user_id" }
    );

    if (upsertError) {
      console.error("帳號更新失敗：", upsertError.message);
      return jsonResponse({ success: false, error: upsertError.message }, 500);
    }

    return jsonResponse({
      success: true,
      data: {
        userId,
        isWinner,
        prizeIndex,
        prizeCode,
        drawNo,
        debug
      },
      msg: pickMsg(isWinner, prizeIndex)
    });

  } catch (e) {
    console.error("Internal Error", e);
    return jsonResponse({ success: false, error: "Internal Server Error" }, 500);
  }
});
