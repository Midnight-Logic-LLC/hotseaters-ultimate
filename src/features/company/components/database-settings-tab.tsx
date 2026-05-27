/**
 * database-settings-tab.tsx — adapted port of
 * `HotSeatersMVP/src/components/settings/DatabaseDebug.jsx`.
 *
 * The bible's DatabaseDebug tab exposes base44's database panel. This port
 * runs on a different architecture (PGlite local-first + Electric sync), so
 * the tab is adapted to reflect what the port can actually surface:
 *
 *   - Local Database card: PGlite active state + bundled schema version +
 *     a "Clear Local Data" destructive action gated behind AlertDialog.
 *   - Sync card: tenant id + last hydration timestamp + a "Force Sync"
 *     action that drops the local cache and reloads.
 *
 * Components → hooks only (RULE B). All I/O lives in
 * `useDatabaseStatus()`.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useDatabaseStatus } from '@/features/company/hooks/use-database-status';

function formatTimestamp(value: string | null): string {
  if (!value) return 'never';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function DatabaseSettingsTab() {
  const {
    status,
    isLoading,
    loadError,
    actionState,
    actionError,
    clearLocal,
    forceSync,
  } = useDatabaseStatus();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const isWorking = actionState === 'working';

  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Local Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading local database status…
            </div>
          ) : loadError ? (
            <div className="text-destructive flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{loadError}</span>
            </div>
          ) : status ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">Local database: Active</span>
              </div>
              <dl className="text-muted-foreground grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
                <dt>Schema version</dt>
                <dd className="font-mono">{status.schemaVersion}</dd>
                <dt>Engine</dt>
                <dd>PGlite (WASM Postgres)</dd>
              </dl>
            </>
          ) : (
            <div className="text-muted-foreground">
              Local database has not been initialized for this user.
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmClearOpen(true)}
              disabled={isWorking || !status}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Local Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Electric Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {status ? (
            <dl className="text-muted-foreground grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
              <dt>Tenant</dt>
              <dd className="font-mono">{status.tenantId ?? 'not bound'}</dd>
              <dt>Last hydrated</dt>
              <dd>{formatTimestamp(status.hydratedAt)}</dd>
              <dt>Connection</dt>
              <dd>{status.hydratedAt ? 'Connected' : 'Not yet hydrated'}</dd>
            </dl>
          ) : (
            <div className="text-muted-foreground">
              Sync state unavailable.
            </div>
          )}

          {actionError && (
            <div
              role="alert"
              className="text-destructive flex items-start gap-2 text-xs"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => void forceSync()}
              disabled={isWorking || !status}
            >
              {isWorking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Force Sync
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear local data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all locally cached data. You will need to
              re-sync from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setConfirmClearOpen(false);
                await clearLocal();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Clear Local Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
