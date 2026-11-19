import { Compass } from 'lucide-react';
import Button from '../components/common/Button';
import { EmptyState } from '../components/common/States';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24">
      <EmptyState icon={Compass} title="We could not find that page" description="The link may be old or mistyped." action={<Button to="/">Go to the home page</Button>} />
    </div>
  );
}
