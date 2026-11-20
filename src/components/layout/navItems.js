import { Bot, FileText, Landmark, LayoutDashboard, ReceiptText } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: LayoutDashboard },
  { to: '/app/transactions', label: 'Transactions', mobileLabel: 'Ledger', icon: ReceiptText, badge: true },
  { to: '/app/agent', label: 'AI Agent', mobileLabel: 'Agent', icon: Bot },
  { to: '/app/tax', label: 'Tax position', mobileLabel: 'Tax', icon: Landmark },
  { to: '/app/reports', label: 'Reports', mobileLabel: 'Reports', icon: FileText },
];
