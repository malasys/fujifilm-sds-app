// app/page.tsx
"use client";

import { useState } from "react";

const SECTIONS = [
  "組成及び成分情報",
  "危険有害性の要約",
  "危険有害性情報",
  "絵表示（GHSピクトグラム）",
  "注意喚起語",
  "応急措置",
  "取扱い及び保管上の注意",
  "物理的及び化学的性質",
  "安定性及び反応性",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [sdsUrl, setSdsUrl] = useState("");
  const [result, setResult] = useState("");
  const [step, setStep] = useState("input"); // input | fetching | done | error
  const [error, setError] = useState("");

  const fetchSDS = async () => {
    if (!query.trim()) return;
    
    setError("");
    setResult("");
    setSdsUrl("");
    setStep("fetching");

    try {
      const response = await fetch("/api/extract-sds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), sections: SECTIONS })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      if (!data.text || data.text.includes("見つかりませんでした")) {
        setStep("error");
        setError(`「${query}」のSDSが見つかりませんでした。`);
        return;
      }

      const fullText = data.text;
      const urlMatch = fullText.match(/URL:\s*(https?:\/\/\S+)/);
      if (urlMatch) setSdsUrl(urlMatch[1]);

      const cleanedText = fullText.replace(/URL:\s*https?:\/\/\S+\n?/, "").trim();
      setResult(cleanedText);
      setStep("done");

    } catch (e) {
      setStep("error");
      setError("エラーが発生しました: " + e.message);
    }
  };

  const copyToClipboard = () => {
    const copyText = `【${query}のSDS情報】\n引用元: ${sdsUrl}\n\n${result}`;
    navigator.clipboard.writeText(copyText);
    alert("コピーしました！");
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>FUJIFILM Wako SDS 抜粋ツール</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        特定の化合物名を入力すると、FUJIFILMのSDSから必要な情報を自動抽出します。
      </p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && step !== "fetching" && fetchSDS()}
          placeholder="例: 塩化ナトリウム、エタノール"
          disabled={step === "fetching"}
          style={{ flex: 1, padding: "10px", fontSize: "16px", borderRadius: "4px", border: "1px solid #ccc", color: "#333" }}
        />
        <button 
          onClick={fetchSDS} 
          disabled={step === "fetching" || !query.trim()}
          style={{ padding: "10px 20px", background: "#0070f3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
        >
          {step === "fetching" ? "抽出中..." : "検索・抜粋"}
        </button>
      </div>

      {step === "error" && (
        <div style={{ padding: "15px", background: "#fee", color: "#c00", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      {step === "done" && result && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            {sdsUrl && <a href={sdsUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3", textDecoration: "underline" }}>引用元URLを開く</a>}
            <button 
              onClick={copyToClipboard}
              style={{ padding: "8px 16px", background: "#333", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              クリップボードにコピー
            </button>
          </div>
          <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", border: "1px solid #eaeaea", whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#333" }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
}