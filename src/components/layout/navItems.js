import { Camera, Landmark, LayoutDashboard, ReceiptText } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Pulse', mobileLabel: 'Pulse', icon: LayoutDashboard },
  { to: '/app/capture', label: 'Capture', mobileLabel: 'Capture', icon: Camera },
  { to: '/app/transactions', label: 'Ledger', mobileLabel: 'Ledger', icon: ReceiptText, badge: true },
  { to: '/app/tax', label: 'ZRA tax', mobileLabel: 'ZRA Tax', icon: Landmark },
];
