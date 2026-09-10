"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
        Cargando…
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-bold tracking-tight">
            Mianca
          </Link>
          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <span>{session.user.email}</span>
            <button
              type="button"
              onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
