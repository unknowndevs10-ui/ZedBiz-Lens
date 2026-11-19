import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import EntryBox from './EntryBox';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

export default function AddEntryModal({ open, onClose }) {
  const { submitEntry } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(text) {
    const result = await submitEntry(text);
    const count = result.transactions.length;
    toast(`${count} ${count === 1 ? 'entry is' : 'entries are'} ready for your review.`);
    onClose();
    navigate('/app/transactions');
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a business entry" description="Write it the way you would say it. You confirm each line before it counts.">
      <EntryBox id="modal-entry-text" autoFocus onSubmit={handleSubmit} />
    </Modal>
  );
}
