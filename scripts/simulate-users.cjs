// simulate-users.cjs
require('dotenv').config();

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const EDGE_BASE = `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function callFunction(fn, payload) {
  try {
    const res = await fetch(`${EDGE_BASE}/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    return { success: false, msg: `Fetch 錯誤：${err.message}` };
  }
}

const TOTAL_USERS = 40;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

(async () => {
  console.log(`🚀 開始建立 ${TOTAL_USERS} 個測試帳號並領券...\n`);

  const successList = [];
  const failList = [];

  for (let i = 21; i <= TOTAL_USERS; i++) {
    const userId = `test_user_${String(i).padStart(2, '0')}`;
    const userName = userId;

    console.log(`👉 建立帳號 ${userId}...`);
    const createRes = await callFunction('new-account', { userId, userName });

    if (!createRes.success) {
      console.error(`❌ 建立帳號失敗: ${userId} ${createRes.msg}`);
      failList.push({ userId, stage: 'create', msg: createRes.msg });
      continue;
    }

    console.log(`🎟️  領取抽獎券 ${userId}...`);
    const ticketRes = await callFunction('get-ticket', { userId });

    if (ticketRes.success) {
      console.log(`✅ ${userId} 領券成功：${ticketRes.data?.couponId}`);
      successList.push(userId);
    } else {
      console.error(`⚠️ ${userId} 領券失敗：${ticketRes.msg}`);
      failList.push({ userId, stage: 'ticket', msg: ticketRes.msg });
    }

    await delay(200);
  }

  console.log(`\n🎉 完成！共 ${successList.length} 人領券成功，${failList.length} 人失敗。`);
  console.log(`\n✅ 成功名單：\n  - ${successList.join('\n  - ')}`);
  console.log(`\n❌ 失敗名單：`);
  for (const f of failList) {
    console.log(`  - ${f.userId}（階段: ${f.stage}）→ ${f.msg}`);
  }
})();
