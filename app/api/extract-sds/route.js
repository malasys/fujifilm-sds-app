// app/api/extract-sds/route.js
import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `あなたはFUJIFILM Wako Pure ChemicalのSafety Data Sheet（SDS）の専門アシスタントです。
与えられたSDS本文から、ユーザーが指定した情報を正確に日本語で抜粋してください。

出力形式：
- 各セクションを見出し（## セクション名）で区切る
- 絵表示はGHSピクトグラム名をリスト形式で記載
- 成分情報は表形式（成分名 | CAS番号 | 含有量）で記載
- 物理的性質は表形式で記載
- その他は箇条書きまたは原文に近い形式で記載
- 情報が見つからない場合は「記載なし」と明記
- 余分なコメントや前置きは不要。抜粋内容のみ出力すること。`;

export async function POST(request) {
  try {
    const { query, sections } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "物質名が指定されていません" }, { status: 400 });
    }

    const searchPrompt = `FUJIFILMのWako Pure Chemical（和光純薬）のウェブサイトから「${query}」のSafety Data Sheet（SDS/安全データシート）を取得してください。

以下の情報を抜粋して日本語で返してください：
${sections.map((l, i) => `${i + 1}. ${l}`).join('\n')}

物質名「${query}」のSDSが見つかった場合、最初の行に「URL: [URL]」の形式で引用元のURLを記載してから、各情報を抽出してください。
見つからない場合は「見つかりませんでした」とのみ回答してください。`;

    // Anthropic APIへのリクエスト (サーバー側で実行されるためCORSエラーにならず、APIキーも漏れません)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY, // Vercelの環境変数から取得します
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: searchPrompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "APIリクエストに失敗しました");
    }

    const fullText = data.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n");

    return NextResponse.json({ text: fullText });

  } catch (error) {
    console.error("SDS Extraction Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}