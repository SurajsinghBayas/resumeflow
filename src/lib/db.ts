import { Pool } from "pg";
import { linkedinHref, linkedinName } from "@/lib/linkedin";
import type { AnalysisRecord, LeaderboardEntry, Profile, Report } from "@/lib/types";

const globalForPg = globalThis as unknown as { pool?: Pool; schema?: Promise<void>; schemaVersion?: number };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Add it to .env.local.");
  }
  return new Pool({
    connectionString,
    max: 5,
  });
}

export const pool = globalForPg.pool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = pool;
}

const SCHEMA_VERSION = 2;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  job_title text NOT NULL DEFAULT '',
  linkedin text NOT NULL DEFAULT '',
  seniority text NOT NULL DEFAULT '',
  work_style text NOT NULL DEFAULT '',
  industries text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  expertise text NOT NULL DEFAULT '',
  onboarded boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS analyses (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  job_description text NOT NULL,
  resume_text text NOT NULL,
  model text NOT NULL,
  report jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analyses_user_created_idx
  ON analyses (user_id, created_at DESC);
`;

export function ensureSchema() {
  if (!globalForPg.schema || globalForPg.schemaVersion !== SCHEMA_VERSION) {
    globalForPg.schemaVersion = SCHEMA_VERSION;
    globalForPg.schema = pool.query(SCHEMA).then(() => undefined).catch((error: unknown) => {
      globalForPg.schema = undefined;
      throw error;
    });
  }
  return globalForPg.schema;
}

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
};

export async function findUserByEmail(email: string) {
  await ensureSchema();
  const result = await pool.query<UserRow>(
    "select id, email, name, password_hash from users where email = $1",
    [email],
  );
  return result.rows[0] ?? null;
}

export async function createUser(input: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}) {
  await ensureSchema();
  await pool.query(
    "insert into users (id, email, name, password_hash) values ($1, $2, $3, $4)",
    [input.id, input.email, input.name, input.passwordHash],
  );
}

function mapProfile(row: {
  job_title: string;
  linkedin: string;
  seniority: string;
  work_style: string;
  industries: string[] | null;
  skills: string[] | null;
  expertise: string;
  onboarded: boolean;
}): Profile {
  return {
    jobTitle: row.job_title,
    linkedin: row.linkedin,
    seniority: row.seniority,
    workStyle: row.work_style,
    industries: row.industries ?? [],
    skills: row.skills ?? [],
    expertise: row.expertise,
    onboarded: row.onboarded,
  };
}

export async function getProfile(userId: string) {
  await ensureSchema();
  const result = await pool.query<{
    job_title: string;
    linkedin: string;
    seniority: string;
    work_style: string;
    industries: string[] | null;
    skills: string[] | null;
    expertise: string;
    onboarded: boolean;
  }>(
    `select job_title, linkedin, seniority, work_style, industries, skills, expertise, onboarded
     from profiles where user_id = $1`,
    [userId],
  );
  return result.rows[0] ? mapProfile(result.rows[0]) : null;
}

export async function saveProfile(userId: string, profile: Profile) {
  await ensureSchema();
  await pool.query(
    `insert into profiles (
       user_id, job_title, linkedin, seniority, work_style, industries, skills, expertise, onboarded, updated_at
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, true, now())
     on conflict (user_id) do update set
       job_title = excluded.job_title,
       linkedin = excluded.linkedin,
       seniority = excluded.seniority,
       work_style = excluded.work_style,
       industries = excluded.industries,
       skills = excluded.skills,
       expertise = excluded.expertise,
       onboarded = true,
       updated_at = now()`,
    [
      userId,
      profile.jobTitle,
      profile.linkedin,
      profile.seniority,
      profile.workStyle,
      profile.industries,
      profile.skills,
      profile.expertise,
    ],
  );
}

export async function listAnalyses(userId: string): Promise<AnalysisRecord[]> {
  await ensureSchema();
  const result = await pool.query<{
    id: string;
    filename: string;
    model: string;
    job_description: string;
    report: Report;
    created_at: Date;
  }>(
    `select id, filename, model, job_description, report, created_at
     from analyses
     where user_id = $1
     order by created_at desc`,
    [userId],
  );
  return result.rows.map((row) => ({
    id: row.id,
    filename: row.filename,
    model: row.model,
    jobDescription: row.job_description,
    report: row.report,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function countAnalysesToday(userId: string): Promise<number> {
  await ensureSchema();
  const result = await pool.query<{ count: string }>(
    `select count(*)::text as count from analyses
      where user_id = $1
        and created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'`,
    [userId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function insertAnalysis(input: {  id: string;
  userId: string;
  filename: string;
  jobDescription: string;
  resumeText: string;
  model: string;
  report: Report;
}) {
  await ensureSchema();
  const result = await pool.query<{ created_at: Date }>(
    `insert into analyses (id, user_id, filename, job_description, resume_text, model, report)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)
     returning created_at`,
    [
      input.id,
      input.userId,
      input.filename,
      input.jobDescription,
      input.resumeText,
      input.model,
      JSON.stringify(input.report),
    ],
  );
  return result.rows[0].created_at.toISOString();
}

export async function getLeaderboard(currentUserId: string): Promise<LeaderboardEntry[]> {
  await ensureSchema();
  const result = await pool.query<{
    user_id: string;
    linkedin: string;
    job_title: string;
    score: number;
    rank: number;
  }>(
    `with best as (
       select user_id, max((report->>'matchScore')::int) as score
       from analyses
       group by user_id
     )
     select p.user_id, p.linkedin, p.job_title, b.score,
            rank() over (order by b.score desc, p.job_title asc) as rank
     from best b
     join profiles p on p.user_id = b.user_id
     where p.onboarded and length(trim(p.linkedin)) > 0
     order by rank asc, p.job_title asc`,
  );
  return result.rows.map((row) => ({
    rank: Number(row.rank),
    linkedinName: linkedinName(row.linkedin),
    linkedinHref: linkedinHref(row.linkedin),
    role: row.job_title,
    score: Number(row.score),
    isYou: row.user_id === currentUserId,
  }));
}
