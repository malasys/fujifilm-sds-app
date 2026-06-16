'use client';
import { useState } from 'react';

export default function SDSPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/extract-sds', { method: 'POST', body: formData });
      const data = await res.json();
      setResult(data.text);
    } catch (e) {
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>SDS原文抽出ツール</h1>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? '解析中...' : '抽出実行'}
      </button>
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>{result}</pre>
    </div>
  );
}