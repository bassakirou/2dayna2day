import { Suspense } from "react";
import DynamicContent from "@/components/ui/DynamicContent";
export default function Page() { return <Suspense fallback={<p>Chargement…</p>}><DynamicContent kind="flash" /></Suspense>; }
