import { FileText, Landmark, LayoutDashboard, ReceiptText } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/transactions', label: 'Transactions', icon: ReceiptText, badge: true },
  { to: '/app/tax', label: 'Tax position', icon: Landmark },
  { to: '/app/reports', label: 'Reports', icon: FileText },
];
