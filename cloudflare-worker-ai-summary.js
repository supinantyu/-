export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "POST only" }, 405, corsHeaders);
    }

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: "OPENAI_API_KEY is not set" }, 500, corsHeaders);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400, corsHeaders);
    }

    const title = String(payload.title || "無題の本").slice(0, 120);
    const author = String(payload.author || "").slice(0, 120);
    const genre = String(payload.genre || "未設定").slice(0, 60);
    const rating = Number(payload.rating || 0);
    const totalMinutes = Number(payload.totalMinutes || 0);
    const totalPages = Number(payload.totalPages || 0);
    const notes = Array.isArray(payload.notes) ? payload.notes.slice(0, 80) : [];

    if (notes.length === 0) {
      return jsonResponse({ error: "感想ログがありません" }, 400, corsHeaders);
    }

    const notesText = notes.map((note, index) => {
      const memo = String(note.memo || "").slice(0, 1200);
      const summary = String(note.summary || "").slice(0, 600);
      return [
        `#${index + 1}`,
        `日付: ${note.date || "不明"}`,
        `読書時間: ${Number(note.minutes || 0)}分`,
        `ページ: ${Number(note.pages || 0)}ページ`,
        `感想: ${memo}`,
        summary ? `要約メモ: ${summary}` : ""
      ].filter(Boolean).join("\n");
    }).join("\n\n---\n\n");

    const input = `
あなたは読書記録アプリ「クーの読書記録タイマー」に搭載された読書整理AIです。
以下は、ユーザーが1冊の本について日々残した感想ログです。
単なるあらすじ要約ではなく、ユーザー自身の読書体験・感情・評価軸が伝わる「要約兼総合感想」を作ってください。

条件:
- 日本語で書く
- ネタバレに配慮し、感想ログに書かれていない具体的展開を勝手に足さない
- ユーザーの言葉から感じ取れる好みや刺さった点をまとめる
- 断定しすぎず「〜と感じている」「〜が印象に残っている」程度にする
- 出力は下の見出し構成にする
- 長すぎず、スマホで読みやすい分量にする

本の情報:
タイトル: ${title}
著者: ${author || "未入力"}
ジャンル: ${genre}
ユーザー評価: ${rating ? `${rating}/5` : "未評価"}
累計読書時間: ${totalMinutes}分
累計ページ数: ${totalPages}ページ

感想ログ:
${notesText}

出力形式:
【総合要約】
3〜5行で、この本についてユーザーがどう受け取ったかをまとめる。

【感想の傾向】
ユーザーがどんな点に反応していたかを2〜4個の短い箇条書きでまとめる。

【印象に残ったポイント】
感想ログから読み取れる印象的な点を2〜4個の短い箇条書きでまとめる。

【ひとことで言うと】
この読書体験を一言で表す。
`;

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4.1-mini",
          input
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({
          error: data?.error?.message || "OpenAI API error"
        }, response.status, corsHeaders);
      }

      const summary =
        data.output_text ||
        data.output?.flatMap(item => item.content || [])
          ?.map(content => content.text || "")
          ?.join("\n")
          ?.trim() ||
        "";

      return jsonResponse({ summary }, 200, corsHeaders);
    } catch (error) {
      return jsonResponse({ error: error.message || "Unknown error" }, 500, corsHeaders);
    }
  }
};

function jsonResponse(body, status, headers) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
