import { useState } from 'react';
import { AlertTriangle, PackagePlus, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardHeader } from '../common/Card';
import { Input } from '../common/FormControls';
import { formatKwacha } from '../../utils/format';

export default function InventoryPanel({ items = [], onChange, readOnly = false }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reorderAt, setReorderAt] = useState('');
  const [unitCost, setUnitCost] = useState('');

  function addItem(event) {
    event.preventDefault();
    if (!name.trim() || quantity === '' || reorderAt === '') return;
    onChange([...items, { id: crypto.randomUUID(), name: name.trim().slice(0, 60), quantity: Number(quantity), reorderAt: Number(reorderAt), unitCost: Number(unitCost) || 0, previousUnitCost: null }]);
    setName(''); setQuantity(''); setReorderAt(''); setUnitCost('');
  }

  function changeItem(id, field, value) {
    onChange(items.map((item) => {
      if (item.id !== id) return item;
      const numeric = Number(value);
      const previousUnitCost = field === 'unitCost' && numeric !== Number(item.unitCost) ? Number(item.unitCost) : item.previousUnitCost;
      return { ...item, [field]: field === 'name' ? value : numeric, previousUnitCost };
    }));
  }

  const lowCount = items.filter((item) => Number(item.quantity) <= Number(item.reorderAt)).length;
  return <Card className="mt-5">
    <CardHeader title="Stock watch" description="Owner-entered counts · stored on this device" action={lowCount > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-bold text-accent-800"><AlertTriangle className="h-3.5 w-3.5" />{lowCount} to check</span>} />
    <div className="p-4 pt-3 sm:p-5 sm:pt-3">
      {items.length > 0 && <ul className="divide-y divide-line rounded-lg border border-line">
        {items.map((item) => {
          const low = Number(item.quantity) <= Number(item.reorderAt);
          const priceUp = Number(item.previousUnitCost) > 0 && Number(item.unitCost) > Number(item.previousUnitCost) * 1.05;
          return <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.name}</p><p className="mt-0.5 text-[11px] text-ink-muted">Restock at {item.reorderAt} units · unit cost {formatKwacha(item.unitCost || 0)}{priceUp ? ` · increased from ${formatKwacha(item.previousUnitCost)}` : ''}</p></div>
            <label className="text-[10px] font-semibold text-ink-muted">Count<Input className="mt-1 h-9 w-20" type="number" min="0" step="any" value={item.quantity} disabled={readOnly} onChange={(event) => changeItem(item.id, 'quantity', event.target.value)} /></label>
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${low ? 'bg-accent-50 text-accent-800' : 'bg-brand-50 text-brand-800'}`}>{low ? 'Check stock' : 'In range'}</span>
            {!readOnly && <button type="button" aria-label={`Remove ${item.name} from stock watch`} onClick={() => onChange(items.filter((entry) => entry.id !== item.id))} className="rounded-md p-2 text-ink-muted hover:bg-danger/5 hover:text-danger"><Trash2 className="h-4 w-4" /></button>}
          </li>;
        })}
      </ul>}
      {!items.length && <p className="rounded-lg border border-dashed border-line p-4 text-xs leading-5 text-ink-muted">Add the few products you most need to watch. Counts are manual until receipt-linked inventory is connected.</p>}
      {!readOnly && <form onSubmit={addItem} className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.3fr_.7fr_.7fr_.8fr_auto]">
        <Input aria-label="Product name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Product or item" maxLength={60} required />
        <Input aria-label="Current stock count" type="number" min="0" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Count now" required />
        <Input aria-label="Restock threshold" type="number" min="0" step="any" value={reorderAt} onChange={(event) => setReorderAt(event.target.value)} placeholder="Restock at" required />
        <Input aria-label="Latest unit cost" type="number" min="0" step="any" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} placeholder="Unit cost K" />
        <Button type="submit" variant="secondary" icon={PackagePlus}>Add</Button>
      </form>}
      <p className="mt-3 text-[10px] leading-4 text-ink-muted">A restock reminder is a prompt to check the shelf. Unit-price changes come from the values you enter here; receipt scans do not update stock automatically yet.</p>
    </div>
  </Card>;
}
