'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useState } from 'react';
import type { UsageAction } from '@/lib/quota/limits';

export function UsageTestButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  const testAction = async (action: UsageAction, portal?: string) => {
    setLoading(action);

    try {
      const res = await fetch('/api/usage/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, portal }),
      });

      const data = await res.json();

      if (data.allowed) {
        showToast(`✓ ${data.message} (${data.used_today}/${data.daily_limit})`, 'success');
      } else {
        showToast(`✗ ${data.message} (${data.used_today}/${data.daily_limit})`, 'error');
      }
    } catch {
      showToast('❌ Gagal menghubungi server', 'error');
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed border-zinc-800 p-4">
        <div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">DEVELOPMENT ONLY</span>
          <span className="text-xs text-zinc-400">Pengujian Simulasi Kuota Database Tanpa Eksternal API</span>
        </div>
        <Button onClick={() => setIsOpen(true)} variant="ghost" className="font-mono text-xs text-zinc-400 hover:text-zinc-200">
          Tampilkan Tester
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-dashed border-zinc-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">DEVELOPMENT ONLY</span>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-200">Simulasi Pemakaian Kuota (Database RPC)</h3>
        </div>
        <Button onClick={() => setIsOpen(false)} variant="ghost" className="font-mono text-xs text-zinc-500 hover:text-zinc-300">
          Sembunyikan
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-mono text-zinc-400 mb-2">AKSI AI (EXTRACT / GENERATE)</h4>
          <div className="flex gap-2">
            <Button
              onClick={() => testAction('AI_EXTRACT')}
              disabled={loading !== null}
              variant="outline"
              className="flex-1 font-mono text-xs"
            >
              {loading === 'AI_EXTRACT' ? 'Testing...' : 'Test AI Extract'}
            </Button>
            <Button
              onClick={() => testAction('AI_GENERATE')}
              disabled={loading !== null}
              variant="outline"
              className="flex-1 font-mono text-xs"
            >
              {loading === 'AI_GENERATE' ? 'Testing...' : 'Test AI Generate'}
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-mono text-zinc-400 mb-2">AKSI SCRAPING (LINKEDIN / JOBSTREET)</h4>
          <div className="flex gap-2">
            <Button
              onClick={() => testAction('SCRAPE_LINKEDIN', 'LinkedIn')}
              disabled={loading !== null}
              variant="outline"
              className="flex-1 font-mono text-xs"
            >
              {loading === 'SCRAPE_LINKEDIN' ? 'Testing...' : 'Test LinkedIn'}
            </Button>
            <Button
              onClick={() => testAction('SCRAPE_JOBSTREET', 'Jobstreet')}
              disabled={loading !== null}
              variant="outline"
              className="flex-1 font-mono text-xs"
            >
              {loading === 'SCRAPE_JOBSTREET' ? 'Testing...' : 'Test Jobstreet'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
