'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useLanguage } from '@/lib/i18n/context';
import { QuickPasteModal } from '@/components/dashboard/quick-paste-modal';

export type JobStatus = 'discover' | 'analyse' | 'apply' | 'refuse' | 'archive';

export interface MatchScoreBreakdown {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
}

export interface SavedJob {
  description_cleaned?: string | null;
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
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  apply_url?: string | null;
  source_url?: string | null;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; badgeClass: string }> = {
  discover: { label: 'Discover', badgeClass: 'bg-[#F1F0FF] text-[#0C0B1E] border-[#C1EF7B]' },
  analyse: { label: 'Analyse', badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  apply: { label: 'Apply', badgeClass: 'bg-[#C1EF7B] text-[#0C0B1E] border-[#a5df48] font-bold' },
  refuse: { label: 'Refuse', badgeClass: 'bg-rose-50 text-rose-800 border-rose-200' },
  archive: { label: 'Archive', badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
};

export function JobList({ initialJobs }: { initialJobs: SavedJob[] }) {
  const { t } = useLanguage();
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
  const [jobDetailModal, setJobDetailModal] = useState<{ job: SavedJob } | null>(null);
  const [quickPasteOpen, setQuickPasteOpen] = useState(false);
  const { showToast } = useToast();

  const handleQuickPasteSuccess = async (jobData: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      const data = await res.json();
      if (res.ok) {
        setJobs((prev) => [data.data, ...prev]);
        showToast('Lowongan berhasil diekstrak & disimpan!', 'success');
      } else {
        showToast(data.error || 'Gagal menyimpan lowongan', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    }
  };

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

  const handleOpenJobDetail = (job: SavedJob) => {
    setJobDetailModal({ job });
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

  const handlePrint = (title: string, content: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              padding: 40px; 
              line-height: 1.6; 
              color: #111; 
              max-width: 800px; 
              margin: 0 auto; 
              white-space: pre-wrap; 
              font-size: 14px; 
            }
            h2 { 
              margin-bottom: 20px; 
              font-size: 18px; 
              border-bottom: 1px solid #ccc; 
              padding-bottom: 8px; 
            }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <div>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <div className="space-y-4">
        {/* Compact Horizontal Actions Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setQuickPasteOpen(true)}
            className="inline-flex items-center justify-center rounded-sm bg-[#0C0B1E] px-3.5 py-1.5 font-mono text-xs font-bold text-[#C1EF7B] transition-colors hover:bg-[#1a1936] shadow-sm whitespace-nowrap"
          >
            {t('qp_title') || '+ Quick Paste'}
          </button>
          <button
            type="button"
            onClick={() => handleManualScrape('linkedin')}
            disabled={scrapingPortal !== null}
            className="inline-flex items-center justify-center rounded-sm border border-zinc-300 bg-white px-3.5 py-1.5 font-mono text-xs font-semibold text-[#0C0B1E] transition-colors hover:bg-[#F1F0FF] hover:border-[#0C0B1E] disabled:opacity-50 whitespace-nowrap"
          >
            {scrapingPortal === 'linkedin' ? t('dash_scraping_linkedin') : t('dash_scrape_linkedin')}
          </button>
          <button
            type="button"
            onClick={() => handleManualScrape('jobstreet')}
            disabled={scrapingPortal !== null}
            className="inline-flex items-center justify-center rounded-sm border border-zinc-300 bg-white px-3.5 py-1.5 font-mono text-xs font-semibold text-[#0C0B1E] transition-colors hover:bg-[#F1F0FF] hover:border-[#0C0B1E] disabled:opacity-50 whitespace-nowrap"
          >
            {scrapingPortal === 'jobstreet' ? t('dash_scraping_jobstreet') : t('dash_scrape_jobstreet')}
          </button>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-sm border border-[var(--border)] bg-[var(--card)] p-12 text-center">
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
              <h3 className="text-base font-semibold text-[var(--foreground)]">{t('dash_empty_title')}</h3>
              <p className="text-xs text-zinc-700">
                {t('dash_empty_desc')}
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
                  {t('dash_add_dummy')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                  className={`rounded-sm border px-3 py-1 font-mono text-xs capitalize transition-colors ${
                    isActive
                      ? 'border-[#0C0B1E] bg-[#0C0B1E] text-[#C1EF7B] font-bold'
                      : 'border-zinc-300 text-zinc-700 bg-white hover:bg-[#F1F0FF] hover:text-[#0C0B1E]'
                  }`}
                >
                  {tab === 'all' ? t('dash_tab_all') : t(`dash_tab_${tab as JobStatus}`)}{' '}
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="font-mono text-xs text-zinc-700 font-medium">
            {t('dash_shown')} {filteredJobs.length} {t('dash_from')} {jobs.length}
          </div>
        </div>

        {/* Job Cards */}
        <div className="divide-y divide-[var(--border)] rounded-sm border border-[var(--border)] bg-[var(--card)]">
          {filteredJobs.map((job) => {
            const isExpanded = expandedId === job.id;
            const currentStatus: JobStatus = job.status || 'discover';
            const statusInfo = STATUS_CONFIG[currentStatus];
            const hasLetter = Boolean(letterById[job.id]);
            const hasEmail = Boolean(emailById[job.id]);
            const matchScore = scoreById[job.id]?.score ?? job.match_score;

            return (
              <div
                key={job.id}
                onClick={() => handleOpenJobDetail(job)}
                className="p-4 transition-colors hover:bg-[#F1F0FF]/50 cursor-pointer"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-base font-semibold text-[#0C0B1E]">{job.job_title}</h3>
                      <span className="rounded-sm bg-[#F1F0FF] border border-zinc-200 px-2 py-0.5 font-mono text-[10px] text-[#0C0B1E] uppercase font-medium">
                        {job.source}
                      </span>
                      {typeof matchScore === 'number' && (
                        <button
                          type="button"
                          onClick={() => handleMatchScore(job)}
                          className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold transition-opacity hover:opacity-80 ${
                            matchScore >= 80
                              ? 'border-[#a5df48] bg-[#C1EF7B] text-[#0C0B1E]'
                              : matchScore >= 60
                                ? 'border-amber-300 bg-amber-100 text-amber-900'
                                : 'border-rose-300 bg-rose-100 text-rose-900'
                          }`}
                        >
                          Match {matchScore}%
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-zinc-800 font-medium">{job.company_name}</p>

                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-zinc-700">
                      {job.location && <span>📍 {job.location}</span>}
                      {job.salary_range && <span>💰 {job.salary_range}</span>}
                      {job.job_type && <span>💼 {job.job_type}</span>}
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    {/* Status Dropdown */}
                    <div className="relative inline-block">
                      <select
                        aria-label="Status Lowongan"
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(job.id, e.target.value as JobStatus)}
                        className={`cursor-pointer rounded-sm border px-2 py-1 font-mono text-xs font-semibold uppercase outline-none transition-colors ${statusInfo.badgeClass}`}
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
                      onClick={(e) => { e.stopPropagation(); handleMatchScore(job); }}
                      disabled={loadingActionId === `score-${job.id}`}
                      className="font-mono text-[11px] px-2 py-1 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 flex items-center gap-1"
                    >
                      {loadingActionId === `score-${job.id}` ? (
                        <>
                          <Spinner size="sm" />
                          {t('dash_loading_score')}
                        </>
                      ) : (
                        t('dash_action_match')
                      )}
                    </Button>

                    {/* Action: Cover Letter */}
                    <Button
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleCoverLetter(job); }}
                      disabled={loadingActionId === `letter-${job.id}`}
                      className="font-mono text-[11px] px-2 py-1 text-[#C1EF7B] hover:text-[#b0e865] hover:bg-[#F1F0FF] flex items-center gap-1"
                    >
                      {loadingActionId === `letter-${job.id}` ? (
                        <>
                          <Spinner size="sm" />
                          {t('dash_loading_write')}
                        </>
                      ) : (
                        t('dash_action_letter')
                      )}
                    </Button>

                    {/* Action: Email Draft */}
                    <Button
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleEmailDraft(job); }}
                      disabled={loadingActionId === `email-${job.id}`}
                      className="font-mono text-[11px] px-2 py-1 text-[#C1EF7B] hover:text-[#b0e865] hover:bg-[#F1F0FF] flex items-center gap-1"
                    >
                      {loadingActionId === `email-${job.id}` ? (
                        <>
                          <Spinner size="sm" />
                          {t('dash_loading_draft')}
                        </>
                      ) : (
                        t('dash_action_email')
                      )}
                    </Button>

                    {/* URL Link */}
                    {job.job_url && (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center rounded-sm border border-zinc-300 bg-white px-2.5 py-1 font-mono text-[11px] text-zinc-700 transition-colors hover:bg-[#F1F0FF]"
                      >
                        URL
                      </a>
                    )}

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                      disabled={deletingId === job.id}
                      className="font-mono text-[11px] px-2 py-1 text-red-700 hover:text-red-800 hover:bg-rose-100"
                    >
                      {deletingId === job.id ? '...' : t('dash_action_delete')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
          </>
        )}
      </div>

      {/* Modal Cover Letter / Email Draft */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0B1E]/40" onClick={() => setModalData(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-sm bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0C0B1E]">{modalData.title}</h3>
              <Button variant="ghost" onClick={() => setModalData(null)} className="text-zinc-500 hover:text-[#0C0B1E] font-mono text-xs">
                ✕
              </Button>
            </div>
            <div className="font-sans text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">
              {modalData.content}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalData(null)} className="font-mono text-xs">{t('dash_action_close')}</Button>
              <Button
                variant="outline"
                onClick={() => handlePrint(modalData.title, modalData.content)}
                className="font-mono text-xs"
              >
                {t('dash_print_pdf')}
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  navigator.clipboard.writeText(modalData.content);
                  showToast(t('dash_copy_success'), 'success');
                }}
                className="font-mono text-xs bg-[#0C0B1E] text-[#C1EF7B] font-bold hover:bg-[#1a1936]"
              >
                {t('dash_copy')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Match Score Breakdown */}
      {scoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0B1E]/40" onClick={() => setScoreModal(null)}>
          <div className="w-full max-w-md rounded-sm bg-[var(--card)] border border-[var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#0C0B1E]">{scoreModal.job.job_title}</h3>
                <p className="text-xs text-zinc-700 font-medium">{scoreModal.job.company_name}</p>
              </div>
              <span
                className={`rounded-sm border px-2.5 py-1 font-mono text-xs font-bold ${
                  scoreModal.result.score >= 80
                    ? 'border-[#a5df48] bg-[#C1EF7B] text-[#0C0B1E]'
                    : scoreModal.result.score >= 60
                      ? 'border-amber-300 bg-amber-100 text-amber-900'
                      : 'border-rose-300 bg-rose-100 text-rose-900'
                }`}
              >
                {scoreModal.result.score}% MATCH
              </span>
            </div>

            <p className="text-xs text-zinc-700 mb-4">{scoreModal.result.summary}</p>

            <div className="space-y-3 font-sans text-xs">
              <div>
                <span className="font-semibold text-emerald-600 block mb-1">{t('dash_match_score_title')}</span>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-700">
                  {(scoreModal.result.strengths || []).map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-amber-600 block mb-1">{t('dash_match_gap_title')}</span>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-700">
                  {(scoreModal.result.gaps || []).map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setScoreModal(null)} className="font-mono text-xs">
                {t('dash_action_close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Lowongan */}
      {jobDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0B1E]/40"
          onClick={() => setJobDetailModal(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-sm border border-[var(--border)] bg-[var(--card)] p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-[var(--border)]">
              <div>
                <h3 className="text-lg font-semibold text-[#0C0B1E]">
                  {jobDetailModal.job.job_title}
                </h3>
                <p className="text-sm font-medium text-zinc-800">
                  {jobDetailModal.job.company_name}
                </p>
                <div className="flex flex-wrap gap-3 font-mono text-xs text-zinc-700 pt-2">
                  {jobDetailModal.job.location && <span>📍 {jobDetailModal.job.location}</span>}
                  {jobDetailModal.job.salary_range && <span>💰 {jobDetailModal.job.salary_range}</span>}
                  {jobDetailModal.job.job_type && <span>💼 {jobDetailModal.job.job_type}</span>}
                  <span className="rounded-sm bg-[#F1F0FF] border border-zinc-200 px-2 py-0.5 text-[10px] text-[#0C0B1E] uppercase font-medium">
                    {jobDetailModal.job.source}
                  </span>
                </div>

                {/* Auto-detected contacts banner if available */}
                {(jobDetailModal.job.contact_email || jobDetailModal.job.contact_whatsapp || jobDetailModal.job.apply_url || jobDetailModal.job.source_url) && (
                  <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-dashed border-zinc-200">
                    {jobDetailModal.job.contact_email && (
                      <a
                        href={`mailto:${jobDetailModal.job.contact_email}`}
                        className="inline-flex items-center gap-1 rounded-sm bg-indigo-50 border border-indigo-200 px-2 py-0.5 font-mono text-[11px] text-indigo-700 hover:bg-indigo-100"
                      >
                        ✉️ {jobDetailModal.job.contact_email}
                      </a>
                    )}
                    {jobDetailModal.job.contact_whatsapp && (
                      <a
                        href={`https://wa.me/${jobDetailModal.job.contact_whatsapp.replace(/\+/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-[11px] text-emerald-700 hover:bg-emerald-100"
                      >
                        💬 WA: {jobDetailModal.job.contact_whatsapp}
                      </a>
                    )}
                    {jobDetailModal.job.apply_url && (
                      <a
                        href={jobDetailModal.job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-sm bg-[#F1F0FF] border border-zinc-200 px-2 py-0.5 font-mono text-[11px] text-[#0C0B1E] hover:bg-[#e4e2ff]"
                      >
                        📝 Form Lamaran ↗
                      </a>
                    )}
                    {jobDetailModal.job.source_url && (
                      <a
                        href={jobDetailModal.job.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-sm bg-zinc-100 border border-zinc-200 px-2 py-0.5 font-mono text-[11px] text-zinc-700 hover:bg-zinc-200"
                      >
                        🔗 Sumber Asli ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={() => setJobDetailModal(null)}
                className="text-zinc-500 hover:text-[#0C0B1E] font-mono text-xs"
              >
                ✕
              </Button>
            </div>

            <div className="my-4 flex-1 overflow-y-auto pr-1 font-sans text-xs leading-relaxed text-[var(--card-foreground)] space-y-3 whitespace-pre-wrap">
              {jobDetailModal.job.job_description || 'Deskripsi pekerjaan tidak tersedia.'}
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {jobDetailModal.job.job_url && (
                  <a
                    href={jobDetailModal.job.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-sm border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-700 transition-colors hover:bg-[#F1F0FF]"
                  >
                    Buka URL Portal
                  </a>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setJobDetailModal(null)}
                className="font-mono text-xs"
              >
                {t('dash_action_close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Paste Modal */}
      <QuickPasteModal
        isOpen={quickPasteOpen}
        onClose={() => setQuickPasteOpen(false)}
        onSuccess={handleQuickPasteSuccess}
      />
    </>
  );
}
