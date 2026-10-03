'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useState } from 'react';
import type { UsageAction } from '@/lib/quota/limits';

export function AITools() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<UsageAction | null>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<string | Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleAI = async (action: UsageAction) => {
    if (!text.trim()) {
      setError('Teks tidak boleh kosong');
      return;
    }

    setLoading(action);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan');
        showToast(data.error || 'Gagal memproses aksi AI', 'error');
      } else {
        setResult(data.data);
        showToast(`✓ AI berhasil diproses (Sisa pemakaian hari ini tercatat)`, 'success');
      }
    } catch {
      setError('Gagal menghubungi server');
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-zinc-100">AI Parser & Cover Letter</h3>
          <p className="text-xs text-zinc-400 mt-1">Ekstrak kualifikasi atau buat cover letter instan via Gemini.</p>
        </div>
        <Button onClick={() => setIsOpen(true)} variant="outline" className="font-mono text-xs">
          Buka AI Tools
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold tracking-tight">AI Tools (Powered by Gemini)</h3>
        <Button onClick={() => setIsOpen(false)} variant="ghost" className="font-mono text-xs text-zinc-500 hover:text-zinc-300">
          Tutup
        </Button>
      </div>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm text-zinc-400 mb-2 font-mono text-xs">
            TEMPEL TEKS DESKRIPSI LOWONGAN:
          </label>
          <textarea
            className="w-full min-h-[12rem] p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            placeholder="Tempel teks lowongan kerja di sini..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading !== null}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleAI('AI_EXTRACT')}
            disabled={loading !== null || !text.trim()}
            className="flex-1 font-mono text-xs"
          >
            {loading === 'AI_EXTRACT' ? 'Mengekstrak...' : 'Ekstrak Data (JSON)'}
          </Button>
          <Button
            onClick={() => handleAI('AI_GENERATE')}
            disabled={loading !== null || !text.trim()}
            variant="outline"
            className="flex-1 font-mono text-xs"
          >
            {loading === 'AI_GENERATE' ? 'Membuat Surat...' : 'Buat Cover Letter'}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs font-mono text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl bg-zinc-950 border border-zinc-800 p-4">
            <h4 className="text-xs font-mono font-semibold text-zinc-400 mb-3 uppercase">Hasil Pemrosesan:</h4>
            {typeof result === 'string' ? (
              <div className="whitespace-pre-wrap text-sm text-zinc-100 leading-relaxed">
                {result}
              </div>
            ) : (
              <pre className="text-xs font-mono text-emerald-400 overflow-x-auto rounded-md">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
