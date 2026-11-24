import { useState } from 'react';
import { Download } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Card from '../common/Card';
import { Skeleton } from '../common/States';
import { useToast } from '../../context/ToastContext';

/**
 * One downloadable report. `onDownload` returns a promise (see services/reportService.js);
 * `children` is the preview area.
 */
export default function ReportCard({ icon: Icon, title, description, periodControl, periodLabel, previewLoading, previewError, children, onDownload, illustrative = false }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const filename = await onDownload();
      toast(`${filename || 'Report'} downloaded.`, { title: 'Report ready' });
    } catch (err) {
      toast(err.message || 'The report could not be created. Try again.', { tone: 'danger', title: 'Download failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 className="text-base font-bold">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
        <div>
          <p className="text-xs font-semibold text-ink-muted">Reporting period</p>
          <p className="text-sm font-bold">{periodLabel}</p>
        </div>
        {periodControl}
      </div>

      <div className="flex-1 border-t border-line bg-surface/60 p-4 sm:p-5" aria-label="Report preview">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-bold">Preview</p>
          <div className="flex gap-1.5">
            {illustrative && <Badge tone="amber">Illustrative</Badge>}
            <Badge tone={previewError ? 'danger' : 'success'}>{previewError ? 'Unavailable' : 'Ready'}</Badge>
          </div>
        </div>
        {previewLoading ? (
          <div className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /></div>
        ) : previewError ? (
          <p className="text-sm text-danger">{previewError}</p>
        ) : (
          children
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
        <p className="text-xs text-ink-muted">PDF · built from your confirmed records</p>
        <Button icon={Download} loading={busy} disabled={previewLoading || Boolean(previewError)} onClick={handleDownload}>Download PDF</Button>
      </div>
    </Card>
  );
}
