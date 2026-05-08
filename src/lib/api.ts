// ─── API Client — Frontend → Backend ─────────────────────────────────────────
// En prod (build de Vite) el frontend y el API son el mismo origen, así que
// fetch('/api/...') funciona sin URL absoluta. En dev el frontend está en
// :5173 y el API en :3001, por eso necesitamos URL absoluta.
//
// Usamos `import.meta.env.PROD` (boolean inyectado por Vite) en vez de
// confiar en VITE_API_URL para evitar bugs de "string vacío es falsy".
// VITE_API_URL queda como escape hatch opcional (staging, etc).
const API_BASE = import.meta.env.VITE_API_URL
  ?? (import.meta.env.PROD ? '' : 'http://localhost:3001');

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { error?: string })?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export interface LeadPayload {
  name: string;
  email: string;
  whatsapp?: string;
  source?: string;
}

export const submitLead = (payload: LeadPayload) =>
  request<{ ok: boolean; message: string }>('POST', '/api/leads', payload);

export const getLeadCount = () =>
  request<{ total: number }>('GET', '/api/leads/count');

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  hasAccess: boolean;
}

export interface AuthResponse {
  ok: boolean;
  token: string;
  user: AuthUser;
}

export const registerUser = (payload: {
  email: string;
  name: string;
  password: string;
  activationCode: string;
}) => request<AuthResponse>('POST', '/api/auth/register', payload);

export const loginUser = (payload: { email: string; password: string }) =>
  request<AuthResponse>('POST', '/api/auth/login', payload);

export const fetchMe = (token: string) =>
  request<{ user: AuthUser }>('GET', '/api/auth/me', undefined, token);

// ─── Magic-link flow (activación con token opaco) ────────────────────────────
export interface BeginRegistrationResponse {
  ok: boolean;
  email: string;
  name: string;
  codeMasked: string;
  expiresAt: string;
  alreadyRegistered: boolean;
}

export const beginRegistration = (token: string) =>
  request<BeginRegistrationResponse>('POST', '/api/auth/begin-registration', { token });

export const completeRegistration = (token: string, password: string) =>
  request<AuthResponse>('POST', '/api/auth/complete-registration', { token, password });

// ─── Admin: codes ─────────────────────────────────────────────────────────────
export type CodeStatus = 'available' | 'issued' | 'redeemed' | 'expired';

export interface CodeRow {
  id: number;
  code: string;
  issued_to_email: string | null;
  issued_at: string | null;
  expires_at: string | null;
  redeemed_by: number | null;
  redeemed_at: string | null;
  notes: string | null;
  created_at: string;
  status: CodeStatus;
}

export interface CodeCounts {
  total: number;
  available: number;
  issued: number;
  redeemed: number;
  expired: number;
}

export interface CodeListResponse {
  ok: boolean;
  items: CodeRow[];
  counts: CodeCounts;
}

export const generateCodes = (token: string, count: number, notes?: string) =>
  request<{ ok: boolean; count: number; codes: { id: number; code: string }[] }>(
    'POST',
    '/api/admin/codes',
    { count, notes: notes || null },
    token,
  );

export const listCodes = (
  token: string,
  filter: { status?: CodeStatus | 'all'; limit?: number; offset?: number } = {},
) => {
  const qs = new URLSearchParams();
  if (filter.status) qs.set('status', filter.status);
  if (filter.limit !== undefined) qs.set('limit', String(filter.limit));
  if (filter.offset !== undefined) qs.set('offset', String(filter.offset));
  const suffix = qs.toString() ? `?${qs}` : '';
  return request<CodeListResponse>('GET', `/api/admin/codes${suffix}`, undefined, token);
};

export const issueCodeToEmail = (token: string, email: string, notes?: string) =>
  request<{ ok: boolean; code: string; email: string }>(
    'POST',
    '/api/admin/codes/issue-manual',
    { email, notes: notes || null },
    token,
  );

// ─── Public access (Get Code) ────────────────────────────────────────────────
export interface ChallengeQuestion { id: number; question: string }
export interface ChallengeResponse {
  ok: boolean;
  sessionId: string;
  questions: ChallengeQuestion[];
}

export const getChallenge = () =>
  request<ChallengeResponse>('GET', '/api/access/challenge');

export interface RedeemPayload {
  sessionId: string;
  email: string;
  name: string;
  captchaToken?: string | null;
  answers: { id: number; answer: string }[];
}

export const redeemChallenge = (payload: RedeemPayload) =>
  request<{ ok: boolean; message: string }>('POST', '/api/access/redeem', payload);

// ─── Admin: challenges ───────────────────────────────────────────────────────
export interface ChallengeRow {
  id: number;
  question: string;
  answer_norm: string;
  page_ref: string | null;
  active: number;
  created_at: string;
}

export const adminListChallenges = (token: string) =>
  request<{ ok: boolean; items: ChallengeRow[] }>('GET', '/api/admin/challenges', undefined, token);

export const adminCreateChallenge = (
  token: string,
  payload: { question: string; answer: string; page_ref?: string | null },
) =>
  request<{ ok: boolean; id: number }>('POST', '/api/admin/challenges', payload, token);

export const adminUpdateChallenge = (
  token: string,
  id: number,
  patch: { question?: string; answer?: string; page_ref?: string | null; active?: boolean },
) =>
  request<{ ok: boolean; changed: boolean }>('PATCH', `/api/admin/challenges/${id}`, patch, token);

export const adminDeleteChallenge = (token: string, id: number) =>
  request<{ ok: boolean }>('DELETE', `/api/admin/challenges/${id}`, undefined, token);

// ─── Admin: code requests log ────────────────────────────────────────────────
export interface CodeRequestRow {
  id: number;
  email: string;
  ip: string;
  user_agent: string | null;
  challenge_ids: number[];
  passed: number;
  failed_count: number | null;
  code_id: number | null;
  created_at: string;
  issued_code: string | null;
}

export interface CodeRequestCounts {
  total: number;
  passed: number;
  failed: number;
  last24h: number;
}

export const adminListCodeRequests = (
  token: string,
  filter: { passed?: '0' | '1'; email?: string; ip?: string; limit?: number; offset?: number } = {},
) => {
  const qs = new URLSearchParams();
  if (filter.passed) qs.set('passed', filter.passed);
  if (filter.email)  qs.set('email', filter.email);
  if (filter.ip)     qs.set('ip', filter.ip);
  if (filter.limit !== undefined)  qs.set('limit', String(filter.limit));
  if (filter.offset !== undefined) qs.set('offset', String(filter.offset));
  const suffix = qs.toString() ? `?${qs}` : '';
  return request<{ ok: boolean; items: CodeRequestRow[]; counts: CodeRequestCounts }>(
    'GET', `/api/admin/code-requests${suffix}`, undefined, token,
  );
};

// ─── Admin: users + stats ────────────────────────────────────────────────────
export interface AdminUserRow {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  hasAccess: boolean;
  activationCode: string | null;
  createdAt: string;
  totalAttempts: number;
  finishedAttempts: number;
  bestPct: number | null;
  lastPct: number | null;
  lastPassed: boolean | null;
}

export interface AdminUserCounts {
  total: number;
  admins: number;
  withAccess: number;
}

export const adminListUsers = (
  token: string,
  filter: { q?: string; limit?: number; offset?: number } = {},
) => {
  const qs = new URLSearchParams();
  if (filter.q)      qs.set('q', filter.q);
  if (filter.limit !== undefined)  qs.set('limit', String(filter.limit));
  if (filter.offset !== undefined) qs.set('offset', String(filter.offset));
  const suffix = qs.toString() ? `?${qs}` : '';
  return request<{ ok: boolean; items: AdminUserRow[]; counts: AdminUserCounts }>(
    'GET', `/api/admin/users${suffix}`, undefined, token,
  );
};

export const adminResetUser = (token: string, userId: number) =>
  request<{ ok: boolean; affected: number }>(
    'POST', `/api/admin/users/${userId}/reset`, undefined, token,
  );

export interface AdminStats {
  ok: boolean;
  users: { total: number; admins: number; withAccess: number };
  codes: { total: number; available: number; issued: number; redeemed: number; expired: number };
  attempts: {
    total: number;
    inProgress: number;
    submitted: number;
    expired: number;
    discarded: number;
    passed: number;
    avgPct: number | null;
    passRate: number | null;
  };
  codeRequests: {
    total: number;
    passed: number;
    failed: number;
    last24h: number;
    last7d: number;
    successRate: number | null;
  };
  challenges: { total: number; active: number };
}

export const adminGetStats = (token: string) =>
  request<AdminStats>('GET', '/api/admin/stats', undefined, token);

// ─── Exams (autenticado, requiere has_access) ────────────────────────────────
export interface Exam {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  total_questions: number;
  pass_threshold_pct: number;
  time_limit_minutes: number;
}

export const listExams = (token: string) =>
  request<{ ok: boolean; items: Exam[] }>('GET', '/api/exams', undefined, token);

export const getExamBySlug = (token: string, slug: string) =>
  request<{ ok: boolean; exam: Exam }>('GET', `/api/exams/${encodeURIComponent(slug)}`, undefined, token);

// ─── Attempts (autenticado, requiere has_access) ─────────────────────────────
export type AttemptMode   = 'practice' | 'exam';
export type AttemptStatus = 'in_progress' | 'submitted' | 'expired' | 'discarded';

export interface AttemptCreated {
  ok: boolean;
  attemptId: number;
  examSlug: string;
  mode: AttemptMode;
  questionOrder: number[];
  timeLimitSeconds: number | null;
  startedAt: string;
  total: number;
}

export interface AttemptAnswerSummary {
  selectedLetter: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect: boolean | null;
  answeredAt: string | null;
}

export interface AttemptState {
  id: number;
  examSlug: string;
  examTitle: string;
  mode: AttemptMode;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  timeLimitSeconds: number | null;
  questionOrder: number[];
  scoreCorrect: number | null;
  scorePct: number | null;
  passed: boolean | null;
  answers: Record<number, AttemptAnswerSummary>;
}

export interface QuestionPayload {
  id: number;
  statement: string;
  answers: { letter: 'A' | 'B' | 'C' | 'D'; text: string; isCorrect: boolean | null }[];
  justification: string | null;
}

export interface AnswerResult {
  ok: boolean;
  saved: boolean;
  isCorrect?: boolean;
  correctLetter?: 'A' | 'B' | 'C' | 'D';
  justification?: string;
}

export interface SubmitResult {
  ok: boolean;
  attemptId: number;
  status: AttemptStatus;
  scoreCorrect: number;
  scoreTotal: number;
  scorePct: number;
  passed: boolean;
  threshold: number;
}

export interface ReviewItem {
  orderIndex: number;
  questionId: number;
  statement: string;
  answers: { letter: 'A' | 'B' | 'C' | 'D'; text: string; isCorrect: boolean }[];
  correctLetter: 'A' | 'B' | 'C' | 'D' | null;
  selectedLetter: 'A' | 'B' | 'C' | 'D' | null;
  isCorrect: boolean | null;
  justification: string;
}

export interface ReviewResponse {
  ok: boolean;
  attempt: {
    id: number;
    examSlug: string;
    examTitle: string;
    mode: AttemptMode;
    status: AttemptStatus;
    startedAt: string;
    submittedAt: string | null;
    scoreCorrect: number | null;
    scoreTotal: number;
    scorePct: number | null;
    passed: boolean | null;
    threshold: number;
  };
  items: ReviewItem[];
}

export interface AttemptListItem {
  id: number;
  mode: AttemptMode;
  status: AttemptStatus;
  examSlug: string;
  examTitle: string;
  startedAt: string;
  submittedAt: string | null;
  scoreCorrect: number | null;
  scoreTotal: number;
  scorePct: number | null;
  passed: boolean | null;
}

export const createAttempt = (token: string, examSlug: string, mode: AttemptMode) =>
  request<AttemptCreated>('POST', '/api/attempts', { examSlug, mode }, token);

export const listAttempts = (token: string) =>
  request<{ ok: boolean; items: AttemptListItem[] }>('GET', '/api/attempts', undefined, token);

export const getAttempt = (token: string, id: number) =>
  request<{ ok: boolean; attempt: AttemptState }>('GET', `/api/attempts/${id}`, undefined, token);

export const getAttemptQuestion = (token: string, id: number, questionId: number, reveal = false) => {
  const suffix = reveal ? '?reveal=1' : '';
  return request<{ ok: boolean; question: QuestionPayload }>(
    'GET', `/api/attempts/${id}/question/${questionId}${suffix}`, undefined, token,
  );
};

export const submitAnswer = (
  token: string,
  id: number,
  questionId: number,
  letter: 'A' | 'B' | 'C' | 'D',
) => request<AnswerResult>('POST', `/api/attempts/${id}/answer`, { questionId, letter }, token);

export const submitAttempt = (token: string, id: number) =>
  request<SubmitResult>('POST', `/api/attempts/${id}/submit`, undefined, token);

export const getReview = (token: string, id: number) =>
  request<ReviewResponse>('GET', `/api/attempts/${id}/review`, undefined, token);
