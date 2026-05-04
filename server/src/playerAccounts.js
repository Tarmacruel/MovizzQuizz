import { prisma } from "./db.js";
import { hashPassword, hashToken, makeToken, verifyPassword } from "./security.js";

export const PLAYER_ACCOUNT_SESSION_DAYS = 30;
const HANDLE_PATTERN = /^[a-z0-9_-]{3,24}$/;
const PASSWORD_PATTERN = /^.{4,64}$/;

export function hasAccountDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function normalizeHandle(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
}

function cleanDisplayName(value, fallbackHandle) {
  const clean = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
  return clean || fallbackHandle;
}

function resolvePassword({ password, pin } = {}) {
  return String(password ?? pin ?? "");
}

export function validateAccountPassword(value) {
  return PASSWORD_PATTERN.test(String(value || ""));
}

export const validatePin = validateAccountPassword;

function ensureDatabase() {
  if (!hasAccountDatabase()) {
    const error = new Error("Contas indisponiveis sem banco de dados.");
    error.statusCode = 503;
    throw error;
  }
}

function sessionExpiryDate() {
  return new Date(Date.now() + PLAYER_ACCOUNT_SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function publicAccount(account) {
  if (!account) return null;
  return {
    id: account.id,
    handle: account.handle,
    displayName: account.displayName,
    createdAt: account.createdAt,
  };
}

export async function createPlayerAccountSession(accountId) {
  ensureDatabase();
  const token = makeToken();
  await prisma.playerAccountSession.create({
    data: {
      accountId,
      tokenHash: hashToken(token),
      expiresAt: sessionExpiryDate(),
    },
  });
  return token;
}

export async function registerPlayerAccount({ handle, displayName, password, pin } = {}) {
  ensureDatabase();
  const normalizedHandle = normalizeHandle(handle);
  const cleanPassword = resolvePassword({ password, pin });

  if (!HANDLE_PATTERN.test(normalizedHandle)) {
    const error = new Error("Use um login com 3 a 24 letras, numeros, _ ou -.");
    error.statusCode = 400;
    throw error;
  }
  if (!validateAccountPassword(cleanPassword)) {
    const error = new Error("A senha precisa ter de 4 a 64 caracteres.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const account = await prisma.playerAccount.create({
      data: {
        handle: normalizedHandle,
        displayName: cleanDisplayName(displayName || handle, normalizedHandle),
        pinHash: hashPassword(cleanPassword),
      },
    });
    const token = await createPlayerAccountSession(account.id);
    return { account, token };
  } catch (error) {
    if (error?.code === "P2002") {
      const duplicate = new Error("Este login ja esta em uso.");
      duplicate.statusCode = 409;
      throw duplicate;
    }
    throw error;
  }
}

export async function loginPlayerAccount({ handle, password, pin } = {}) {
  ensureDatabase();
  const normalizedHandle = normalizeHandle(handle);
  const cleanPassword = resolvePassword({ password, pin });
  const account = await prisma.playerAccount.findUnique({
    where: { handle: normalizedHandle },
  });

  if (!account || !validateAccountPassword(cleanPassword) || !verifyPassword(cleanPassword, account.pinHash)) {
    const error = new Error("Login ou senha invalidos.");
    error.statusCode = 401;
    throw error;
  }

  const token = await createPlayerAccountSession(account.id);
  return { account, token };
}

export async function getAccountByToken(token) {
  if (!hasAccountDatabase() || !token) return null;
  const tokenHash = hashToken(token);
  const session = await prisma.playerAccountSession.findUnique({
    where: { tokenHash },
    include: { account: true },
  });

  if (!session || session.expiresAt <= new Date()) return null;

  await prisma.playerAccountSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  }).catch(() => null);

  return session.account;
}

export async function deletePlayerAccountSession(token) {
  if (!hasAccountDatabase() || !token) return false;
  await prisma.playerAccountSession.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
  return true;
}

export async function getAccountStats(accountId) {
  if (!hasAccountDatabase() || !accountId) {
    return { matchesPlayed: 0, wins: 0, totalScore: 0, bestScore: 0, recentMatches: [] };
  }

  const [played, wins, scoreAggregate, recentMatches] = await Promise.all([
    prisma.playerMatchSummary.count({ where: { accountId } }),
    prisma.playerMatchSummary.count({ where: { accountId, won: true } }),
    prisma.playerMatchSummary.aggregate({
      where: { accountId },
      _sum: { score: true },
      _max: { score: true },
    }),
    prisma.playerMatchSummary.findMany({
      where: { accountId },
      orderBy: [{ finishedAt: "desc" }, { playedAt: "desc" }],
      take: 8,
    }),
  ]);

  return {
    matchesPlayed: played,
    wins,
    totalScore: scoreAggregate._sum.score || 0,
    bestScore: scoreAggregate._max.score || 0,
    recentMatches,
  };
}

export function authPayload(account, token, stats = null, activeRooms = []) {
  return {
    token,
    account: publicAccount(account),
    stats,
    activeRooms,
  };
}
