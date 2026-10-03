'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import type { UsageAction } from '@/lib/quota/limits';

export function UsageTestButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const testAction = async (action: UsageAction, portal?: string) => {
    setLoading(action);
    setMessage(null);

    try {
      const res = await fetch('/api/usage/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, portal }),
      });

      const data = await res.json();

      if (data.allowed) {
        setMessage(`✓ ${data.message} (${data.used_today}/${data.daily_limit})`);
      } else {
        setMessage(`✗ ${data.message} (${data.used_today}/${data.daily_limit})`);
      }

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      setMessage('❌ Terjadi kesalahan');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Tes Penggunaan (Development Only)</h3>
      <p className="text-sm text-gray-400 mb-4">
        Tombol ini hanya mencatat penggunaan quota. Tidak memanggil AI atau scraper eksternal.
      </p>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2 text-gray-300">AI Actions</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => testAction('AI_EXTRACT')}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === 'AI_EXTRACT' ? 'Testing...' : 'Test AI Extract'}
            </Button>
            <Button
              onClick={() => testAction('AI_GENERATE')}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === 'AI_GENERATE' ? 'Testing...' : 'Test AI Generate'}
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 text-gray-300">Scraping Actions</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => testAction('SCRAPE_LINKEDIN', 'LinkedIn')}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === 'SCRAPE_LINKEDIN' ? 'Testing...' : 'Test LinkedIn Scrape'}
            </Button>
            <Button
              onClick={() => testAction('SCRAPE_JOBSTREET', 'Jobstreet')}
              disabled={loading !== null}
              variant="outline"
            >
              {loading === 'SCRAPE_JOBSTREET' ? 'Testing...' : 'Test Jobstreet Scrape'}
            </Button>
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-4 p-3 bg-gray-800 rounded text-sm text-center">
          {message}
        </div>
      )}
    </Card>
  );
}
