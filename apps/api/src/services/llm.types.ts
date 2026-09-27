export interface LlmTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: unknown;
}

export type LlmTurn =
  | { role: 'assistant'; message: unknown }
  | {
      role: 'tool';
      callId: string;
      name: string;
      content: string;
    };

export interface ChatWithImageOptions {
  systemPrompt: string;
  userPrompt: string;
  imageBase64: string;
  mimeType: string;
}

export interface ChatRoundOptions extends ChatWithImageOptions {
  tools?: LlmTool[];
  turns?: LlmTurn[];
}

export type ChatRound =
  | { kind: 'text'; content: string }
  | { kind: 'tool_calls'; calls: ToolCall[]; message: unknown };

export interface ChatWithToolsOptions extends ChatWithImageOptions {
  tools: LlmTool[];
  executeTool: (call: ToolCall) => Promise<string>;
}

export interface LlmClient {
  chat(options: ChatRoundOptions): Promise<ChatRound>;
  checkHealth(): Promise<'ok' | 'unavailable'>;
}
