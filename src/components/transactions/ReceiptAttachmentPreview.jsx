import { useEffect, useState } from 'react';
import { Image, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getReceiptPhoto } from '../../services/receiptArchive';

export default function ReceiptAttachmentPreview({ attachmentId, name }) {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded || !attachmentId) return undefined;
    let active = true;
    let objectUrl = '';
    setLoading(true);
    getReceiptPhoto(attachmentId, user?.id || 'guest').then((receipt) => {
      if (!active || !receipt?.blob) return;
      objectUrl = URL.createObjectURL(receipt.blob);
      setImageUrl(objectUrl);
    }).catch(() => { if (active) setImageUrl(''); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [expanded, attachmentId, user?.id]);

  return <div className="mt-3 border-t border-line pt-3"><button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-brand-700 hover:border-brand-200 focus-ring"><Image className="h-4 w-4" />{expanded ? 'Hide receipt photo' : `View receipt photo${name ? ` · ${name}` : ''}`}</button>{expanded && <div className="mt-3 grid min-h-20 place-items-center rounded-xl border border-line bg-surface p-3">{loading ? <LoaderCircle className="h-5 w-5 animate-spin text-brand-700" aria-label="Loading receipt photo" /> : imageUrl ? <img src={imageUrl} alt={name ? `Receipt photo: ${name}` : 'Attached receipt photo'} className="max-h-80 w-full rounded-lg object-contain" /> : <p className="text-xs text-ink-muted">The locally stored receipt photo is unavailable in this browser.</p>}</div>}</div>;
}
