import {
  extractJobInfo,
  generateCoverLetter,
  generateApplicationEmail,
  generateText,
  type ExtractResult,
  type GenerateCoverLetterParams,
  type GenerateApplicationEmailParams,
} from './llm';

export type { ExtractResult, GenerateCoverLetterParams, GenerateApplicationEmailParams };

export async function callGeminiExtract(text: string): Promise<ExtractResult> {
  return extractJobInfo(text);
}

export async function callGeminiGenerate(promptInput: string): Promise<string> {
  return generateText(promptInput);
}

export async function callGeminiPersonalizedCoverLetter(params: GenerateCoverLetterParams): Promise<string> {
  return generateCoverLetter(params);
}
