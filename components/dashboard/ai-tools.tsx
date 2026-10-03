'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import type { UsageAction } from '@/lib/quota/limits';

export function AITools() {
  const [loading, setLoading] = useState<UsageAction | null>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<string | Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<string | null>(null);

  const handleAI = async (action: UsageAction) => {
    if (!text.trim()) {
      setError('Teks tidak boleh kosong');
      return;
    }

    setLoading(action);
    setError(null);
    setResult(null);
    setQuotaInfo(null);

    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan');
        if (data.used_today !== undefined) {
          setQuotaInfo(`Penggunaan: ${data.used_today}/${data.daily_limit}`);
        }
      } else {
        setResult(data.data);
        setQuotaInfo(`Penggunaan tercatat: ${data.usage.used_today}/${data.usage.daily_limit}`);
      }
    } catch {
      setError('Gagal menghubungi server');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">AI Tools (Powered by Gemini)</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Masukkan deskripsi / teks lowongan kerja:
          </label>
          <textarea
            className="w-full h-32 p-3 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Tempel teks lowongan kerja di sini..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading !== null}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => handleAI('AI_EXTRACT')}
            disabled={loading !== null || !text.trim()}
          >
            {loading === 'AI_EXTRACT' ? 'Mengekstrak...' : 'Ekstrak Data (JSON)'}
          </Button>
          <Button
            onClick={() => handleAI('AI_GENERATE')}
            disabled={loading !== null || !text.trim()}
            variant="outline"
          >
            {loading === 'AI_GENERATE' ? 'Membuat Surat...' : 'Buat Cover Letter'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-800 text-red-200 rounded text-sm">
            {error}
          </div>
        )}

        {quotaInfo && (
          <div className="text-sm text-gray-400">
            {quotaInfo}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-gray-950 border border-gray-800 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Hasil:</h4>
            {typeof result === 'string' ? (
              <div className="whitespace-pre-wrap text-sm text-gray-200">{result}</div>
            ) : (
              <pre className="text-xs text-green-400 overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
