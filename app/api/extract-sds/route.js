// app/api/extract-sds/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { query, sections } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "物質名が指定されていません" }, { status: 400 });
    }

    const prompt = `あなたはFUJIFILM Wako Pure ChemicalのSafety Data Sheet（SDS）の専門アシスタントです。
Google検索機能を使って、FUJIFILMのWako Pure Chemical（和光純薬）のウェブサイトから「${query}」のSafety Data Sheet（SDS/安全データシート）の最新情報を検索・取得してください。

取得した情報から、以下の項目を正確に日本語で抜粋してください：
${sections.map((l) => `- ${l}`).join('\n')}

【出力形式】
- 最初の行に必ず「URL: [検索で見つけたSDSのURL]」の形式で引用元URLを記載してください。
- 各セクションを見出し（## セクション名）で区切る
- 絵表示はGHSピクトグラム名をリスト形式で記載
- 成分情報は表形式（成分名 | CAS番号 | 含有量）で記載
- 物理的性質は表形式で記載
- その他は箇条書きまたは原文に近い形式で記載
- 情報が見つからない場合は「記載なし」と明記
- 余分なコメントや前置きは一切不要。URLと抜粋内容のみを出力すること。`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY が設定されていません。");
    }

    // 正解の組み合わせ：【v1beta】のエンドポイント ＋ 【gemini-2.0-flash】モデル
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }] // v1betaなのでこの検索ツールが正常に認識されます
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Gemini APIリクエストに失敗しました");
    }

    const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!fullText) {
      throw new Error("SDSの情報を取得できませんでした。");
    }

    return NextResponse.json({ text: fullText });

  } catch (error) {
    console.error("SDS Extraction Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}