import { NextResponse } from 'next/server';

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Pdf = buffer.toString('base64');

  const prompt = `あなたは化学物質の専門家です。提供されたSDSのPDFから、各項目を一切の要約や改変をせず「原文ママ」で抽出してください。
出力形式：
## 組成及び成分情報
(原文)
## 危険有害性の要約
(原文)
※見つからない場合は「記載なし」と出力すること。`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "application/pdf", data: base64Pdf } }
          ]
        }]
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return NextResponse.json({ text });
}