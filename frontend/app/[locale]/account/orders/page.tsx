import { Suspense } from "react";
import OrderDetail from "@/components/ui/OrderDetail";
import AccountSkeleton from '@/components/ui/skeletons/AccountSkeleton';
export default function Page() { return <Suspense fallback={<AccountSkeleton />}><OrderDetail /></Suspense>; }
