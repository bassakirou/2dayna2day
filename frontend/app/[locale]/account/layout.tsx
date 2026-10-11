import AccountShell from '@/components/ui/AccountShell';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}

