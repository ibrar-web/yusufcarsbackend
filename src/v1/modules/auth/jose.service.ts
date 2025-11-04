import { Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';

function getSecret(): Uint8Array {
  const secret = process.env.JOSE_SECRET;
  if (!secret) throw new Error('JOSE_SECRET is not set');
  return new TextEncoder().encode(secret);
}

function durationToMs(s?: string): number {
  if (!s) return 24 * 60 * 60 * 1000;
  const m = /^([0-9]+)([smhd])$/.exec(s.trim());
  if (!m) return 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const mult = m[2] === 's' ? 1 : m[2] === 'm' ? 60 : m[2] === 'h' ? 3600 : 86400;
  return n * mult * 1000;
}

@Injectable()
export class JoseService {
  async sign(payload: JWTPayload, options?: { expiresIn?: string }) {
    const expiresMs = durationToMs(options?.expiresIn ?? process.env.TOKEN_EXPIRES_IN);
    const iat = Math.floor(Date.now() / 1000);
    const exp = Math.floor((Date.now() + expiresMs) / 1000);
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(getSecret());
  }

  async verify<T = JWTPayload>(token: string): Promise<T> {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as T;
  }
}


