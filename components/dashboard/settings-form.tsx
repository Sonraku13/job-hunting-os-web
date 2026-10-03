'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  const initialWibHours = (initialSettings.scrape_hours || [2]).map(utcToWib);

  const [scrapeActive, setScrapeActive] = useState<boolean>(Boolean(initialSettings.scrape_active));
  const [selectedDays, setSelectedDays] = useState<number[]>(initialSettings.scrape_days || [1, 2, 3, 4, 5]);
  const [selectedWibHours, setSelectedWibHours] = useState<number[]>(initialWibHours);

  const [formData, setFormData] = useState({
    target_job_titles: (initialSettings.target_job_titles || []).join(', '),
    target_locations: (initialSettings.target_locations || ['Indonesia']).join(', '),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        target_job_titles: formData.target_job_titles
          ? formData.target_job_titles.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        target_locations: formData.target_locations
          ? formData.target_locations.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
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
        showToast('Pengaturan pencarian & jadwal berhasil disimpan', 'success');
      } else {
        showToast(data.error || 'Gagal menyimpan pengaturan', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Preferensi Target Pencarian */}
      <Card>
        <h2 className="text-lg font-semibold tracking-tight mb-4">Target Posisi & Lokasi Pencarian</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Target Posisi / Job Titles (pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={formData.target_job_titles}
              onChange={(e) => setFormData({ ...formData, target_job_titles: e.target.value })}
              placeholder="Full Stack Engineer, Frontend Developer, React Specialist"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
              Target Lokasi (pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={formData.target_locations}
              onChange={(e) => setFormData({ ...formData, target_locations: e.target.value })}
              placeholder="Indonesia, Jakarta, Remote, Bandung"
              className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Klasifikasi Pekerjaan (pisahkan koma)
              </label>
              <input
                type="text"
                value={formData.target_classifications}
                onChange={(e) => setFormData({ ...formData, target_classifications: e.target.value })}
                placeholder="IT, Software Development, Engineering, Data"
                className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Tipe Pekerjaan (pisahkan koma)
              </label>
              <input
                type="text"
                value={formData.target_employment_types}
                onChange={(e) => setFormData({ ...formData, target_employment_types: e.target.value })}
                placeholder="Full-time, Contract, Part-time, Internship"
                className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Arsitektur Kerja (pisahkan koma)
              </label>
              <input
                type="text"
                value={formData.target_work_arrangements}
                onChange={(e) => setFormData({ ...formData, target_work_arrangements: e.target.value })}
                placeholder="Remote, Hybrid, Onsite"
                className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Preferensi Kerja Remote
              </label>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="remote_only"
                  checked={formData.remote_only}
                  onChange={(e) => setFormData({ ...formData, remote_only: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="remote_only" className="text-sm text-zinc-300 cursor-pointer">
                  Hanya cari lowongan Remote
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                LinkedIn Geo ID (Opsional)
              </label>
              <input
                type="text"
                value={formData.linkedin_geo_id}
                onChange={(e) => setFormData({ ...formData, linkedin_geo_id: e.target.value })}
                placeholder="102478259"
                className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 uppercase mb-1">
                Jobstreet Location ID (Opsional)
              </label>
              <input
                type="text"
                value={formData.jobstreet_location_id}
                onChange={(e) => setFormData({ ...formData, jobstreet_location_id: e.target.value })}
                placeholder="1"
                className="w-full rounded-lg border border-[var(--border)] bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Jadwal Auto-Scraping */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Jadwal Auto Scraping Otomatis</h2>
            <p className="text-xs text-zinc-400">Pilih hari dan jam pencarian otomatis lowongan 24 jam terakhir</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={scrapeActive}
              onChange={(e) => setScrapeActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {scrapeActive && (
          <div className="space-y-5 pt-2 border-t border-zinc-800">
            {/* Pilihan Hari */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-zinc-400 uppercase">Pilih Hari Aktif:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                    className="text-[10px] font-mono text-emerald-400 hover:underline"
                  >
                    Senin–Jumat
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 7])}
                    className="text-[10px] font-mono text-emerald-400 hover:underline"
                  >
                    Setiap Hari
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {DAYS_LIST.map((day) => {
                  const isSelected = selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-950/80 text-emerald-300'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {day.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pilihan Jam WIB */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-zinc-400 uppercase">Pilih Jam Eksekusi (WIB):</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWibHours([9, 15, 21])}
                    className="text-[10px] font-mono text-emerald-400 hover:underline"
                  >
                    Pagi, Siang & Malam (09, 15, 21)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWibHours([9])}
                    className="text-[10px] font-mono text-emerald-400 hover:underline"
                  >
                    09:00 Pagi
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {Array.from({ length: 24 }).map((_, hour) => {
                  const isSelected = selectedWibHours.includes(hour);
                  const formattedHour = `${hour.toString().padStart(2, '0')}:00 WIB`;

                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => toggleHour(hour)}
                      className={`rounded-md border py-1.5 text-center font-mono text-xs transition-colors ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-950/80 text-emerald-300 font-bold'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {formattedHour}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="font-mono text-xs px-6 py-2.5">
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </div>
    </form>
  );
}