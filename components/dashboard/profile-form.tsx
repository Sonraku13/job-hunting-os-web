'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/lib/i18n/context';

interface UserProfileData {
  full_name?: string | null;
  job_title?: string | null;
  summary?: string | null;
  portfolio_url?: string | null;
  salary_range?: string | null;
  years_of_experience?: number | null;
  current_role?: string | null;
  previous_job_title?: string | null;
  career_goals?: string | null;
  spoken_languages?: string[] | null;
  llm_context?: string | null;
  skills?: string[] | null;
  experience?: Array<{ title: string; company: string; start_date: string; end_date: string; description: string }> | null;
  education?: Array<{ degree: string; institution: string; year: string }> | null;
  phone_number?: string | null;
  email_address?: string | null;
  ui_preferred_language?: string | null;
}

export function ProfileForm({
  initialProfile,
  userFullName,
}: {
  initialProfile: UserProfileData;
  userFullName?: string;
}) {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: initialProfile.full_name || userFullName || '',
    job_title: initialProfile.job_title || '',
    summary: initialProfile.summary || '',
    portfolio_url: initialProfile.portfolio_url || '',
    salary_range: initialProfile.salary_range || '',
    years_of_experience: initialProfile.years_of_experience ? String(initialProfile.years_of_experience) : '',
    current_role: initialProfile.current_role || '',
    career_goals: initialProfile.career_goals || '',
    llm_context: initialProfile.llm_context || '',
    phone_number: initialProfile.phone_number || '',
    email_address: initialProfile.email_address || '',
  });

  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    initialProfile.ui_preferred_language || 'Indonesian'
  );

  const [skillsArray, setSkillsArray] = useState<string[]>(initialProfile.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [experienceArray, setExperienceArray] = useState<
    Array<{ title: string; company: string; start_date: string; end_date: string; description: string }>
  >(initialProfile.experience || []);
  const [educationArray, setEducationArray] = useState<
    Array<{ degree: string; institution: string; year: string }>
  >(initialProfile.education || []);

  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skillsArray.includes(val)) {
        setSkillsArray([...skillsArray, val]);
        setSkillInput('');
      }
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsArray(skillsArray.filter((s) => s !== skill));
  };

  const addExperience = () => {
    const isId = language === 'id';
    const title = prompt(isId ? 'Posisi / Job Title:' : 'Position / Job Title:');
    if (!title) return;
    const company = prompt(isId ? 'Perusahaan:' : 'Company:');
    if (!company) return;
    const startDate = prompt(isId ? 'Tahun / Tanggal Mulai:' : 'Start Date / Year:');
    const endDate = prompt(isId ? 'Tahun / Tanggal Selesai (atau "Sekarang"):' : 'End Date / Year (or "Present"):');
    const description = prompt(isId ? 'Deskripsi singkat tugas/pencapaian:' : 'Brief description of duties/achievements:');

    setExperienceArray([
      ...experienceArray,
      {
        title,
        company,
        start_date: startDate || '',
        end_date: endDate || '',
        description: description || '',
      },
    ]);
  };

  const removeExperience = (index: number) => {
    setExperienceArray(experienceArray.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    const isId = language === 'id';
    const degree = prompt(isId ? 'Gelar / Jurusan:' : 'Degree / Field of Study:');
    if (!degree) return;
    const institution = prompt(isId ? 'Nama Universitas / Sekolah:' : 'Institution / University Name:');
    if (!institution) return;
    const year = prompt(isId ? 'Tahun Kelulusan:' : 'Graduation Year:');

    setEducationArray([
      ...educationArray,
      {
        degree,
        institution,
        year: year || '',
      },
    ]);
  };

  const removeEducation = (index: number) => {
    setEducationArray(educationArray.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLanguage) {
      showToast(t('prof_lang_required'), 'error');
      return;
    }

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
        llm_context: formData.llm_context || null,
        skills: skillsArray.length > 0 ? skillsArray : null,
        experience: experienceArray.length > 0 ? experienceArray : null,
        education: educationArray.length > 0 ? educationArray : null,
        phone_number: formData.phone_number || null,
        email_address: formData.email_address || null,
        ui_preferred_language: selectedLanguage,
      };

      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(t('prof_save_success'), 'success');
      } else {
        showToast(data.error || t('prof_save_fail'), 'error');
      }
    } catch {
      showToast(language === 'id' ? 'Gagal menghubungi server' : 'Failed to reach server', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Identitas & Ringkasan */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-[var(--card-foreground)]">{t('prof_identity_title')}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('prof_name')}
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={language === 'id' ? 'Nama lengkap Anda' : 'Your full name'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('prof_job_title')}
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder={language === 'id' ? 'Contoh: Senior Graphic Designer / Frontend Engineer' : 'e.g., Senior Graphic Designer / Frontend Engineer'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
              {t('prof_summary')}
            </label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder={language === 'id' ? 'Ringkasan singkat karir, spesialisasi, dan nilai tambah profesional Anda...' : 'Brief career summary, specialization, and professional value add...'}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {language === 'id' ? 'Tahun Pengalaman Kerja' : 'Years of Experience'}
              </label>
              <input
                type="number"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                placeholder="4"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('prof_portfolio')}
              </label>
              <input
                type="url"
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                placeholder="https://behance.net/username"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('prof_salary')}
              </label>
              <input
                type="text"
                value={formData.salary_range}
                onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                placeholder={language === 'id' ? 'Contoh: 15-20 Juta IDR' : 'e.g., $50k-70k / year'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Kontak */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-[var(--card-foreground)]">{t('prof_contact_title')}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('prof_phone')}
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+62 812 3456 7890"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('prof_email')}
              </label>
              <input
                type="email"
                value={formData.email_address}
                onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                placeholder="email@domain.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Skills */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-[var(--card-foreground)]">{t('prof_skills_title')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-600 uppercase mb-2">
              {language === 'id' ? 'Ketik Skill lalu tekan ENTER:' : 'Type skill then press ENTER:'}
            </label>
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder={t('prof_skills_placeholder')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {skillsArray.length === 0 ? (
              <span className="text-xs text-zinc-500 italic">{language === 'id' ? 'Belum ada skill ditambahkan. Ketik di atas lalu tekan ENTER.' : 'No skills added yet. Type above and press ENTER.'}</span>
            ) : (
              skillsArray.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded bg-indigo-950/60 border border-indigo-800 px-3 py-1 text-xs text-indigo-300 font-mono"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-indigo-400 hover:text-indigo-200 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* 4. Pengalaman Kerja */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--card-foreground)]">{t('prof_exp_title')}</h2>
            <p className="text-xs text-zinc-600">{language === 'id' ? 'Riwayat pekerjaan yang relevan' : 'Relevant work history'}</p>
          </div>
          <Button type="button" variant="outline" onClick={addExperience} className="font-mono text-xs">
            {t('prof_add_exp')}
          </Button>
        </div>

        <div className="space-y-3">
          {experienceArray.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-2">{language === 'id' ? 'Belum ada pengalaman kerja ditambahkan.' : 'No work experience added yet.'}</p>
          ) : (
            experienceArray.map((exp, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3.5"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[var(--card-foreground)]">{exp.title}</h4>
                  <p className="text-xs text-zinc-600">
                    {exp.company} • {exp.start_date} - {exp.end_date || (language === 'id' ? 'Sekarang' : 'Present')}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-[var(--card-muted)] pt-1">{exp.description}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeExperience(idx)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs font-mono h-8 px-2"
                >
                  {t('dash_action_delete')}
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 5. Pendidikan */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--card-foreground)]">{t('prof_edu_title')}</h2>
            <p className="text-xs text-zinc-600">{language === 'id' ? 'Riwayat akademik' : 'Academic history'}</p>
          </div>
          <Button type="button" variant="outline" onClick={addEducation} className="font-mono text-xs">
            {t('prof_add_edu')}
          </Button>
        </div>

        <div className="space-y-3">
          {educationArray.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-2">{language === 'id' ? 'Belum ada riwayat pendidikan ditambahkan.' : 'No education history added yet.'}</p>
          ) : (
            educationArray.map((edu, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3.5"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[var(--card-foreground)]">{edu.degree}</h4>
                  <p className="text-xs text-zinc-600">
                    {edu.institution} • {language === 'id' ? 'Lulus: ' : 'Graduated: '}{edu.year}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeEducation(idx)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs font-mono h-8 px-2"
                >
                  {t('dash_action_delete')}
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 6. Preferensi Bahasa AI & Dokumen */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-2 text-[var(--card-foreground)]">
          {t('prof_lang_title')}
        </h2>
        <p className="text-xs text-zinc-600 mb-4">
          {t('prof_lang_desc')}
        </p>

        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => handleLanguageSelect('Indonesian')}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
              selectedLanguage === 'Indonesian'
                ? 'border-indigo-600 bg-indigo-950/80 text-indigo-200 font-semibold shadow-sm'
                : 'border-[var(--border)] bg-[var(--card)] text-zinc-400 hover:text-[var(--card-foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            🇮🇩 Bahasa Indonesia
          </button>

          <button
            type="button"
            onClick={() => handleLanguageSelect('English')}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
              selectedLanguage === 'English'
                ? 'border-indigo-600 bg-indigo-950/80 text-indigo-200 font-semibold shadow-sm'
                : 'border-[var(--border)] bg-[var(--card)] text-zinc-400 hover:text-[var(--card-foreground)] hover:bg-[var(--muted)]'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
      </Card>

      {/* 7. LLM Context */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-2 text-[var(--card-foreground)]">
          {t('prof_llm_title')}
        </h2>
        <p className="text-xs text-zinc-600 mb-4">
          {t('prof_llm_desc')}
        </p>

        <textarea
          rows={4}
          value={formData.llm_context}
          onChange={(e) => setFormData({ ...formData, llm_context: e.target.value })}
          placeholder={language === 'id' ? 'Tuliskan catatan khusus atau instruksi yang selalu ingin disertakan saat AI menulis dokumen untuk Anda...' : 'Write special notes or instructions to always include when AI writes documents for you...'}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-sans"
        />
      </Card>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving} className="font-mono text-xs px-6 py-2.5">
          {saving ? t('prof_saving') : t('prof_save')}
        </Button>
      </div>
    </form>
  );
}
