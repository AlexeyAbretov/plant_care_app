export class LlmUnavailableError extends Error {
  constructor(message = 'Модель недоступна') {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}

export class LlmTimeoutError extends Error {
  constructor(message = 'Превышено время ожидания') {
    super(message);
    this.name = 'LlmTimeoutError';
  }
}
