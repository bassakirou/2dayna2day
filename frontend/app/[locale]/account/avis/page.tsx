import { Suspense } from 'react';
import AccountReviews from '@/components/ui/AccountReviews';
import AccountSkeleton from '@/components/ui/skeletons/AccountSkeleton';
export default function Page() { return <Suspense fallback={<AccountSkeleton />}><AccountReviews /></Suspense>; }
