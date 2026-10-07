import { ocrImage } from '@/lib/ai/ocr';

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

export interface UniversalJobParseResult {
  job_title: string;
  company_name: string;
  location: string;
  job_type: string;
  salary_range: string;
  job_description: string;
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  apply_url?: string | null;
}

export async function parseUniversalJob(params: {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<UniversalJobParseResult> {
  const prompt = `Analisis postingan lowongan kerja berikut (berupa teks, caption, atau gambar poster) dan ekstrak informasinya secara akurat dan terstruktur.
Deteksi juga kontak resmi: Email pengiriman CV, nomor WhatsApp HR/recruiter, link formulir lamaran (Google Form/Typeform/website), atau link postingan.

Kembalikan HANYA format JSON valid tanpa format markdown \`\`\`json:
{
  "job_title": "Judul Posisi Pekerjaan",
  "company_name": "Nama Perusahaan / Organisasi (atau 'Tidak Disebutkan')",
  "location": "Lokasi kerja (misal 'Jakarta (Remote)' atau 'Indonesia')",
  "job_type": "Full-time / Part-time / Contract / Freelance / Internship",
  "salary_range": "Kisaran gaji jika dicantumkan, atau '-'",
  "job_description": "Rangkuman lengkap deskripsi pekerjaan, tanggung jawab, kualifikasi/syarat lowongan secara bersih dan jelas.",
  "contact_email": "email_hr@perusahaan.com (atau null)",
  "contact_whatsapp": "08123456789 (atau null)",
  "apply_url": "https://link-lamaran (atau null)"
}

${params.text ? `TEKS / CAPTION:\n${params.text}` : ''}`;

  let rawOutput = '';
  if (params.imageBase64) {
    try {
      // Step 1: OCR the image to plain text via Vleee (Qwen3.8 Omni Flash Vision)
      const ocrResult = await ocrImage({
        imageBase64: params.imageBase64,
        mimeType: params.imageMimeType || 'image/jpeg',
      });
      rawOutput = ocrResult.text;
      // If there was also pasted text, prepend it
      if (params.text) {
        rawOutput = `${params.text}\n\n--- TEKS DARI GAMBAR ---\n${rawOutput}`;
      }
      // Step 2: Feed OCR text to LLM text-only pipeline for structured extraction
      const { text } = await callWithFallback([
        { role: 'system', content: 'Kamu adalah parser lowongan kerja. Output HANYA JSON valid.' },
        { role: 'user', content: prompt + `\n\nTEKS HASIL OCR:\n${rawOutput}` },
      ], 'chat');
      rawOutput = text;
    } catch (ocrErr) {
      console.warn('OCR failed, attempting text-only fallback if text available:', ocrErr);
      if (params.text) {
        const { text } = await callWithFallback([
          { role: 'system', content: 'Kamu adalah parser lowongan kerja. Output HANYA JSON valid.' },
          { role: 'user', content: prompt },
        ], 'chat');
        rawOutput = text;
      } else {
        throw ocrErr;
      }
    }
  } else {
    const { text } = await callWithFallback([
      { role: 'system', content: 'Kamu adalah parser lowongan kerja. Output HANYA JSON valid.' },
      { role: 'user', content: prompt },
    ], 'chat');
    rawOutput = text;
  }

  const cleaned = rawOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  let parsed: Partial<UniversalJobParseResult> = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {
      job_title: 'Lowongan Pekerjaan (Auto-detected)',
      company_name: 'Perusahaan',
      location: 'Indonesia',
      job_type: 'Full-time',
      salary_range: '-',
      job_description: params.text || 'Deskripsi diekstrak dari gambar.',
    };
  }

  // Post-processing regex helpers for contacts from text
  const combinedText = `${params.text || ''} ${parsed.job_description || ''}`;
  if (!parsed.contact_email) {
    const emailMatch = combinedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) parsed.contact_email = emailMatch[0];
  }
  if (!parsed.contact_whatsapp) {
    const waMatch = combinedText.match(/(?:\+?62|08)[0-9\s-]{8,14}/);
    if (waMatch) {
      parsed.contact_whatsapp = waMatch[0].replace(/[\s-]/g, '');
    }
  }
  if (!parsed.apply_url) {
    const urlMatch = combinedText.match(/https?:\/\/[^\s"'<>]+/);
    if (urlMatch) parsed.apply_url = urlMatch[0];
  }

  return {
    job_title: parsed.job_title || 'Lowongan Pekerjaan',
    company_name: parsed.company_name || 'Perusahaan',
    location: parsed.location || 'Indonesia',
    job_type: parsed.job_type || 'Full-time',
    salary_range: parsed.salary_range || '-',
    job_description: parsed.job_description || params.text || '',
    contact_email: parsed.contact_email || null,
    contact_whatsapp: parsed.contact_whatsapp || null,
    apply_url: parsed.apply_url || null,
  };
}

function cleanMarkdownSymbols(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
    .replace(/(^|[^_])_([^_\n]+)_/g, '$1$2')
    .replace(/^#+\s+/gm, '')
    .trim();
}

const ANTI_HALLUCINATION_RULES = `PERATURAN KETAT PENULISAN DOKUMEN (ANTI-AI SLOP & ANTI-HALUSINASI):
1. DILARANG KERAS MENGGUNAKAN SIMBOL MARKDOWN (seperti **, *, _, #). Tulis dalam teks polos (plain text) bersih yang rapi, seperti surat lamaran formal asli yang diketik profesional.
2. HANYA gunakan fakta, skill, pengalaman, dan nama yang TERTULIS EKSPLISIT pada data pelamar.
3. DILARANG KERAS MENGARANG: nama perusahaan lama fiktif, angka tahun pengalaman fiktif, metrik/angka palsu, atau sertifikasi yang tidak ada di profil pelamar.
4. TANGGAL HARI INI: Gunakan tanggal yang diberikan di prompt untuk penulisan tanggal surat. JANGAN mengarang atau menggunakan tahun yang salah (seperti 2025 jika tanggal saat ini adalah 2026).
5. SPESIFIK & KONTEKSTUAL: Analisis kebutuhan unik dari Deskripsi Lowongan. Hubungkan pengalaman pelamar secara langsung dengan tantangan dan kebutuhan lowongan tersebut.
6. ISOLASI TOTAL: Setiap tugas adalah entitas baru yang sepenuhnya terisolasi. JANGAN membawa konteks atau nama perusahaan dari lowongan lain.
7. Hindari frasa klise AI. Langsung buka dengan perkenalan profesional, kompetensi utama yang relevan, dan nilai tambah konkret.`;

export interface GenerateCoverLetterParams {
  jobTitle: string;
  companyName: string;
  jobDescription?: string | null;
  applicantName?: string | null;
  currentRole?: string | null;
  experienceYears?: number | null;
  skills?: string[] | null;
  summary?: string | null;
  careerGoals?: string | null;
  llmContext?: string | null;
  phone?: string | null;
  email?: string | null;
  portfolio_url?: string | null;
  preferredLanguage?: 'Indonesian' | 'English' | string | null;
}

export async function generateCoverLetter(params: GenerateCoverLetterParams): Promise<string> {
  const isEnglish = params.preferredLanguage === 'English';
  const now = new Date();
  const formattedDate = now.toLocaleDateString(isEnglish ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const langInstruction = isEnglish
    ? 'Write a professional Cover Letter in ENGLISH. Keep it strictly concise to 1-2 paragraphs only. High level, persuasive, clean plain text without markdown symbols.'
    : 'Tuliskan surat lamaran kerja (Cover Letter) profesional yang SANGAT RINGKAS DAN PADAT (hanya 1-2 paragraf saja). Tulis dalam BAHASA INDONESIA (tanpa simbol markdown * atau **).';

  const prompt = `${ANTI_HALLUCINATION_RULES}

${langInstruction}

TANGGAL SEKARANG: ${formattedDate}

DATA PELAMAR (HANYA GUNAKAN DATA INI):
- Nama: ${params.applicantName || 'Pelamar'}
- Kontak No. HP/WA: ${params.phone || 'Tidak dicantumkan'}
- Email: ${params.email || 'Tidak dicantumkan'}
- Link Portfolio: ${params.portfolio_url || 'Tidak ada'}
- Posisi / Role Saat Ini: ${params.currentRole || 'Profesional'}
- Pengalaman Kerja: ${params.experienceYears ? `${params.experienceYears} tahun` : 'Sesuai profil'}
- Skills Utama: ${Array.isArray(params.skills) && params.skills.length > 0 ? params.skills.join(', ') : 'Sesuai profil'}
- Ringkasan Bio Profil: ${params.summary || 'Memiliki latar belakang yang relevan'}
- Target Karir: ${params.careerGoals || 'Memberikan kontribusi nyata dan berkembang bersama perusahaan'}
- Catatan Personal / Tone: ${params.llmContext || 'Profesional, percaya diri, elegan, to-the-point'}

TARGET LOWONGAN:
- Posisi: ${params.jobTitle}
- Perusahaan: ${params.companyName}
- Deskripsi & Persyaratan Lowongan:
${params.jobDescription || 'Tidak ada deskripsi rinci.'}

ATURAN TAMBAHAN:
1. Batasi panjang teks utama surat hanya 1-2 paragraf padat. Jangan bertele-tele.
2. WAJIB CANTUMKAN Link Portfolio pelamar (jika ada) di dalam surat secara natural.
3. Wajib sertakan tanggal (${formattedDate}) dan kontak pelamar (HP & Email) pada header/footer surat lamaran dengan format yang rapi dan profesional.`;

  const { text } = await callWithFallback([
    {
      role: 'system',
      content:
        'Kamu adalah konsultan karir profesional tingkat tinggi. Tulis surat lamaran kerja dalam format teks polos (plain text) tanpa simbol markdown bintang (* atau **), personal, tajam, dan disesuaikan dengan kebutuhan lowongan.',
    },
    { role: 'user', content: prompt },
  ], 'reasoning');

  return cleanMarkdownSymbols(text);
}

export interface GenerateApplicationEmailParams {
  jobTitle: string;
  companyName: string;
  jobDescription?: string | null;
  applicantName?: string | null;
  currentRole?: string | null;
  experienceYears?: number | null;
  skills?: string[] | null;
  summary?: string | null;
  careerGoals?: string | null;
  llmContext?: string | null;
  phone?: string | null;
  email?: string | null;
  portfolio_url?: string | null;
  preferredLanguage?: 'Indonesian' | 'English' | string | null;
}

export async function generateApplicationEmail(params: GenerateApplicationEmailParams): Promise<string> {
  const isEnglish = params.preferredLanguage === 'English';
  const now = new Date();
  const formattedDate = now.toLocaleDateString(isEnglish ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const langInstruction = isEnglish
    ? 'Write a cold job application email draft in ENGLISH. Strictly concise to 1-2 short paragraphs. Polite, persuasive.'
    : 'Tuliskan DRAFT EMAIL LAMARAN KERJA (Cold Email) yang SANGAT RINGKAS (1-2 paragraf saja), sopan, dan persuasif dalam BAHASA INDONESIA.';

  const prompt = `${ANTI_HALLUCINATION_RULES}

${langInstruction}

TANGGAL SEKARANG: ${formattedDate}

DATA PELAMAR (HANYA GUNAKAN DATA INI):
- Nama: ${params.applicantName || 'Pelamar'}
- Kontak No. HP/WA: ${params.phone || 'Tidak dicantumkan'}
- Email: ${params.email || 'Tidak dicantumkan'}
- Link Portfolio: ${params.portfolio_url || 'Tidak ada'}
- Posisi / Role Saat Ini: ${params.currentRole || 'Profesional'}
- Pengalaman: ${params.experienceYears ? `${params.experienceYears} length` : 'Sesuai profil'}
- Skills: ${Array.isArray(params.skills) && params.skills.length > 0 ? params.skills.join(', ') : 'Sesuai profil'}
- Ringkasan Profil: ${params.summary || 'Memiliki keahlian relevan'}
- Tone Komunikasi: ${params.llmContext || 'Formal, sopan, efisien, to-the-point'}

TARGET LOWONGAN:
- Posisi: ${params.jobTitle}
- Perusahaan: ${params.companyName}
- Deskripsi Lowongan:
${params.jobDescription || 'Tidak ada deskripsi rinci.'}

OUTPUT FORMAT:
Subject: [Subjek Email yang jelas dan memikat]
Body Email:
[Isi email ringkas (1-2 paragraf max): salam pembuka, nilai relevan pelamar terhadap posisi, dan SELALU cantumkan Link Portfolio jika ada, kontak HP/email & lampiran CV, serta salam penutup].`;

  const { text } = await callWithFallback([
    {
      role: 'system',
      content:
        'Kamu adalah asisten rekrutmen profesional. Tulis email lamaran dalam format teks polos tanpa simbol markdown bintang (* atau **).',
    },
    { role: 'user', content: prompt },
  ], 'chat');

  return cleanMarkdownSymbols(text);
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

export interface MatchScoreResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
}

export async function calculateMatchScore(params: {
  jobTitle: string;
  companyName: string;
  jobDescription?: string | null;
  applicantName?: string | null;
  currentRole?: string | null;
  experienceYears?: number | null;
  summary?: string | null;
  skills?: string[] | null;
}): Promise<MatchScoreResult> {
  const prompt = `Analisis kecocokan antara profil kandidat dan lowongan pekerjaan berikut.
Hitung skor kecocokan dalam persentase angka murni 0-100 dan berikan evaluasi ringkas.
Hanya kembalikan JSON valid tanpa markdown format ataupun tanda \`\`\`json!

PROFIL PELAMAR:
- Role / Posisi: ${params.currentRole || 'Software Professional'}
- Pengalaman: ${params.experienceYears || 0} tahun
- Summary: ${params.summary || '-'}
- Skills: ${params.skills?.join(', ') || '-'}

LOWONGAN:
- Posisi: ${params.jobTitle}
- Perusahaan: ${params.companyName}
- Deskripsi Lowongan:
${params.jobDescription || 'Tidak ada deskripsi rinci.'}

FORMAT JSON YANG DIHARAPKAN:
{
  "score": 85,
  "summary": "Ringkasan 1-2 kalimat tentang kecocokan kandidat.",
  "strengths": ["Kekuatan 1", "Kekuatan 2"],
  "gaps": ["Area yang perlu diperdalam 1"]
}`;

  const { text } = await callWithFallback([
    { role: 'system', content: 'Kamu adalah evaluator rekrutmen AI yang objektif. Output HANYA JSON valid.' },
    { role: 'user', content: prompt },
  ], 'chat');

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      score: typeof parsed.score === 'number' ? parsed.score : 75,
      summary: parsed.summary || 'Kandidat memiliki profil yang relevan dengan posisi ini.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Pengalaman relevan'],
      gaps: Array.isArray(parsed.gaps) ? parsed.gaps : ['Ekspektasi spesifik lowongan'],
    };
  } catch {
    return {
      score: 75,
      summary: 'Analisis profil kandidat menunjukkan kecocokan yang baik dengan posisi ini.',
      strengths: ['Latar belakang teknis sesuai'],
      gaps: ['Perlu penyesuaian detail teknis'],
    };
  }
}