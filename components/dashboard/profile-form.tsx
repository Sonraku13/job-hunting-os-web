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
  target_job_titles?: string[] | null;
  target_locations?: string[] | null;
  target_classifications?: string[] | null;
  target_employment_types?: string[] | null;
  target_work_arrangements?: string[] | null;
  linkedin_geo_id?: string | null;
  jobstreet_location_id?: string | null;
  min_salary?: number | null;
  max_salary?: number | null;
  years_of_experience?: number | null;
  current_role?: string | null;
  career_goals?: string | null;
  spoken_languages?: string[] | null;
  llm_context?: string | null;
  remote_only?: boolean | null;
}

export function ProfileForm({ initialProfile }: { initialProfile: UserProfileData }) {
  const [formData, setFormData] = useState({
    full_name: initialProfile.full_name || '',
    job_title: initialProfile.job_title || '',
    summary: initialProfile.summary || '',
    portfolio_url: initialProfile.portfolio_url || '',
    salary_range: initialProfile.salary_range || '',
    target_job_titles: (initialProfile.target_job_titles || []).join(', '),
    target_locations: (initialProfile.target_locations || ['Indonesia']).join(', '),
    target_classifications: (initialProfile.target_classifications || []).join(', '),
    target_employment_types: (initialProfile.target_employment_types || []).join(', '),
    target_work_arrangements: (initialProfile.target_work_arrangements || []).join(', '),
    linkedin_geo_id: initialProfile.linkedin_geo_id || '',
    jobstreet_location_id: initialProfile.jobstreet_location_id || '',
    min_salary: initialProfile.min_salary ? String(initialProfile.min_salary) : '',
    max_salary: initialProfile.max_salary ? String(initialProfile.max_salary) : '',
    years_of_experience: initialProfile.years_of_experience ? String(initialProfile.years_of_experience) : '',
    current_role: initialProfile.current_role || '',
    career_goals: initialProfile.career_goals || '',
    spoken_languages: (initialProfile.spoken_languages || ['Indonesian']).join(', '),
    llm_context: initialProfile.llm_context || '',
    remote_only: Boolean(initialProfile.remote_only),
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
        target_job_titles: formData.target_job_titles
          ? formData.target_job_titles.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        target_locations: formData.target_locations
          ? formData.target_locations
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          : [],
        target_classifications: formData.target_classifications
          ? formData.target_classifications.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        target_employment_types: formData.target_employment_types
          ? formData.target_employment_types
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          : [],
        target_work_arrangements: formData.target_work_arrangements
          ? formData.target_work_arrangements
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          : [],
        linkedin_geo_id: formData.linkedin_geo_id || null,
        jobstreet_location_id: formData.jobstreet_location_id || null,
        min_salary: formData.min_salary
          ? parseInt(formData.min_salary)
          : null,
        max_salary: formData.max_salary
          ? parseInt(formData.max_salary)
          : null,
        years_of_experience: formData.years_of_experience
          ? parseInt(formData.years_of_experience)
          : null,
        current_role: formData.current_role || null,
        career_goals: formData.career_goals || null,
        spoken_languages: formData.spoken_languages
          ? formData.spoken_languages.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        llm_context: formData.llm_context || null,
        remote_only: formData.remote_only,
      };

      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Profil berhasil disimpan', 'success');
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
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Identitas Nasional</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Nama Lengkap (Sesuai KTP/KP)
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Contoh: BUDI SANTOSO"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Posisi / Gelar Pekerjaan Saat Ini
            </label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              placeholder="Contoh: Software Engineer @ PT Gojek"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Ringkasan Diri (Bio Personal)
            </label>
            <textarea
              rows={4}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Tuliskan identitas pribadi: latar belakang pendidikan, pengalaman kerja utama, pencapaian terbesar, dan karakter yang mendefinisikan profesionalismemu. Gunakan bahasa natural..."
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Preferensi Agregasi Lowongan</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Lokasi Favorit (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={formData.target_locations}
                onChange={(e) => setFormData({ ...formData, target_locations: e.target.value })}
                placeholder="Jakarta, Bandung, Surabaya, Bali"
                className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                skill/Title target (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={formData.target_job_titles}
                onChange={(e) => setFormData({ ...formData, target_job_titles: e.target.value })}
                placeholder="Frontend Developer, Backend Developer, Tech Lead"
                className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Klasifikasi Pekerjaan (for Jobstreet)
            </label>
            <input
              type="text"
              value={formData.target_classifications}
              onChange={(e) => setFormData({ ...formData, target_classifications: e.target.value })}
              placeholder="Information Communication Technology, Software, Data Science"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Employment Type (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={formData.target_employment_types}
                onChange={(e) => setFormData({ ...formData, target_employment_types: e.target.value })}
                placeholder="fullTime, contract"
                className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Work Arrangement (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={formData.target_work_arrangements}
                onChange={(e) => setFormData({ ...formData, target_work_arrangements: e.target.value })}
                placeholder="remote, hybrid"
                className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Range Gaji (IDR)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={formData.min_salary}
                onChange={(e) => setFormData({ ...formData, min_salary: e.target.value })}
                placeholder="Min. salary"
                className="rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <input
                type="number"
                value={formData.max_salary}
                onChange={(e) => setFormData({ ...formData, max_salary: e.target.value })}
                placeholder="Max. salary"
                className="rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Info Job Mapping</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              LinkedIn Geo ID
            </label>
            <input
              type="text"
              value={formData.linkedin_geo_id}
              onChange={(e) => setFormData({ ...formData, linkedin_geo_id: e.target.value })}
              placeholder="Contoh: 104370960 (Jakarta)"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Jobstreet Location ID
            </label>
            <input
              type="number"
              value={formData.jobstreet_location_id}
              onChange={(e) => setFormData({ ...formData, jobstreet_location_id: e.target.value })}
              placeholder="Contoh: 2030503"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4">LLM Personal Context</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Pengalaman (tahun)
            </label>
            <input
              type="number"
              min="0"
              value={formData.years_of_experience}
              onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
              placeholder="0"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Current Role
            </label>
            <input
              type="text"
              value={formData.current_role}
              onChange={(e) => setFormData({ ...formData, current_role: e.target.value })}
              placeholder="Posisi saat ini di kerjaan saat ini"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
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
              placeholder="Contoh: Ingin menjadi Tech Lead dalam 3 tahun ke depan, spesalisasi cloud architecture, atau mengembangkan produk B2B yang flow..."
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Bahasa yang Digunakan
            </label>
            <input
              type="text"
              value={formData.spoken_languages}
              onChange={(e) => setFormData({ ...formData, spoken_languages: e.target.value })}
              placeholder="Indonesian, English, Jawa"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              LLM Context (Ringkasan Personal)
            </label>
            <textarea
              rows={6}
              value={formData.llm_context}
              onChange={(e) => setFormData({ ...formData, llm_context: e.target.value })}
              placeholder="Tuliskan penjelasan detail bahasa personal untuk AI: gaya bahasa (formal/kasual), poin unggul yang ingin ditonjolkan, dampak kerja yang diharapkan, latar belakang nilai dalam bekerja, dan komunikasi."
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-sans leading-relaxed"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="font-mono text-xs px-6 py-2.5">
          {saving ? 'Menyimpan...' : 'Simpan Profil Lengkap'}
        </Button>
      </div>
    </form>
  );
}