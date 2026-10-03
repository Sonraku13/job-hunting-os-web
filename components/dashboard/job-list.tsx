'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';

export type JobStatus = 'discover' | 'analyse' | 'apply' | 'refuse' | 'archive';

export interface MatchScoreBreakdown {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
}

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
  cover_letter?: string | null;
  email_draft?: string | null;
  status?: JobStatus;
  match_score?: number | null;
  match_score_breakdown?: MatchScoreBreakdown | null;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; badgeClass: string }> = {
  discover: { label: 'Discover', badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  analyse: { label: 'Analyse', badgeClass: 'bg-indigo-950/60 text-indigo-300 border-indigo-800' },
  apply: { label: 'Apply', badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' },
  refuse: { label: 'Refuse', badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-800' },
  archive: { label: 'Archive', badgeClass: 'bg-zinc-900 text-zinc-500 border-zinc-800' },
};

export function JobList({ initialJobs }: { initialJobs: SavedJob[] }) {
  const [jobs, setJobs] = useState<SavedJob[]>(initialJobs);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const [letterById, setLetterById] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    for (const j of initialJobs) {
      if (j.cover_letter) initialMap[j.id] = j.cover_letter;
    }
    return initialMap;
  });

  const [emailById, setEmailById] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    for (const j of initialJobs) {
      if (j.email_draft) initialMap[j.id] = j.email_draft;
    }
    return initialMap;
  });

    const [scoreById, setScoreById] = useState<Record<string, MatchScoreBreakdown>>(() => {
    const initialMap: Record<string, MatchScoreBreakdown> = {};
    for (const j of initialJobs) {
      if (j.match_score_breakdown && typeof j.match_score_breakdown.score === 'number') {
        initialMap[j.id] = j.match_score_breakdown;
      }
    }
    return initialMap;
  });

  const [modalData, setModalData] = useState<{ title: string; content: string } | null>(null);
  const [scoreModal, setScoreModal] = useState<{ job: SavedJob; result: MatchScoreBreakdown } | null>(null);
  const { showToast } = useToast();

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    try {
      const res = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'Gagal mengubah status', 'error');
      } else {
        showToast(`Status diubah ke "${STATUS_CONFIG[newStatus].label}"`, 'success');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    }
  };

  const handleMatchScore = async (job: SavedJob) => {
    if (scoreById[job.id]) {
      setScoreModal({ job, result: scoreById[job.id] });
      return;
    }

    setLoadingActionId(`score-${job.id}`);
    try {
      const res = await fetch('/api/ai/match-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();

      if (res.ok && data.matchResult) {
        setScoreById((prev) => ({ ...prev, [job.id]: data.matchResult }));
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? { ...j, match_score: data.matchResult.score, match_score_breakdown: data.matchResult }
              : j
          )
        );
        setScoreModal({ job, result: data.matchResult });
        showToast(`Match score terhitung: ${data.matchResult.score}%`, 'success');
      } else {
        showToast(data.error || 'Gagal menghitung match score', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCoverLetter = async (job: SavedJob) => {
    if (letterById[job.id]) {
      setModalData({ title: `Cover Letter – ${job.company_name}`, content: letterById[job.id] });
      return;
    }
    setLoadingActionId(`letter-${job.id}`);
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setLetterById((prev) => ({ ...prev, [job.id]: data.coverLetter }));
        setModalData({ title: `Cover Letter – ${job.company_name}`, content: data.coverLetter });
        showToast('Cover letter berhasil dibuat & disimpan', 'success');
      } else {
        showToast(data.error || 'Gagal membuat cover letter', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleEmailDraft = async (job: SavedJob) => {
    if (emailById[job.id]) {
      setModalData({ title: `Draft Email – ${job.company_name}`, content: emailById[job.id] });
      return;
    }
    setLoadingActionId(`email-${job.id}`);
    try {
      const res = await fetch('/api/ai/email-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailById((prev) => ({ ...prev, [job.id]: data.emailDraft }));
        setModalData({ title: `Draft Email – ${job.company_name}`, content: data.emailDraft });
        showToast('Draft email berhasil dibuat & disimpan', 'success');
      } else {
        showToast(data.error || 'Gagal membuat draft email', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
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

  const filteredJobs = jobs.filter((job) => {
    if (filterStatus === 'all') return true;
    return (job.status || 'discover') === filterStatus;
  });

  const [scrapingPortal, setScrapingPortal] = useState<'linkedin' | 'jobstreet' | null>(null);

  const handleManualScrape = async (portal: 'linkedin' | 'jobstreet') => {
    setScrapingPortal(portal);
    try {
      const res = await fetch('/api/scrape/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message, 'success');
        // Refresh page agar list terbaru muncul
        window.location.reload();
      } else {
        showToast(data.error || 'Gagal melakukan scraping', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setScrapingPortal(null);
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
                        'We are looking for a Senior Frontend Engineer to build modern, scalable web applications using React, Next.js, and TypeScript.\n\nRequirements:\n- 4+ years experience\n- Strong understanding of React ecosystem',
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
        {/* Manual Scrape Buttons + Filter Bar */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleManualScrape('linkedin')}
            disabled={scrapingPortal !== null}
            className="font-mono text-xs"
          >
            {scrapingPortal === 'linkedin' ? '⏳ Scraping LinkedIn...' : '🔍 Cari Lowongan LinkedIn (24 jam)'}
          </Button>
          <Button
            onClick={() => handleManualScrape('jobstreet')}
            disabled={scrapingPortal !== null}
            variant="outline"
            className="font-mono text-xs"
          >
            {scrapingPortal === 'jobstreet' ? '⏳ Scraping Jobstreet...' : '🔍 Cari Lowongan Jobstreet (24 jam)'}
          </Button>
        </div>

        <div className="text-xs text-zinc-500 font-mono">
          Pengambilan data mengambil lowongan 24 jam terakhir sesuai preferensi di Profil Anda.
        </div>

        {/* Filter Bar & Total */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'discover', 'analyse', 'apply', 'refuse', 'archive'].map((tab) => {
              const isActive = filterStatus === tab;
              const count = tab === 'all' ? jobs.length : jobs.filter((j) => (j.status || 'discover') === tab).length;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterStatus(tab)}
                  className={`rounded-lg border px-3 py-1 font-mono text-xs capitalize transition-colors ${
                    isActive
                      ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                      : 'border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  {tab === 'all' ? 'Semua' : STATUS_CONFIG[tab as JobStatus]?.label || tab}{' '}
                  <span className="text-[10px] text-zinc-500">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="font-mono text-xs text-zinc-500">
            DITAMPILKAN: {filteredJobs.length} DARI {jobs.length}
          </div>
        </div>

        {/* Job Cards */}
        <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card)]">
          {filteredJobs.map((job) => {
            const isExpanded = expandedId === job.id;
            const currentStatus: JobStatus = job.status || 'discover';
            const statusInfo = STATUS_CONFIG[currentStatus];
            const hasLetter = Boolean(letterById[job.id]);
            const hasEmail = Boolean(emailById[job.id]);
            const matchScore = scoreById[job.id]?.score ?? job.match_score;

            return (
              <div key={job.id} className="p-5 transition-colors hover:bg-zinc-900/30">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-zinc-100">{job.job_title}</h3>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400 uppercase">
                        {job.source}
                      </span>
                      {typeof matchScore === 'number' && (
                        <button
                          type="button"
                          onClick={() => handleMatchScore(job)}
                          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold transition-opacity hover:opacity-80 ${
                            matchScore >= 80
                              ? 'border-emerald-700 bg-emerald-950/80 text-emerald-300'
                              : matchScore >= 60
                                ? 'border-amber-700 bg-amber-950/80 text-amber-300'
                                : 'border-rose-700 bg-rose-950/80 text-rose-300'
                          }`}
                        >
                          Match {matchScore}%
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-zinc-300 font-medium">{job.company_name}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-zinc-500 pt-1">
                      {job.location && <span>📍 {job.location}</span>}
                      {job.salary_range && <span>💰 {job.salary_range}</span>}
                      {job.job_type && <span>💼 {job.job_type}</span>}
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                    {/* Status Dropdown */}
                    <div className="relative inline-block">
                      <select
                        aria-label="Status Lowongan"
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(job.id, e.target.value as JobStatus)}
                        className={`cursor-pointer rounded-md border px-2.5 py-1.5 font-mono text-xs font-medium uppercase outline-none transition-colors ${statusInfo.badgeClass}`}
                      >
                        <option value="discover">Discover</option>
                        <option value="analyse">Analyse</option>
                        <option value="apply">Apply</option>
                        <option value="refuse">Refuse</option>
                        <option value="archive">Archive</option>
                      </select>
                    </div>

                    {/* Action: Match Score (Analyse) */}
                    <Button
                      variant="ghost"
                      onClick={() => handleMatchScore(job)}
                      disabled={loadingActionId === `score-${job.id}`}
                      className="font-mono text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30"
                    >
                      {loadingActionId === `score-${job.id}` ? 'Skor...' : 'Match'}
                    </Button>

                    {/* Action: Cover Letter */}
                    <Button
                      variant="ghost"
                      onClick={() => handleCoverLetter(job)}
                      disabled={loadingActionId === `letter-${job.id}`}
                      className="font-mono text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                    >
                      {loadingActionId === `letter-${job.id}`
                        ? 'Menulis...'
                        : hasLetter
                          ? 'Surat'
                          : 'Surat'}
                    </Button>

                    {/* Action: Email Draft */}
                    <Button
                      variant="ghost"
                      onClick={() => handleEmailDraft(job)}
                      disabled={loadingActionId === `email-${job.id}`}
                      className="font-mono text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                    >
                      {loadingActionId === `email-${job.id}`
                        ? 'Draft...'
                        : hasEmail
                          ? 'Email'
                          : 'Email'}
                    </Button>

                    {/* Job Details Expansion */}
                    {job.job_description && (
                      <Button
                        variant="ghost"
                        onClick={() => setExpandedId(isExpanded ? null : job.id)}
                        className="font-mono text-xs text-zinc-400"
                      >
                        {isExpanded ? 'Tutup' : 'Rincian'}
                      </Button>
                    )}

                    {/* URL Link */}
                    {job.job_url && (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 font-mono text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
                      >
                        URL
                      </a>
                    )}

                    {/* Delete Button */}
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

      {/* Modal Cover Letter / Email Draft */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setModalData(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-100">{modalData.title}</h3>
              <Button variant="ghost" onClick={() => setModalData(null)} className="text-zinc-400 font-mono text-xs">
                ✕
              </Button>
            </div>
            <div className="font-sans text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
              {modalData.content}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalData(null)} className="font-mono text-xs">Tutup</Button>
              <Button
                variant="default"
                onClick={() => {
                  navigator.clipboard.writeText(modalData.content);
                  showToast('Teks berhasil disalin ke clipboard', 'success');
                }}
                className="font-mono text-xs"
              >
                Salin
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Match Score Breakdown */}
      {scoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setScoreModal(null)}>
          <div className="w-full max-w-md rounded-xl bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-100">{scoreModal.job.job_title}</h3>
                <p className="text-xs text-zinc-400">{scoreModal.job.company_name}</p>
              </div>
              <span
                className={`rounded border px-2.5 py-1 font-mono text-xs font-bold ${
                  scoreModal.result.score >= 80
                    ? 'border-emerald-700 bg-emerald-950/80 text-emerald-300'
                    : scoreModal.result.score >= 60
                      ? 'border-amber-700 bg-amber-950/80 text-amber-300'
                      : 'border-rose-700 bg-rose-950/80 text-rose-300'
                }`}
              >
                {scoreModal.result.score}% MATCH
              </span>
            </div>

            <p className="text-xs text-zinc-300 mb-4">{scoreModal.result.summary}</p>

            <div className="space-y-3 font-sans text-xs">
              <div>
                <span className="font-semibold text-emerald-400 block mb-1">Kekuatan & Kesesuaian:</span>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                  {(scoreModal.result.strengths || []).map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-amber-400 block mb-1">Area Pengembangan / Gap:</span>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                  {(scoreModal.result.gaps || []).map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setScoreModal(null)} className="font-mono text-xs">
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
