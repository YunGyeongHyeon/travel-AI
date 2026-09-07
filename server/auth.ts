import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getErrorMessage } from "../src/lib/errors.js";

export interface AuthedRequest extends Request {
  auth?: { userId: string; token: string };
}

function env(name: string): string | undefined {
  const value = process.env[name];
  return value ? value.replace(/\/+$/, "") : undefined;
}

let jwkSet: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwkSet() {
  if (jwkSet) return jwkSet;
  const url = env("SUPABASE_JWKS_URL");
  if (!url) return null;
  // createRemoteJWKSet은 키를 캐시하므로 요청마다 네트워크를 타지 않는다.
  jwkSet = createRemoteJWKSet(new URL(url));
  return jwkSet;
}

/**
 * Supabase Auth API로 토큰을 확인한다.
 * 프로젝트가 아직 레거시 HS256 시크릿을 쓰는 경우 JWKS 검증이 실패하므로,
 * 그때를 위한 대비책이다. 요청마다 네트워크를 한 번 더 타므로 주 경로는 아니다.
 */
async function verifyWithAuthApi(token: string): Promise<string | null> {
  const url = env("SUPABASE_URL");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function verifyToken(token: string): Promise<string | null> {
  const keys = getJwkSet();

  if (keys) {
    try {
      const issuer = env("SUPABASE_URL");
      const { payload } = await jwtVerify(token, keys, {
        issuer: issuer ? `${issuer}/auth/v1` : undefined,
      });
      // anon/publishable 키로 만든 토큰에는 sub가 없다. 사람만 통과시킨다.
      if (typeof payload.sub === "string" && payload.sub.length > 0) {
        return payload.sub;
      }
      return null;
    } catch (error) {
      console.warn(
        "JWKS 검증 실패. Auth API로 재확인합니다:",
        getErrorMessage(error, "unknown"),
      );
    }
  }

  return verifyWithAuthApi(token);
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/**
 * AI 엔드포인트 보호용 미들웨어.
 * 돈이 나가는 호출이므로 로그인한 사용자만 통과시킨다.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }

  try {
    const userId = await verifyToken(token);
    if (!userId) {
      return res
        .status(401)
        .json({ error: "세션이 만료되었습니다. 다시 로그인해 주세요." });
    }

    (req as AuthedRequest).auth = { userId, token };
    next();
  } catch (error) {
    console.error("인증 처리 중 오류:", error);
    res.status(500).json({ error: "인증을 확인하지 못했습니다." });
  }
}

/**
 * 사용자의 토큰을 그대로 물려준 Supabase 클라이언트.
 * 서비스 키가 아니므로 RLS가 그대로 적용된다 — 서버가 대신 쓰더라도
 * 그 사용자가 쓸 수 있는 행만 쓸 수 있다.
 */
export function createUserScopedClient(token: string): SupabaseClient | null {
  const url = env("SUPABASE_URL");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error(
      "SUPABASE_URL 또는 SUPABASE_PUBLISHABLE_KEY가 없어 여행 로그를 저장할 수 없습니다.",
    );
    return null;
  }

  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * RLS를 우회하는 서비스 클라이언트.
 *
 * 크레딧 차감·환불처럼 "사용자가 스스로 하면 안 되는" 조작에만 쓴다.
 * 이 키가 브라우저로 새면 DB 전체가 열리므로 절대 프론트로 내보내지 말 것.
 */
export function createServiceClient(): SupabaseClient | null {
  const url = env("SUPABASE_URL");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error(
      "SUPABASE_URL 또는 SUPABASE_SECRET_KEY가 없어 크레딧을 처리할 수 없습니다.",
    );
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
