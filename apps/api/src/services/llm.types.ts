export interface ChatWithImageOptions {
  systemPrompt: string;
  userPrompt: string;
  imageBase64: string;
  mimeType: string;
}

export interface LlmClient {
  chat(options: ChatWithImageOptions): Promise<string>;
  checkHealth(): Promise<'ok' | 'unavailable'>;
}
