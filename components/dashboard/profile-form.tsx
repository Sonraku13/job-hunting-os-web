'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UserProfileData {
  full_name?: string | null;
  job_title?: string | null;
  summary?: string | null;
  portfolio_url?: string | null;
  salary_range?: string | null;
  years_of_experience?: number | null;
  current_role?: string | null;
  career_goals?: string | null;
  spoken_languages?: string[] | null;
  llm_context?: string | null;
}

export function ProfileForm({ initialProfile }: { initialProfile: UserProfileData }) {
  const [formData, setFormData] = useState({
    full_name: initialProfile.full_name || '',
    job_title: initialProfile.job_title || '',
    summary: initialProfile.summary || '',
    portfolio_url: initialProfile.portfolio_url || '',
    salary_range: initialProfile.salary_range || '',
    years_of_experience: initialProfile.years_of_experience ? String(initialProfile.years_of_experience) : '',
    current_role: initialProfile.current_role || '',
    career_goals: initialProfile.career_goals || '',
    spoken_languages: (initialProfile.spoken_languages || ['Indonesian']).join(', '),
    llm_context: initialProfile.llm_context || '',
  });

  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        full_name: formData.full_name,
        job_title: formData.job_title,
        summary: formData.summary,
        portfolio_url: formData.portfolio_url,
        salary_range: formData.salary_range,
        years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
        current_role: formData.current_role || null,
        career_goals: formData.career_goals || null,
        spoken_languages: formData.spoken_languages
          ? formData.spoken_languages.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        llm_context: formData.llm_context || null,
      };

      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Profil pribadi berhasil disimpan', 'success');
      } else {
        showToast(data.error || 'Gagal menyimpan profil', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Identitas & Ringkasan */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Identitas & Ringkasan</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nama lengkap Anda"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Job Title / Posisi Saat Ini
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="Contoh: Senior Frontend Engineer"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Ringkasan Profesional
            </label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Ringkasan singkat karir Anda, skill utama, dan value proposition..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Portfolio / Website
              </label>
              <input
                type="url"
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                placeholder="https://portfolio-anda.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Ekspektasi Gaji (Teks Bebas)
              </label>
              <input
                type="text"
                value={formData.salary_range}
                onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                placeholder="Contoh: 15-25 Juta IDR / bulan"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Karir & Bahasa */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Pengalaman & Karir</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Pengalaman Kerja (tahun)
              </label>
              <input
                type="number"
                min="0"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Bahasa yang Dikuasai
              </label>
              <input
                type="text"
                value={formData.spoken_languages}
                onChange={(e) => setFormData({ ...formData, spoken_languages: e.target.value })}
                placeholder="Indonesian, English"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Posisi Terakhir / Saat Ini
            </label>
            <input
              type="text"
              value={formData.current_role}
              onChange={(e) => setFormData({ ...formData, current_role: e.target.value })}
              placeholder="Posisi di perusahaan saat ini atau sebelumnya"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Career Goals
            </label>
            <textarea
              rows={3}
              value={formData.career_goals}
              onChange={(e) => setFormData({ ...formData, career_goals: e.target.value })}
              placeholder="Contoh: Ingin menjadi Tech Lead dalam 3 tahun ke depan, mendalami distributed systems..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>
        </div>
      </Card>

      {/* 3. LLM Personal Context */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4">LLM Context (Panduan Khusus AI)</h2>
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Berikan konteks personal Anda kepada AI saat meng-generate cover letter, cold email, dan analisa kecocokan lowongan:
          </p>
          <div>
            <textarea
              rows={5}
              value={formData.llm_context}
              onChange={(e) => setFormData({ ...formData, llm_context: e.target.value })}
              placeholder="Tuliskan nada bahasa (misal: profesional, percaya diri, to-the-point), keunggulan utama yang selalu ingin ditonjolkan, nilai kerja, atau instruksi khusus untuk AI..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-sans leading-relaxed"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="font-mono text-xs px-6 py-2.5">
          {saving ? 'Menyimpan...' : 'Simpan Profil'}
        </Button>
      </div>
    </form>
  );
}