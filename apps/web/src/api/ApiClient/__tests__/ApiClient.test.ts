import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClient, apiClient, ApiError } from '../ApiClient';

const jsonResponse = (
  body: unknown,
  status = 200,
  statusText = 'OK',
): Response => {
  return new Response(JSON.stringify(body), { status, statusText });
};

describe('ApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('хранит статус и имя ошибки', () => {
    const error = new ApiError('Не найдено', 404);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Не найдено');
  });

  it('собирает абсолютный URL', () => {
    const client = new ApiClient('http://api.test');

    expect(client.url('/api/plants')).toBe('http://api.test/api/plants');
    expect(apiClient.url('/api/plants')).toBe(
      'http://localhost:3001/api/plants',
    );
  });

  it('возвращает JSON успешного ответа', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));

    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient('http://api.test');
    const payload = await client.fetchJson<{ ok: boolean }>('/api/plants', {
      method: 'GET',
    });

    expect(payload).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/plants', {
      method: 'GET',
    });
  });

  it('берёт текст ошибки из тела ответа', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ error: 'Занято' }, 409, 'Conflict')),
    );

    const client = new ApiClient('http://api.test');

    await expect(client.request('/api/plants')).rejects.toMatchObject({
      message: 'Занято',
      name: 'ApiError',
      status: 409,
    });
  });

  it('подставляет statusText, если нет error или JSON битый', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 500, 'Server Error'))
      .mockResolvedValueOnce(
        new Response('not-json', { status: 502, statusText: 'Bad Gateway' }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient('http://api.test');

    await expect(client.request('/a')).rejects.toMatchObject({
      message: 'Server Error',
      status: 500,
    });
    await expect(client.request('/b')).rejects.toMatchObject({
      message: 'Bad Gateway',
      status: 502,
    });
  });
});
