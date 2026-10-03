export interface ExtractResult {
  company: string;
  position: string;
  location: string;
  salary: string;
  requirements: string[];
}

type LLMProvider = 'zapi-copilot' | 'zapi-chatgpt' | 'zapi-chatex' | 'gemini-direct';

const ZAPI_KEY = process.env.ZAPI_API_KEY || '';
const ZAPI_BASE = 'https://api.zapi.ink/v1';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

const providerOrder: LLMProvider[] = [
  'zapi-copilot',
  'zapi-chatgpt',
  'zapi-chatex',
  'gemini-direct',
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
  return data.choices?.[0]?.message?.content || data.content || 'Empty response';
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
  return data.choices?.[0]?.message?.content || data.content || 'Empty response';
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
  return data.choices?.[0]?.message?.content || data.content || 'Empty response';
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gagal menghasilkan teks.';
}

async function callWithFallback(messages: { role: string; content: string }[], mode: 'chat' | 'reasoning' | 'smart' = 'chat'): Promise<{ text: string; provider: LLMProvider }> {
  let lastError: Error | null = null;

  for (const provider of providerOrder) {
    try {
      let text = '';
      switch (provider) {
        case 'zapi-copilot':
          text = await callZapiCopilot(messages, mode);
          break;
        case 'zapi-chatgpt':
          text = await callZapiChatGPT(messages);
          break;
        case 'zapi-chatex':
          text = await callZapiChatEx(messages);
          break;
        case 'gemini-direct':
          text = await callGeminiDirect(messages.map(m => m.content).join('\n\n'));
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

  const { text } = await callWithFallback([
    { role: 'system', content: 'Kamu adalah career specialist yang menulis cover letter profesional, personal, dan anti-template.' },
    { role: 'user', content: prompt },
  ], 'reasoning');

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