// Supabase Edge Function: DeepSeek coach proxy.
// The DeepSeek API key lives here as a secret, never in the browser.
// Deploy:  supabase functions deploy deepseek
// Secret:  supabase secrets set DEEPSEEK_API_KEY=sk-...

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const SYSTEM =
  "You help tune a double-progression strength-training app. The app has already produced a " +
  "deterministic recommendation for the next session; your job is to sanity-check it against the " +
  "athlete's note and numbers. Be conservative and safety-first: if the note mentions pain, a tweak, " +
  "a strain, illness, or anything nerve-type, sharp, or burning, lean toward holding or REDUCING the " +
  "load and never toward pushing harder. Otherwise, usually agree with the deterministic call. " +
  'Reply with ONLY a compact JSON object: {"adjust": boolean, "weight": number|null, "message": string}. ' +
  "Set adjust=true and give a weight in lb only when you are confident the next weight should change; " +
  "otherwise adjust=false and weight=null. Keep message under 240 characters, practical and encouraging.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const key = Deno.env.get("DEEPSEEK_API_KEY");
    const body = await req.json().catch(() => ({}));

    if (body.mode === "ping") {
      return json({
        ok: !!key,
        message: key
          ? "Coach reachable and API key is set."
          : "Function reachable, but DEEPSEEK_API_KEY is not set. Run: supabase secrets set DEEPSEEK_API_KEY=sk-...",
      });
    }

    if (!key) return json({ adjust: false, weight: null, message: "AI coach isn't configured (no API key)." });

    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify(body) },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return json({ adjust: false, weight: null, message: "Coach error " + r.status + (t ? ": " + t.slice(0, 120) : "") });
    }

    const data = await r.json();
    const txt = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    let out = { adjust: false, weight: null as number | null, message: String(txt).trim().slice(0, 400) };
    try {
      const m = String(txt).match(/\{[\s\S]*\}/);
      if (m) {
        const p = JSON.parse(m[0]);
        out = {
          adjust: !!p.adjust,
          weight: typeof p.weight === "number" ? p.weight : null,
          message: String(p.message || "").slice(0, 400),
        };
      }
    } catch (_e) { /* keep raw text as message */ }

    return json(out);
  } catch (e) {
    return json({ adjust: false, weight: null, message: "Coach failed: " + String(e) });
  }
});
