'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/lib/i18n/context';
import { 
  ALL_LOCATION_OPTIONS, 
  parseLocations, 
  formatLocations 
} from '@/lib/constants/locations';

interface UserSettingsData {
  target_job_titles?: string[] | null;
  target_locations?: string[] | null;
  target_classifications?: string[] | null;
  target_employment_types?: string[] | null;
  target_work_arrangements?: string[] | null;
  linkedin_geo_id?: string | null;
  jobstreet_location_id?: string | null;
  min_salary?: number | null;
  max_salary?: number | null;
  remote_only?: boolean | null;
  scrape_active?: boolean | null;
  scrape_days?: number[] | null;
  scrape_hours?: number[] | null;
}

const DAYS_LIST = [
  { id: 1, name: 'Senin' },
  { id: 2, name: 'Selasa' },
  { id: 3, name: 'Rabu' },
  { id: 4, name: 'Kamis' },
  { id: 5, name: 'Jumat' },
  { id: 6, name: 'Sabtu' },
  { id: 7, name: 'Minggu' },
];

function utcToWib(utcHour: number): number {
  return (utcHour + 7) % 24;
}

function wibToUtc(wibHour: number): number {
  return (wibHour - 7 + 24) % 24;
}

export function SettingsForm({ initialSettings }: { initialSettings: UserSettingsData }) {
  const { t, language } = useLanguage();
  const initialWibHours = (initialSettings.scrape_hours || [2]).map(utcToWib);

  const [scrapeActive, setScrapeActive] = useState<boolean>(Boolean(initialSettings.scrape_active));
  const [selectedDays, setSelectedDays] = useState<number[]>(initialSettings.scrape_days || [1, 2, 3, 4, 5]);
  const [selectedWibHours, setSelectedWibHours] = useState<number[]>(initialWibHours);

  // Parse initial locations dari string koma ke array
  const initialLocations = parseLocations(
    (initialSettings.target_locations || ['Indonesia']).join(', ')
  );

  const [selectedLocations, setSelectedLocations] = useState<string[]>(initialLocations);
  const [locationSearch, setLocationSearch] = useState('');

  const [formData, setFormData] = useState({
    target_job_titles: (initialSettings.target_job_titles || []).join(', '),
    target_locations: formatLocations(initialLocations),
    target_classifications: (initialSettings.target_classifications || []).join(', '),
    target_employment_types: (initialSettings.target_employment_types || []).join(', '),
    target_work_arrangements: (initialSettings.target_work_arrangements || []).join(', '),
    linkedin_geo_id: initialSettings.linkedin_geo_id || '',
    jobstreet_location_id: initialSettings.jobstreet_location_id || '',
    min_salary: initialSettings.min_salary ? String(initialSettings.min_salary) : '',
    max_salary: initialSettings.max_salary ? String(initialSettings.max_salary) : '',
    remote_only: Boolean(initialSettings.remote_only),
  });

  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort((a, b) => a - b)
    );
  };

  const toggleHour = (hour: number) => {
    setSelectedWibHours((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour].sort((a, b) => a - b)
    );
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) => {
      const updated = prev.includes(loc)
        ? prev.filter((l: string) => l !== loc)
        : [...prev, loc];
      setFormData((fPrev) => ({ ...fPrev, target_locations: formatLocations(updated) }));
      return updated;
    });
  };

  const filteredOptions = ALL_LOCATION_OPTIONS.filter(opt => 
    !opt.disabled && opt.label.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        target_job_titles: formData.target_job_titles
          ? formData.target_job_titles.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        target_locations: selectedLocations, // Array langsung
        target_classifications: formData.target_classifications
          ? formData.target_classifications.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        target_employment_types: formData.target_employment_types
          ? formData.target_employment_types.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        target_work_arrangements: formData.target_work_arrangements
          ? formData.target_work_arrangements.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        linkedin_geo_id: formData.linkedin_geo_id || null,
        jobstreet_location_id: formData.jobstreet_location_id || null,
        min_salary: formData.min_salary ? parseInt(formData.min_salary) : null,
        max_salary: formData.max_salary ? parseInt(formData.max_salary) : null,
        remote_only: formData.remote_only,

        scrape_active: scrapeActive,
        scrape_days: selectedDays,
        scrape_hours: selectedWibHours.map(wibToUtc),
      };

      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(t('set_settings_saved'), 'success');
      } else {
        showToast(data.error || (language === 'id' ? 'Gagal menyimpan pengaturan' : 'Failed to save settings'), 'error');
      }
    } catch {
      showToast(language === 'id' ? 'Gagal menghubungi server' : 'Failed to reach server', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Preferensi Target Pencarian */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-[var(--card-foreground)]">
          {language === 'id' ? 'Target Posisi & Lokasi Pencarian' : 'Target Position & Search Locations'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
              {t('set_search_target_positions')}
            </label>
            <input
              type="text"
              value={formData.target_job_titles}
              onChange={(e) => setFormData({ ...formData, target_job_titles: e.target.value })}
              placeholder={t('set_search_target_positions_placeholder')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
              {t('set_search_target_locations')}
            </label>
            <div className="space-y-2">
              {/* Search box */}
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder={language === 'id' ? 'Cari provinsi / negara...' : 'Search province / country...'}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              
              {/* Selected chips */}
              {selectedLocations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedLocations.map((loc) => (
                    <span key={loc} className="inline-flex items-center gap-1 rounded-sm bg-[#C1EF7B] border border-[#a5df48] px-2.5 py-1 text-xs text-[#0C0B1E] font-medium">
                      {loc}
                      <button
                        type="button"
                        onClick={() => toggleLocation(loc)}
                        className="ml-1 hover:opacity-75"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Dropdown options */}
              <div className="max-h-60 overflow-y-auto rounded-sm border border-[var(--border)] bg-[var(--card)] p-2">
                {filteredOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-[var(--muted)] ${
                      selectedLocations.includes(opt.value) ? 'text-[#0C0B1E] font-semibold bg-[#F1F0FF]' : 'text-[var(--card-foreground)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(opt.value)}
                      onChange={() => toggleLocation(opt.value)}
                      className="w-4 h-4 rounded-sm border-zinc-300 text-[#0C0B1E] focus:ring-[#C1EF7B]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              
              <p className="text-xs text-zinc-500">
                {t('set_search_target_locations_desc').replace('{count}', String(selectedLocations.length))}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('set_search_classifications')}
              </label>
              <input
                type="text"
                value={formData.target_classifications}
                onChange={(e) => setFormData({ ...formData, target_classifications: e.target.value })}
                placeholder={t('set_search_classifications_placeholder')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('set_employment_types')}
              </label>
              <input
                type="text"
                value={formData.target_employment_types}
                onChange={(e) => setFormData({ ...formData, target_employment_types: e.target.value })}
                placeholder={t('set_employment_types_placeholder')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('set_work_arrangements')}
              </label>
              <input
                type="text"
                value={formData.target_work_arrangements}
                onChange={(e) => setFormData({ ...formData, target_work_arrangements: e.target.value })}
                placeholder={t('set_work_arrangements_placeholder')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {language === 'id' ? 'Preferensi Kerja Remote' : 'Remote Work Preference'}
              </label>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="remote_only"
                  checked={formData.remote_only}
                  onChange={(e) => setFormData({ ...formData, remote_only: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="remote_only" className="text-sm text-[var(--card-foreground)] cursor-pointer">
                  {t('set_remote_only_label')}
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('set_linkedin_geo_id')}
              </label>
              <input
                type="text"
                value={formData.linkedin_geo_id}
                onChange={(e) => setFormData({ ...formData, linkedin_geo_id: e.target.value })}
                placeholder={t('set_linkedin_geo_id_placeholder')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
                {t('set_jobstreet_loc_id')}
              </label>
              <input
                type="text"
                value={formData.jobstreet_location_id}
                onChange={(e) => setFormData({ ...formData, jobstreet_location_id: e.target.value })}
                placeholder={t('set_jobstreet_loc_id_placeholder')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--card-foreground)] placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Jadwal Auto-Scraping */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[var(--card-foreground)]">{t('set_schedule_title')}</h2>
            <p className="text-xs text-zinc-600">{t('set_schedule_title_desc')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={scrapeActive}
              onChange={(e) => setScrapeActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0C0B1E] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C1EF7B]"></div>
          </label>
        </div>

        {scrapeActive && (
          <div className="space-y-5 pt-2 border-t border-[var(--border)]">
            {/* Pilihan Hari */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-zinc-600 uppercase">{t('set_schedule_days_label')}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                    className="text-[10px] font-mono text-[#0C0B1E] hover:underline"
                  >
                    {t('set_schedule_days_all_label')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 7])}
                    className="text-[10px] font-mono text-[#0C0B1E] hover:underline"
                  >
                    {t('set_schedule_days_every_label')}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {DAYS_LIST.map((day) => {
                  const isSelected = selectedDays.includes(day.id);
                  const dayName = language === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day.id - 1] : day.name;
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'border-[#a5df48] bg-[#C1EF7B] text-[#0C0B1E] font-semibold'
                          : 'border-[var(--border)] bg-[var(--muted)] text-[var(--card-foreground)] opacity-70 hover:opacity-100'
                      }`}
                    >
                      {dayName}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-zinc-500 font-mono">
              {language === 'id'
                ? 'ℹ️ Auto-scrape dijalankan otomatis 1 kali sehari di pagi hari.'
                : 'ℹ️ Auto-scrape runs automatically once daily in the morning.'}
            </p>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="font-mono text-xs px-6 py-2.5">
          {saving ? t('set_schedule_save_saving') : t('set_schedule_save_label')}
        </Button>
      </div>
    </form>
  );
}