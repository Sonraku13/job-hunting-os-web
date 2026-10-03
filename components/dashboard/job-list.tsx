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
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [letterById, setLetterById] = useState<Record<string, string>>({});
  const [viewLetterId, setViewLetterId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleCoverLetter = async (id: string) => {
    if (letterById[id]) {
      setViewLetterId(id);
      return;
    }
    setGeneratingId(id);
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setLetterById((prev) => ({ ...prev, [id]: data.coverLetter }));
        setViewLetterId(id);
        showToast('Cover letter berhasil dibuat', 'success');
      } else {
        showToast(data.error || 'Gagal membuat cover letter', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setGeneratingId(null);
    }
  };

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
        <div className="mx-auto max-w-md space-y-4">
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
          <h3 className="text-base font-semibold text-zinc-100">Belum Ada Lowongan Tersimpan</h3>
          <p className="text-xs text-zinc-400">
            Lowongan hasil kurasi dari LinkedIn & Jobstreet akan otomatis tersusun di sini.
          </p>

          <div className="pt-2">
            <Button
              onClick={async () => {
                try {
                  const res = await fetch('/api/jobs/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      job_title: 'Senior Frontend Engineer',
                      company_name: 'Tech Corp Indonesia',
                      job_url: 'https://linkedin.com/jobs/view/123',
                      location: 'Jakarta, Indonesia (Remote)',
                      job_type: 'Full-time',
                      salary_range: '15.000.000 - 25.000.000 IDR',
                      job_description:
                        'We are looking for a Senior Frontend Engineer to build modern, scalable web applications using React, Next.js, and TypeScript.\n\nRequirements:\n- 5+ years experience\n- Strong understanding of React ecosystem',
                      source: 'LinkedIn',
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setJobs([data.data]);
                    showToast('Lowongan contoh berhasil ditambahkan!', 'success');
                  } else {
                    showToast(data.error || 'Gagal menambah lowongan', 'error');
                  }
                } catch {
                  showToast('Gagal menghubungi server', 'error');
                }
              }}
              className="font-mono text-xs"
            >
              + Tambah Lowongan Contoh (Tes UI)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
                    <Button
                      variant="ghost"
                      onClick={() => handleCoverLetter(job.id)}
                      disabled={generatingId === job.id}
                      className="font-mono text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                    >
                      {generatingId === job.id
                        ? 'Menulis...'
                        : letterById[job.id]
                          ? 'Lihat Surat'
                          : 'Buat Surat'}
                    </Button>

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

      {viewLetterId && letterById[viewLetterId] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setViewLetterId(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-100">Cover Letter</h3>
              <Button variant="ghost" onClick={() => setViewLetterId(null)} className="text-zinc-400 font-mono text-xs">
                ✕
              </Button>
            </div>
            <div className="font-sans text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
              {letterById[viewLetterId]}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setViewLetterId(null)} className="font-mono text-xs">Tutup</Button>
              <Button
                variant="default"
                onClick={() => {
                  navigator.clipboard.writeText(letterById[viewLetterId]);
                  showToast('Cover letter disalin ke clipboard', 'success');
                }}
                className="font-mono text-xs"
              >
                Salin
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
