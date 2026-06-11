import { cookies } from 'next/headers';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getUser, toPublicUser } from './repository';
import type { PublicUser, User } from './types';

const COOKIE_NAME = 'sb_session';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 小時

function getSecret(): string {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-please-change-in-production-2026';
}

interface SessionPayload {
  uid: string;
  iat: number;
  exp: number;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

function sign(payload: SessionPayload): string {
  const body = b64url(JSON.stringify(payload));
  const mac = createHmac('sha256', getSecret()).update(body).digest();
  return `${body}.${b64url(mac)}`;
}

function verify(token: string): SessionPayload | null {
  const idx = token.lastIndexOf('.');
  if (idx < 0) return null;
  const body = token.slice(0, idx);
  const macHex = token.slice(idx + 1);
  const expected = createHmac('sha256', getSecret()).update(body).digest();
  const got = b64urlDecode(macHex);
  if (expected.length !== got.length) return null;
  if (!timingSafeEqual(expected, got)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = sign({ uid: userId, iat: now, exp: now + COOKIE_MAX_AGE });
  const jar = await cookies();
  jar.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const u = await getUser(payload.uid);
  if (!u || !u.isActive) return null;
  return toPublicUser(u);
}

export async function getCurrentUserFull(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  return getUser(payload.uid);
}

export async function requireUser(): Promise<PublicUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error('UNAUTHENTICATED');
  return u;
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}
