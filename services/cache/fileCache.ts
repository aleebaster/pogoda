import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const cacheDir = join(process.cwd(), ".cache");

type CacheEnvelope<T> = {
  expiresAt: number;
  value: T;
};

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await readFile(cachePath(key), "utf8");
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (Date.now() > envelope.expiresAt) return null;
    return envelope.value;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttlMs: number): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(cachePath(key), JSON.stringify({ expiresAt: Date.now() + ttlMs, value }, null, 2), "utf8");
}

export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = await getCached<T>(key);
  if (hit) return hit;
  const value = await loader();
  await setCached(key, value, ttlMs);
  return value;
}

function cachePath(key: string): string {
  return join(cacheDir, `${key.replace(/[^a-z0-9_-]/gi, "_")}.json`);
}
