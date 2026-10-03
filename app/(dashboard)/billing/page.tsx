import { requireUser } from '@/lib/auth/require-user';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import type { PlanType } from '@/lib/quota/limits';

export default async function BillingPage() {
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
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-gray-400">Kelola paket langganan Anda</p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Status Paket Saat Ini</h2>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-400">Paket:</span>{' '}
            <span
              className={`font-semibold ${
                plan === 'PAID' ? 'text-green-400' : 'text-blue-400'
              }`}
            >
              {plan}
            </span>
          </div>
          {plan === 'PAID' && profile.paid_until && (
            <div>
              <span className="text-gray-400">Berlaku hingga:</span>{' '}
              <span className="text-white">
                {new Date(profile.paid_until).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </Card>

      {plan === 'FREE' && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Upgrade ke Paket PAID</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Keuntungan Paket PAID:</h3>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                <li>AI Quota: 30 penggunaan per hari (vs 3 di FREE)</li>
                <li>Scraping Quota: 10 penggunaan per hari (vs 1 di FREE)</li>
                <li>Akses ke semua portal scraping tanpa batasan</li>
              </ul>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <h3 className="font-medium mb-2">Cara Pembayaran (Manual):</h3>
              <ol className="list-decimal list-inside text-sm text-gray-300 space-y-2">
                <li>Transfer pembayaran ke rekening yang akan diberikan via email</li>
                <li>Atau scan QRIS yang akan dikirim via WhatsApp</li>
                <li>Kirim bukti pembayaran ke admin</li>
                <li>Admin akan mengaktifkan paket PAID secara manual</li>
                <li>Proses aktivasi: 1-24 jam kerja</li>
              </ol>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-800 rounded p-4 text-sm">
              <p className="text-yellow-300">
                ⚠️ <strong>Penting:</strong> Pembayaran dan aktivasi diproses manual oleh admin.
                Belum ada payment gateway otomatis di MVP ini.
              </p>
            </div>

            <p className="text-sm text-gray-400">
              Untuk informasi harga dan metode pembayaran, hubungi admin melalui email atau
              WhatsApp.
            </p>
          </div>
        </Card>
      )}

      {plan === 'PAID' && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">Perpanjangan Langganan</h2>
          <p className="text-sm text-gray-300 mb-4">
            Untuk memperpanjang langganan, silakan hubungi admin sebelum masa aktif berakhir.
          </p>
          <div className="bg-blue-900/20 border border-blue-800 rounded p-4 text-sm">
            <p className="text-blue-300">
              💡 Jika masa aktif berakhir, akun akan otomatis kembali ke paket FREE.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
