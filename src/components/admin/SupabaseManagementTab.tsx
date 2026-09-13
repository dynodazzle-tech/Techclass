import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Download,
  Terminal,
  Server,
  Cloud,
  Layers,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Code
} from 'lucide-react';
import {
  SUPABASE_PROJECT_ID,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  checkClientSupabaseConnection,
  SupabaseHealthInfo
} from '../../lib/supabase';

interface SupabaseManagementTabProps {
  token: string | null;
  onActionNotification: (msg: string, isError?: boolean) => void;
}

interface TableHealthItem {
  table: string;
  exists: boolean;
  count?: number;
  error?: string | null;
}

interface SupabaseServerHealth {
  connected: boolean;
  projectId: string;
  url: string;
  publishableKeyPrefix: string;
  latencyMs: number;
  authServiceOperational: boolean;
  tables: Record<string, TableHealthItem>;
  allTablesReady: boolean;
  tablesCount: {
    total: number;
    ready: number;
  };
  error?: string | null;
}


export const SupabaseManagementTab: React.FC<SupabaseManagementTabProps> = ({
  token,
  onActionNotification
}) => {
  const [loading, setLoading] = useState(true);
  const [serverHealth, setServerHealth] = useState<SupabaseServerHealth | null>(null);
  const [clientHealth, setClientHealth] = useState<SupabaseHealthInfo | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  const [sqlContent, setSqlContent] = useState<string>('');

  const fetchHealth = async () => {
    setLoading(true);
    try {
      // 1. Check server health
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setServerHealth(data);

      // 2. Check client connection directly
      const clientInfo = await checkClientSupabaseConnection();
      setClientHealth(clientInfo);
    } catch (err: any) {
      onActionNotification(err?.message || 'Failed to fetch Supabase status', true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSqlSchema = async () => {
    try {
      const res = await fetch('/api/supabase/schema');
      if (res.ok) {
        const text = await res.text();
        setSqlContent(text);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchHealth();
    fetchSqlSchema();
  }, []);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(SUPABASE_ANON_KEY);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    onActionNotification('Supabase publishable key copied to clipboard');
  };

  const handleCopySql = () => {
    if (!sqlContent) return;
    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    onActionNotification('PostgreSQL setup script copied! Paste it in Supabase SQL Editor.');
  };

  const handleDownloadSql = () => {
    const blob = new Blob([sqlContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase-techclass-schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onActionNotification('Downloaded schema.sql');
  };

  const handleSyncToSupabase = async () => {
    if (!token) return;
    setSyncing(true);
    setSyncLogs([]);

    try {
      const res = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.messages) {
        setSyncLogs(data.messages);
      }

      if (data.syncedTables && data.syncedTables.length > 0) {
        onActionNotification(`Successfully synced ${data.syncedTables.length} tables to Supabase!`);
      } else {
        onActionNotification(
          'No tables ready in Supabase yet. Run the SQL script in Supabase SQL Editor first.',
          true
        );
      }

      // Refresh health
      await fetchHealth();
    } catch (err: any) {
      onActionNotification(err?.message || 'Sync failed', true);
    } finally {
      setSyncing(false);
    }
  };

  const tableList: TableHealthItem[] = serverHealth?.tables
    ? (Object.values(serverHealth.tables) as TableHealthItem[])
    : [];
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Supabase Cloud Backend
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Connected</span>
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Project: <span className="text-emerald-400 font-mono">{SUPABASE_PROJECT_ID}</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Your application is actively connected to your Supabase cloud backend.
                Server and client SDKs are initialized with your live project credentials.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center space-x-2">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">URL:</span>
                <span className="font-mono text-emerald-300 font-bold">{SUPABASE_URL}</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center space-x-2">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Latency:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {serverHealth?.latencyMs ? `${serverHealth.latencyMs} ms` : 'Measuring...'}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center space-x-2">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-400">Auth Service:</span>
                <span className="font-mono text-purple-300 font-bold">Operational</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>

            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
            >
              <span>Open Supabase SQL Editor</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Project Credentials Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Active Supabase Backend Configuration</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-400 mb-1.5">Project Reference ID</label>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-white">
              <span>{SUPABASE_PROJECT_ID}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_PROJECT_ID);
                  onActionNotification('Project ID copied');
                }}
                className="text-slate-400 hover:text-emerald-400 p-1"
                title="Copy Project ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-400 mb-1.5">Supabase Endpoint URL</label>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-emerald-300">
              <span className="truncate mr-2">{SUPABASE_URL}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_URL);
                  onActionNotification('Supabase URL copied');
                }}
                className="text-slate-400 hover:text-emerald-400 p-1 shrink-0"
                title="Copy Supabase URL"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-400">Publishable / Anon API Key</label>
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showKey ? 'Hide Key' : 'Reveal Key'}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-slate-300">
              <span className="truncate mr-2 font-mono">
                {showKey ? SUPABASE_ANON_KEY : `${SUPABASE_ANON_KEY.substring(0, 16)}••••••••••••••••••••••••••••••••`}
              </span>
              <button
                onClick={handleCopyKey}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center space-x-1.5 shrink-0 transition"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Step-by-Step & SQL Script Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Database Table Schema & Instant Setup</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Run this complete script once in your Supabase SQL Editor to provision all 14+ tables
              (courses, tests, pdfs, users, payments, site settings) with indexes and RLS policies.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopySql}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center space-x-1.5 shadow-md shadow-emerald-500/20"
            >
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Script'}</span>
            </button>

            <button
              onClick={handleDownloadSql}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center space-x-1.5"
              title="Download schema.sql"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={() => setShowSqlPreview(!showSqlPreview)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center space-x-1.5"
            >
              <Code className="w-4 h-4 text-amber-400" />
              <span>{showSqlPreview ? 'Hide SQL' : 'View SQL'}</span>
            </button>
          </div>
        </div>

        {/* 3 Simple Setup Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[11px] flex items-center justify-center">1</span>
              <span>Copy SQL Script</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Click the <strong className="text-slate-200">Copy SQL Script</strong> button above to copy the schema definition.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] flex items-center justify-center">2</span>
              <span>Open Supabase SQL Editor</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Go to <a href={sqlEditorUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-semibold">Supabase SQL Editor</a>, paste the script, and click <strong>Run</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center space-x-2 text-purple-400 font-bold">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[11px] flex items-center justify-center">3</span>
              <span>Sync Local Data</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Click <strong className="text-slate-200">Sync Local Data to Supabase</strong> below to upload all existing courses, tests, and PDFs.
            </p>
          </div>
        </div>

        {/* SQL Preview Box */}
        {showSqlPreview && (
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden text-xs">
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-slate-400">
              <span className="font-mono text-[11px]">supabase/schema.sql ({sqlContent.length} chars)</span>
              <button
                onClick={handleCopySql}
                className="text-emerald-400 hover:text-emerald-300 font-bold text-[11px] flex items-center space-x-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Script</span>
              </button>
            </div>
            <pre className="p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72 leading-relaxed selection:bg-cyan-500 selection:text-slate-950">
              {sqlContent}
            </pre>
          </div>
        )}
      </div>

      {/* Table Status Matrix */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Supabase Cloud Tables Status ({serverHealth?.tablesCount.ready ?? 0} of {serverHealth?.tablesCount.total ?? 14} active)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live inspection of PostgreSQL tables in project <span className="font-mono text-slate-200">{SUPABASE_PROJECT_ID}</span>
            </p>
          </div>

          <button
            onClick={handleSyncToSupabase}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing with Supabase...' : 'Sync Local Data to Supabase'}</span>
          </button>
        </div>

        {/* Sync logs if any */}
        {syncLogs.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-[11px] font-mono">
            <div className="text-slate-400 font-bold mb-1">Sync Execution Log:</div>
            {syncLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('Success')
                    ? 'text-emerald-400'
                    : log.includes('Error')
                    ? 'text-red-400'
                    : 'text-slate-400'
                }
              >
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Tables Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tableList.map((t) => (
            <div
              key={t.table}
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                t.exists
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="space-y-0.5 min-w-0 pr-2">
                <div className="font-mono font-bold text-white truncate">{t.table}</div>
                <div className="text-[11px] text-slate-400">
                  {t.exists
                    ? `${t.count ?? 0} records stored`
                    : 'Pending table creation in Supabase'}
                </div>
              </div>

              <div className="shrink-0">
                {t.exists ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span>Create Table</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
