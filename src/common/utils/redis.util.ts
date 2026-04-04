type RedisRestValue = string | number | boolean;

const redisRestUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.REDIS_REST_URL ?? '';
const redisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.REDIS_REST_TOKEN ?? '';

export const HAS_REDIS_REST_CONNECTION = Boolean(redisRestUrl && redisRestToken);

function getRedisBaseUrl() {
  return redisRestUrl.replace(/\/$/, '');
}

async function readRedisResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as { error?: string; result?: T } | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? `Redis request failed with status ${response.status}`);
  }

  if (payload && 'result' in payload) {
    return payload.result as T;
  }

  return payload as T;
}

export async function redisRestCommand<T>(command: string, ...args: RedisRestValue[]) {
  if (!HAS_REDIS_REST_CONNECTION) {
    throw new Error('Redis REST connection is not configured.');
  }

  const path = [command, ...args.map((value) => encodeURIComponent(String(value)))].join('/');
  const response = await fetch(`${getRedisBaseUrl()}/${path}`, {
    headers: {
      Authorization: `Bearer ${redisRestToken}`,
      Accept: 'application/json',
    },
  });

  return readRedisResponse<T>(response);
}

export async function redisRestMultiExec<T>(commands: Array<Array<RedisRestValue>>) {
  if (!HAS_REDIS_REST_CONNECTION) {
    throw new Error('Redis REST connection is not configured.');
  }

  const response = await fetch(`${getRedisBaseUrl()}/multi-exec`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisRestToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(commands),
  });

  return readRedisResponse<T>(response);
}

export async function redisPushTrimList(key: string, value: string, limit: number) {
  return redisRestMultiExec<unknown>([
    ['LPUSH', key, value],
    ['LTRIM', key, 0, limit - 1],
  ]);
}

