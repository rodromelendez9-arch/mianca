"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, empresa } },
    });

    setCargando(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Si el proyecto de Supabase requiere confirmación de correo,
    // no habrá sesión todavía.
    if (!data.session) {
      setError(
        "Cuenta creada. Revisa tu correo para confirmar antes de entrar."
      );
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
        <Link href="/" className="text-sm font-bold tracking-tight">
          Mianca
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Para dealers y flotillas de equipo usado.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-[var(--muted)]" htmlFor="nombre">
              Tu nombre
            </label>
            <input
              id="nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--muted)]" htmlFor="empresa">
              Empresa
            </label>
            <input
              id="empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--muted)]" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--muted)]" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          {error && <p className="text-sm text-amber-400">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {cargando ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[var(--foreground)] underline">
            Entra
          </Link>
        </p>
      </div>
    </div>
  );
}
