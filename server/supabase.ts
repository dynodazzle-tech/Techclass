import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { queryAll } from './db.js';

export const SUPABASE_PROJECT_ID =
  process.env.SUPABASE_PROJECT_ID || 'nuvxtpwgdlzeqsdnbnpx';

export const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://nuvxtpwgdlzeqsdnbnpx.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_foYtE--cKk39QoG5qizS-g_eM7EWwjY';

// Server-side Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export interface TableCheckResult {
  table: string;
  exists: boolean;
  count?: number;
  error?: string | null;
}

export interface SupabaseServerStatus {
  connected: boolean;
  projectId: string;
  url: string;
  publishableKeyPrefix: string;
  latencyMs: number;
  authServiceOperational: boolean;
  tables: Record<string, TableCheckResult>;
  allTablesReady: boolean;
  tablesCount: {
    total: number;
    ready: number;
  };
  error?: string | null;
}

const MONITORED_TABLES = [
  'site_settings',
  'roles',
  'users',
  'courses',
  'course_modules',
  'lessons',
  'tests',
  'questions',
  'question_translations',
  'pdf_documents',
  'payments',
  'subscriptions',
  'test_attempts',
  'notifications'
];

/**
 * Perform a live check against the Supabase backend
 */
export async function getSupabaseHealth(): Promise<SupabaseServerStatus> {
  const startTime = Date.now();
  let authServiceOperational = false;
  let connectionError: string | null = null;

  try {
    const { error: authError } = await supabase.auth.getSession();
    if (!authError) {
      authServiceOperational = true;
    } else {
      connectionError = authError.message;
    }
  } catch (err: any) {
    connectionError = err?.message || 'Failed to ping Supabase auth service';
  }

  const latencyMs = Date.now() - startTime;
  const tables: Record<string, TableCheckResult> = {};
  let readyCount = 0;

  // Check each table
  await Promise.all(
    MONITORED_TABLES.map(async (tableName) => {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('id', { count: 'exact' })
          .limit(1);

        if (error) {
          tables[tableName] = {
            table: tableName,
            exists: false,
            error: error.message
          };
        } else {
          tables[tableName] = {
            table: tableName,
            exists: true,
            count: count ?? 0,
            error: null
          };
          readyCount++;
        }
      } catch (err: any) {
        tables[tableName] = {
          table: tableName,
          exists: false,
          error: err?.message || 'Error checking table'
        };
      }
    })
  );

  const allTablesReady = readyCount === MONITORED_TABLES.length;

  return {
    connected: authServiceOperational,
    projectId: SUPABASE_PROJECT_ID,
    url: SUPABASE_URL,
    publishableKeyPrefix: SUPABASE_ANON_KEY.substring(0, 18) + '...',
    latencyMs,
    authServiceOperational,
    tables,
    allTablesReady,
    tablesCount: {
      total: MONITORED_TABLES.length,
      ready: readyCount
    },
    error: connectionError
  };
}

/**
 * Return the complete SQL schema definition for Supabase
 */
export function getSupabaseSchemaSql(): string {
  try {
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      return fs.readFileSync(schemaPath, 'utf8');
    }
  } catch (err) {}

  return `-- Run the schema file from /supabase/schema.sql in Supabase SQL editor`;
}

/**
 * Sync local SQLite data to Supabase where tables are ready
 */
export async function syncLocalToSupabase(): Promise<{
  success: boolean;
  syncedTables: string[];
  skippedTables: string[];
  recordsCount: Record<string, number>;
  messages: string[];
}> {
  const syncedTables: string[] = [];
  const skippedTables: string[] = [];
  const recordsCount: Record<string, number> = {};
  const messages: string[] = [];

  // 1. Check which tables exist in Supabase
  const health = await getSupabaseHealth();

  // Helper sync function
  const trySyncTable = async (
    tableName: string,
    selectSql: string,
    transformRow?: (row: any) => any
  ) => {
    if (!health.tables[tableName]?.exists) {
      skippedTables.push(tableName);
      messages.push(`Skipped '${tableName}': table has not been created yet in Supabase SQL Editor.`);
      return;
    }

    try {
      const localRows = queryAll(selectSql);
      if (localRows.length === 0) {
        recordsCount[tableName] = 0;
        syncedTables.push(tableName);
        return;
      }

      const rowsToUpsert = transformRow ? localRows.map(transformRow) : localRows;

      const { error } = await supabase.from(tableName).upsert(rowsToUpsert, { onConflict: 'id' });
      if (error) {
        messages.push(`Error syncing '${tableName}': ${error.message}`);
      } else {
        recordsCount[tableName] = rowsToUpsert.length;
        syncedTables.push(tableName);
        messages.push(`Successfully synced ${rowsToUpsert.length} records into '${tableName}'.`);
      }
    } catch (err: any) {
      messages.push(`Failed syncing '${tableName}': ${err.message}`);
    }
  };

  // Sync Roles
  await trySyncTable('roles', 'SELECT id, name, description FROM roles');

  // Sync Site Settings
  await trySyncTable('site_settings', 'SELECT id, key, value, updated_at FROM site_settings');

  // Sync Courses
  await trySyncTable('courses', 'SELECT * FROM courses', (r) => ({
    ...r,
    is_published: Boolean(r.is_published)
  }));

  // Sync Modules
  await trySyncTable('course_modules', 'SELECT * FROM course_modules');

  // Sync Lessons
  await trySyncTable('lessons', 'SELECT * FROM lessons', (r) => ({
    ...r,
    is_free_preview: Boolean(r.is_free_preview)
  }));

  // Sync Tests
  await trySyncTable('tests', 'SELECT * FROM tests', (r) => ({
    ...r,
    is_published: Boolean(r.is_published)
  }));

  // Sync Questions
  await trySyncTable('questions', 'SELECT * FROM questions');

  // Sync Question Translations
  await trySyncTable('question_translations', 'SELECT * FROM question_translations');

  // Sync PDF Documents
  await trySyncTable('pdf_documents', 'SELECT * FROM pdf_documents', (r) => ({
    ...r,
    allow_download: Boolean(r.allow_download),
    allow_print: Boolean(r.allow_print),
    allow_copy: Boolean(r.allow_copy),
    watermark_enabled: Boolean(r.watermark_enabled),
    is_published: Boolean(r.is_published)
  }));

  // Sync Users
  await trySyncTable('users', 'SELECT * FROM users');

  return {
    success: syncedTables.length > 0 || skippedTables.length > 0,
    syncedTables,
    skippedTables,
    recordsCount,
    messages
  };
}
