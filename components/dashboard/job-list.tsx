'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

export interface SavedJob {
  id: string;
  job_title: string;
  company_name: string;
  job_url: string | null;
  location: string | null;
  job_type: string | null;
  salary_range: string | null;
  job_description: string | null;
  source: string;
  created_at: string;
}

export function JobList({ initialJobs }: { initialJobs: SavedJob[] }) {
  const [jobs, setJobs] = useState<SavedJob[]>(initialJobs);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        showToast('Lowongan berhasil dihapus', 'success');
      } else {
        showToast(data.error || 'Gagal menghapus lowongan', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <div className="mx-auto max-w-md">
          <svg
            className="mx-auto h-12 w-12 text-zinc-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <h3 className="mt-4 text-base font-semibold text-zinc-100">Belum Ada Lowongan Tersimpan</h3>
          <p className="mt-1 text-xs text-zinc-400">
            Lowongan hasil kurasi dari LinkedIn & Jobstreet akan otomatis tersusun di sini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
        <span>TOTAL LOWONGAN: {jobs.length}</span>
      </div>

      <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card)]">
        {jobs.map((job) => {
          const isExpanded = expandedId === job.id;

          return (
            <div key={job.id} className="p-5 transition-colors hover:bg-zinc-900/30">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-zinc-100">{job.job_title}</h3>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400 uppercase">
                      {job.source}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-300 font-medium">{job.company_name}</p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-zinc-500 pt-1">
                    {job.location && <span>📍 {job.location}</span>}
                    {job.salary_range && <span>💰 {job.salary_range}</span>}
                    {job.job_type && <span>💼 {job.job_type}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {job.job_description && (
                    <Button
                      variant="ghost"
                      onClick={() => setExpandedId(isExpanded ? null : job.id)}
                      className="font-mono text-xs text-zinc-400"
                    >
                      {isExpanded ? 'Tutup' : 'Rincian'}
                    </Button>
                  )}

                  {job.job_url && (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 font-mono text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
                    >
                      Buka Lowongan &rarr;
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(job.id)}
                    disabled={deletingId === job.id}
                    className="font-mono text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    {deletingId === job.id ? '...' : 'Hapus'}
                  </Button>
                </div>
              </div>

              {isExpanded && job.job_description && (
                <div className="mt-4 rounded-lg bg-zinc-950 border border-zinc-800 p-4 font-sans text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">
                  {job.job_description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
