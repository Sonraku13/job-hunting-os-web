export interface ExtractResult {
  company: string;
  position: string;
  location: string;
  salary: string;
  requirements: string[];
}

export async function callGeminiExtract(text: string): Promise<ExtractResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const prompt = `Ekstrak informasi lowongan pekerjaan dari teks berikut dalam format JSON valid.
Hanya kembalikan JSON tanpa markdown formatting atau teks tambahan.
Format JSON yang diharapkan:
{
  "company": "Nama Perusahaan (atau Tidak disebutkan)",
  "position": "Nama Posisi / Jabatan",
  "location": "Lokasi Pekerjaan",
  "salary": "Gaji (atau Tidak disebutkan)",
  "requirements": ["Persyaratan 1", "Persyaratan 2"]
}

Teks Lowongan:
${text}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Clean markdown codeblocks if present
  const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned) as ExtractResult;
  } catch {
    return {
      company: 'Parsing Error',
      position: 'Unknown',
      location: 'Unknown',
      salary: 'Unknown',
      requirements: [rawText],
    };
  }
}

export async function callGeminiGenerate(promptInput: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const prompt = `Buatkan surat lamaran kerja (Cover Letter) profesional, ringkas, dan persuasif dalam Bahasa Indonesia berdasarkan informasi berikut. 

Detail Lowongan / Profil:
${promptInput}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gagal menghasilkan teks.';
}

export async function callGeminiPersonalizedCoverLetter(params: {
  jobTitle: string;
  companyName: string;
  jobDescription?: string | null;
  applicantName?: string | null;
  currentRole?: string | null;
  experienceYears?: number | null;
  summary?: string | null;
  careerGoals?: string | null;
  llmContext?: string | null;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const prompt = `Bertindaklah sebagai spesialis karir profesional. Tulis surat lamaran kerja (Cover Letter) yang ringkas, persuasif, elegan, dan sangat kontekstual.
Hindari kalimat template klise. Tulis dengan gaya naratif natural yang langsung menghubungkan kualifikasi pelamar dengan kebutuhan perusahaan.

DATA PELAMAR:
- Nama: ${params.applicantName || 'Pelamar'}
- Posisi Sekarang: ${params.currentRole || 'Profesional'}
- Pengalaman: ${params.experienceYears ? `${params.experienceYears} tahun` : 'Berpengalaman'}
- Bio/Ringkasan: ${params.summary || 'Memiliki latar belakang teknis yang relevan'}
- Target Karir: ${params.careerGoals || 'Mengembangkan solusi bernilai tambah bagi perusahaan'}
- Konteks Tambahan / Gaya Bahasa: ${params.llmContext || 'Bahasa Indonesia profesional, percaya diri, tanpa basa-basi'}

DETAIL LOWONGAN:
- Posisi Tujuan: ${params.jobTitle}
- Perusahaan: ${params.companyName}
- Deskripsi & Syarat:
${params.jobDescription || 'Tidak ada rincian deskripsi spesifik.'}

Format surat lengkap dan siap kirim (tanpa placeholder kurung siku seperti [Nama Perusahaan] jika data sudah ada). Gunakan Bahasa Indonesia profesional.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gagal menghasilkan cover letter.';
}
