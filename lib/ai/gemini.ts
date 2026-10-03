import { extractJobInfo, generateCoverLetter, generateText, type ExtractResult } from './llm';

export type { ExtractResult };

export async function callGeminiExtract(text: string): Promise<ExtractResult> {
  return extractJobInfo(text);
}

export async function callGeminiGenerate(promptInput: string): Promise<string> {
  return generateText(promptInput);
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
  return generateCoverLetter(params);
}