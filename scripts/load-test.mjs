import { performance } from "node:perf_hooks";
import { writeFile } from "node:fs/promises";

const URL = process.env.SUPA_URL || "https://reqdxnnccudtryrlhvui.supabase.co/functions/v1/draw-lottery";
const KEY = process.env.SUPA_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlcWR4bm5jY3VkdHJ5cmxodnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzgyODEsImV4cCI6MjA2OTM1NDI4MX0.1gWMoU0C5lJI1XNW-XCp6otFA6gwG_3-MSKOe4IKWfs";

if (!URL || !KEY) {
  console.error("請先設定環境變數 SUPA_URL / SUPA_KEY");
  process.exit(1);
}

// 參數
const args = process.argv.slice(2).filter(a => !a.startsWith("--"));
const flags = new Map(process.argv.slice(2).filter(a => a.startsWith("--")).map(s => {
  const [k, v] = s.split("="); return [k, v ?? true];
}));
const TOTAL = Number(args[0] || 50);
const CONCURRENCY = Number(args[1] || 20);
const UNIQUE = Number(args[2] || 40);
const VERBOSE = flags.has("--verbose");
const OUT_PREFIX = flags.get("--out") || `responses-${Date.now()}`;
const SALT = flags.get("--salt") || ""; // 每次想不同 user，加時間戳等

const makeName = i => `user-${i + 1}${SALT ? `-${SALT}` : ""}`;
const uniques = Array.from({ length: UNIQUE }, (_, i) => makeName(i));
// 其餘請求會隨機重複前 20 名（模擬同人連點）
const dupList = Array.from({ length: Math.max(0, TOTAL - UNIQUE) }, () =>
  makeName(Math.floor(Math.random() * Math.min(20, UNIQUE)))
);
const USERS = [...uniques, ...dupList];

const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${KEY}` };

// 收集每筆「原始回應」
const records = [];
const statusCount = new Map();
let ok = 0, fail = 0;

async function hit(userId, i) {
  const t0 = performance.now();
  const res = await fetch(URL, { method: "POST", headers, body: JSON.stringify({ userId }) });
  const t1 = performance.now();
  const latencyMs = +(t1 - t0).toFixed(1);
  statusCount.set(res.status, (statusCount.get(res.status) || 0) + 1);
  const bodyText = await res.text(); // ← 原樣拿回，不改動

  const rec = {
    i, userId, httpStatus: res.status, ok: res.ok, latencyMs, body: bodyText
  };
  records.push(rec);

  if (res.ok) ok++; else fail++;
  if (VERBOSE) {
    const tag = res.ok ? "[OK ]" : "[ERR]";
    console.log(tag, `#${i}`, userId, `${latencyMs}ms`, `status=${res.status}`);
    console.log(bodyText); // 逐筆印出「你的後端原樣回傳」
    console.log("----");
  }
}

async function runPool(tasks, n) {
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const my = idx++;
      try { await tasks[my](); } catch { /* 已在 hit 裡面統計 */ }
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
}

function toCSV(rows) {
  const cols = ["i","userId","httpStatus","ok","latencyMs","body"];
  const header = cols.join(",");
  const lines = rows.map(r => cols.map(c => {
    const v = r[c]; if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }).join(","));
  return [header, ...lines].join("\n");
}

(async () => {
  const tasks = USERS.map((u, i) => () => hit(u, i));
  console.log(`Target: ${URL}`);
  console.log(`Total=${TOTAL}  Concurrency=${CONCURRENCY}  Unique=${UNIQUE}  Salt=${SALT || "(none)"}`);
  console.time("load");
  await runPool(tasks, CONCURRENCY);
  console.timeEnd("load");

  const csvPath = `${OUT_PREFIX}.csv`;
  const jsonlPath = `${OUT_PREFIX}.jsonl`;
  await writeFile(csvPath, toCSV(records), "utf8");
  await writeFile(jsonlPath, records.map(r => JSON.stringify(r)).join("\n"), "utf8");

  console.log(JSON.stringify({
    totalRequests: records.length,
    ok, fail,
    statusCounts: Object.fromEntries(statusCount)
  }, null, 2));
  console.log(`Saved per-request logs:\n  ${csvPath}\n  ${jsonlPath}`);
})();
