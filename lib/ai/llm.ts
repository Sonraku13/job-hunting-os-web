export interface ExtractResult {
  company: string;
  position: string;
  location: string;
  salary: string;
  requirements: string[];
}

type LLMProvider = 'gemini-direct' | 'zapi-copilot' | 'zapi-chatex' | 'zapi-chatgpt';

const ZAPI_KEY = process.env.ZAPI_API_KEY || '';
const ZAPI_BASE = 'https://api.zapi.ink/v1';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

const providerOrder: LLMProvider[] = [
  'gemini-direct',
  'zapi-copilot',
  'zapi-chatex',
  'zapi-chatgpt',
];

async function callZapiCopilot(messages: { role: string; content: string }[], mode: 'chat' | 'reasoning' | 'smart' = 'chat'): Promise<string> {
  if (!ZAPI_KEY) throw new Error('ZAPI_API_KEY not set');
  const res = await fetch(`${ZAPI_BASE}/ai:copilot/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ZAPI_KEY },
    body: JSON.stringify({ messages, stream: false, mode }),
  });
  if (!res.ok) throw new Error(`Zapi Copilot error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? data.content ?? data.text ?? data.response ?? '';
  if (!text || text === 'Empty response') throw new Error('Empty response from Zapi Copilot');
  return text;
}

async function callZapiChatGPT(messages: { role: string; content: string }[]): Promise<string> {
  if (!ZAPI_KEY) throw new Error('ZAPI_API_KEY not set');
  const res = await fetch(`${ZAPI_BASE}/ai:chatgpt/chat?stream=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ZAPI_KEY },
    body: JSON.stringify({ messages, stream: false }),
  });
  if (!res.ok) throw new Error(`Zapi ChatGPT error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? data.content ?? data.text ?? data.response ?? '';
  if (!text || text === 'Empty response') throw new Error('Empty response from Zapi ChatGPT');
  return text;
}

async function callZapiChatEx(messages: { role: string; content: string }[]): Promise<string> {
  if (!ZAPI_KEY) throw new Error('ZAPI_API_KEY not set');
  const res = await fetch(`${ZAPI_BASE}/ai:chatex/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ZAPI_KEY },
    body: JSON.stringify({ messages, stream: false }),
  });
  if (!res.ok) throw new Error(`Zapi ChatEx error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? data.content ?? data.text ?? data.response ?? '';
  if (!text || text === 'Empty response') throw new Error('Empty response from Zapi ChatEx');
  return text;
}

async function callGeminiDirect(prompt: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

async function callWithFallback(messages: { role: string; content: string }[], mode: 'chat' | 'reasoning' | 'smart' = 'chat'): Promise<{ text: string; provider: LLMProvider }> {
  let lastError: Error | null = null;

  for (const provider of providerOrder) {
    try {
      let text = '';
      switch (provider) {
        case 'gemini-direct':
          text = await callGeminiDirect(messages.map(m => m.content).join('\n\n'));
          break;
        case 'zapi-copilot':
          text = await callZapiCopilot(messages, mode);
          break;
        case 'zapi-chatex':
          text = await callZapiChatEx(messages);
          break;
        case 'zapi-chatgpt':
          text = await callZapiChatGPT(messages);
          break;
      }
      if (text && text !== 'Empty response') {
        return { text, provider };
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      continue;
    }
  }

  throw lastError || new Error('All LLM providers failed');
}

export async function extractJobInfo(text: string): Promise<ExtractResult> {
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

  const { text: resultText } = await callWithFallback([
    { role: 'system', content: 'Kamu adalah parser JSON ketat. Hanya output JSON valid.' },
    { role: 'user', content: prompt },
  ], 'chat');

  const cleaned = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned) as ExtractResult;
  } catch {
    return {
      company: 'Parsing Error',
      position: 'Unknown',
      location: 'Unknown',
      salary: 'Unknown',
      requirements: [resultText],
    };
  }
}

const ANTI_HALLUCINATION_RULES = `PERATURAN KETAT ANTI-HALUSINASI & ISOLASI KONTEKS:
1. HANYA gunakan fakta, skill, pengalaman, dan gelar yang TERTULIS EKSPLISIT pada data pelamar di bawah.
2. DILARANG KERAS MENGARANG: nama perusahaan lama fiktif, angka tahun pengalaman fiktif, metrik/angka palsu, atau sertifikasi yang tidak ada di profil pelamar.
3. ISOLASI TOTAL: Setiap tugas adalah entitas baru yang sepenuhnya terisolasi. JANGAN membawa konteks, memori, atau perusahaan dari lowongan/sesi sebelumnya.
4. Jika profil pelamar tidak menyebutkan riwayat spesifik, jangan mereka-reka cerita; gunakan narasi adaptif berbasis minat, motivasi, dan transferrable skills umum yang relevan.
5. Jangan tinggalkan placeholder kurung siku seperti [Nama Perusahaan] jika data perusahaan/posisi sudah tersedia.`;

export async function generateCoverLetter(params: {
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
  const prompt = `${ANTI_HALLUCINATION_RULES}

Tuliskan surat lamaran kerja (Cover Letter) resmi, profesional, dan tajam dalam Bahasa Indonesia untuk posisi berikut:

DATA PELAMAR (HANYA GUNAKAN DATA INI):
- Nama: ${params.applicantName || 'Pelamar'}
- Posisi / Role Saat Ini: ${params.currentRole || 'Profesional'}
- Pengalaman Kerja: ${params.experienceYears ? `${params.experienceYears} tahun` : 'Sesuai profil'}
- Ringkasan Bio Profil: ${params.summary || 'Memiliki latar belakang yang relevan'}
- Target Karir: ${params.careerGoals || 'Memberikan kontribusi nyata dan berkembang bersama perusahaan'}
- Catatan Personal / Gaya Bahasa: ${params.llmContext || 'Bahasa Indonesia profesional, percaya diri, tanpa basa-basi'}

TARGET LOWONGAN:
- Posisi: ${params.jobTitle}
- Perusahaan: ${params.companyName}
- Deskripsi & Persyaratan Lowongan:
${params.jobDescription || 'Tidak ada deskripsi rinci.'}

Format surat lengkap, siap dikirimkan, terstruktur rapi dengan pembuka, isi argumen nilai tambah, dan penutup profesional.`;

  const { text } = await callWithFallback([
    {
      role: 'system',
      content:
        'Kamu adalah konsultan karir profesional tingkat tinggi. Kamu menulis cover letter secara akurat hanya berdasar data profil yang diberikan tanpa halusinasi fakta.',
    },
    { role: 'user', content: prompt },
  ], 'reasoning');

  return text;
}

export async function generateApplicationEmail(params: {
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
  const prompt = `${ANTI_HALLUCINATION_RULES}

Tuliskan format DRAFT EMAIL LAMARAN KERJA (Cold Email / Job Application Email) yang ringkas, sopan, dan efektif untuk HRD / Hiring Manager.

DATA PELAMAR (HANYA GUNAKAN DATA INI):
- Nama: ${params.applicantName || 'Pelamar'}
- Posisi / Role Saat Ini: ${params.currentRole || 'Profesional'}
- Pengalaman: ${params.experienceYears ? `${params.experienceYears} tahun` : 'Sesuai profil'}
- Ringkasan Profil: ${params.summary || 'Memiliki keahlian relevan'}
- Gaya Komunikasi: ${params.llmContext || 'Formal, sopan, efisien, to-the-point'}

TARGET LOWONGAN:
- Posisi: ${params.jobTitle}
- Perusahaan: ${params.companyName}
- Deskripsi Lowongan:
${params.jobDescription || 'Tidak ada deskripsi rinci.'}

OUTPUT FORMAT HARUS TERDIRI DARI:
Subject: [Subjek Email yang memikat dan jelas, contoh: Lamaran Pekerjaan - Posisi - Nama]
Body Email:
[Isi email singkat 3-4 paragraf: salam pembuka, pengantar singkat, relevansi pelamar terhadap kebutuhan, lampiran CV/portofolio, dan salam penutup].`;

  const { text } = await callWithFallback([
    {
      role: 'system',
      content:
        'Kamu adalah asisten profesional rekrutmen. Tulis draft email lamaran kerja yang bersih, tanpa halusinasi fakta luar, dan siap kirim.',
    },
    { role: 'user', content: prompt },
  ], 'chat');

  return text;
}

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  const messages = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    { role: 'user' as const, content: prompt },
  ];
  const { text } = await callWithFallback(messages, 'chat');
  return text;
}

export async function humanizeText(text: string): Promise<string> {
  if (!ZAPI_KEY) throw new Error('ZAPI_API_KEY not set');
  const res = await fetch(`${ZAPI_BASE}/ai:bypass-ai/humanize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ZAPI_KEY },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Zapi Humanize error (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.humanized || data.text || text;
}