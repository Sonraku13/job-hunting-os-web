import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import type { PlanType } from '@/lib/quota/limits';

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return <div>Loading...</div>;
  }

  const plan: PlanType = profile.plan as PlanType;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil & Preferensi</h1>
        <p className="mt-2 text-zinc-400">Kelola identitas diri dan kriteria pencarian kerja</p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-6">Informasi Akun</h2>
        <div className="space-y-4 font-mono text-xs">
          <div className="flex justify-between border-b border-zinc-800/60 pb-3">
            <span className="text-zinc-500">NAMA LENGKAP</span>
            <span className="text-zinc-200 font-medium">{profile.full_name || 'Belum diisi'}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/60 pb-3">
            <span className="text-zinc-500">EMAIL</span>
            <span className="text-zinc-200 font-medium">{profile.email || user.email}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800/60 pb-3">
            <span className="text-zinc-500">PAKET AKTIF</span>
            <span className="text-emerald-400 font-semibold uppercase">{plan}</span>
          </div>
        </div>
      </Card>

      <Card className="opacity-80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Curriculum Vitae & Portofolio</h2>
          <span className="font-mono text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">MENDATANG</span>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Profil ini akan menjadi basis otomatisasi pembuatan Cover Letter, scoring kesesuaian lowongan (Match Score), serta kustomisasi email lamaran kerja.
        </p>
      </Card>
    </div>
  );
}
