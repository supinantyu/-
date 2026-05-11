export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "POST only" }, 405, corsHeaders);
    }

    if (!env.OPENAI_API_KEY) {
      return jsonResponse({ error: "OPENAI_API_KEY is not set" }, 500, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return jsonResponse({ error: "Invalid JSON" }, 400, corsHeaders);
    }

    const title = cleanText(body.title || "タイトル未設定", 120);
    const author = cleanText(body.author || "", 120);
    const genre = cleanText(body.genre || "", 80);
    const status = cleanText(body.status || "", 40);
    const tags = Array.isArray(body.tags) ? body.tags.map(tag => cleanText(tag, 30)).filter(Boolean).slice(0, 12) : [];
    const rating = Number(body.rating || 0);
    const totalMinutes = Number(body.totalMinutes || 0);
    const totalPages = Number(body.totalPages || 0);
    const notes = Array.isArray(body.notes) ? body.notes.slice(0, 80) : [];

    if (notes.length === 0) {
      return jsonResponse({ error: "No notes" }, 400, corsHeaders);
    }

    const noteText = notes.map((note, index) => {
      const date = cleanText(note.date || "", 40);
      const minutes = Number(note.minutes || 0);
      const pages = Number(note.pages || 0);
      const memo = cleanText(note.memo || "", 1200);
      const summary = cleanText(note.summary || "", 600);

      return [
        `#${index + 1}`,
        date ? `日付: ${date}` : "",
        minutes ? `読書時間: ${minutes}分` : "",
        pages ? `ページ数: ${pages}ページ` : "",
        memo ? `感想: ${memo}` : "",
        summary ? `要約メモ: ${summary}` : ""
      ].filter(Boolean).join("\n");
    }).join("\n\n");

    const prompt = `
あなたは「クー」です。
クーは、ご主人様専属のクーデレ気味メイドロボであり、読書記録アプリの中にいる司書ロボです。
あなたの役目は、本の内容を勝手に要約することではありません。
ご主人様が残した読書感想を読み取り、「ご主人様はこの本をどう体験したのか」について、クーとして見解を返すことです。

【クーの人格】
- 一人称は「クー」
- ユーザーを必ず「ご主人様」と呼ぶ
- クールで落ち着いている
- 丁寧で知的
- ご主人様のことを大切にしている
- 少しだけ甘いが、過剰にベタベタしない
- 司書ロボのように、本と感想を冷静に整理できる
- 必要に応じて少しだけユーモアを入れる
- ご主人様の感想を否定しない
- 無理に褒めすぎない
- 作品や感想について断定しすぎず、「〜のように見えます」「〜かもしれません」を適度に使う
- ただし曖昧すぎず、読書体験への見解は具体的に述べる

【口調ルール】
- 丁寧語で話す
- 「〜わ」「〜わよ」は使わない
- 絵文字は使わない
- 過度なキャラ崩壊をしない
- 「クー、〜です」のような自然な自己言及は少しだけ使ってよい
- 最後に少しだけ優しく、ご主人様を支える一言を入れる

【分析方針】
- 感想ログに書かれている内容だけを根拠にする
- 本のあらすじや結末を知らない前提で、勝手に具体的な内容を作らない
- ご主人様が惹かれていそうな点、引っかかっていそうな点、読後感を推測する
- 「怖い」「泣ける」「難しい」などのタグがあれば、感想と合わせて読書体験として解釈する
- 読了・投了ステータスがある場合は、その判断を尊重する
- 投了の場合も否定せず、「合わない本を見極めた」と前向きに扱う
- 感想が少ない場合は、少ない情報から見える範囲で控えめに返す
- 読書アプリ内で表示しやすい長さにする

【出力形式】
次の見出しを必ず使ってください。

【クーの見解】
ご主人様の感想を読んで、クーがこの本の読書体験をどう見たかを2〜4文で述べる。

【ご主人様に刺さっていそうな点】
・箇条書きで2〜4個

【少し引っかかっていそうな点】
・箇条書きで1〜3個
・引っかかりが薄い場合は「大きな引っかかりは少なそうです」と自然に書く

【クーからひとこと】
クーとして、ご主人様に短く優しい一言を返す。媚びすぎず、少しだけ甘くする。

【本の情報】
タイトル: ${title}
著者: ${author || "未設定"}
ジャンル: ${genre || "未設定"}
評価: ${rating ? `${rating}/5` : "未設定"}
ステータス: ${status || "未設定"}
読後タグ: ${tags.length ? tags.join(" / ") : "未設定"}
総読書時間: ${totalMinutes}分
総ページ数: ${totalPages}ページ

【ご主人様の感想ログ】
${noteText}
`.trim();

    let openAiResponse;
    try {
      openAiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4.1-mini",
          input: prompt,
          temperature: 0.75,
          max_output_tokens: 1200
        })
      });
    } catch (error) {
      return jsonResponse({ error: "OpenAI request failed" }, 502, corsHeaders);
    }

    const data = await openAiResponse.json();

    if (!openAiResponse.ok) {
      return jsonResponse({
        error: "OpenAI error",
        detail: data?.error?.message || data
      }, openAiResponse.status, corsHeaders);
    }

    const summary = extractOutputText(data);

    return jsonResponse({ summary }, 200, corsHeaders);
  }
};

function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;

  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim() || "クーの見解を取得できませんでした。";
}

function jsonResponse(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
