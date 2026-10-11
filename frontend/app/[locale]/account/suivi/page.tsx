"use client";
import { useEffect } from "react";
import { useRouter } from "@/navigation";
export default function LegacyAccountPage() { const router = useRouter(); useEffect(() => { router.replace("/account/commandes"); }, [router]); return null; }
