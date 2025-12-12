// callFunction.ts — 通用處理：data 若是字串就 parse，並把 key 深度 camelCase
type AnyObj = Record<string, any>;

function toCamelKey(k: string) {
  // 只在有 '_' 或 '-' 才轉，否則保持原樣（避免把 isWinner 變 iswinner）
  if (!k.includes("_") && !k.includes("-")) return k;
  return k.toLowerCase().replace(/[-_]+(\w)/g, (_, c) => c.toUpperCase());
}

function camelizeDeep(input: any): any {
  if (Array.isArray(input)) return input.map(camelizeDeep);
  if (input && typeof input === "object") {
    const out: AnyObj = {};
    for (const [k, v] of Object.entries(input)) out[toCamelKey(k)] = camelizeDeep(v);
    return out;
  }
  return input;
}

export async function callFunction<T = any>(
  fnName: string,
  body: object
): Promise<T> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = `https://${projectId}.supabase.co/functions/v1/${fnName}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey, // 建議一併帶上
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let payload: any;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    console.error("[callFunction] 非 JSON 回應：", text);
    throw new Error(`非 JSON 回應（HTTP ${res.status}）`);
  }

  if (!res.ok) {
    const msg =
      payload?.error?.message ||
      payload?.error ||
      payload?.message ||
      `函式呼叫失敗（HTTP ${res.status}）`;
    console.error("[callFunction] HTTP error:", { url, status: res.status, payload });
    throw new Error(msg);
  }

  // 1) data 可能是字串 → 解析
  const rawData = payload?.data;
  const parsed =
    typeof rawData === "string"
      ? (() => {
          try { return JSON.parse(rawData); } catch { return rawData; }
        })()
      : rawData;

  // 2) 深度 camelCase（只改 data；頂層 success/msg 保持原樣）
  const normalizedData = camelizeDeep(parsed);

  const normalized = { ...payload, data: normalizedData };

  if (import.meta.env.DEV) {
    console.debug("[callFunction] response (normalized):", normalized);
  }

  return normalized as T;
}
