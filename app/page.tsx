import Link from "next/link";

const pasos = [
  {
    numero: "01",
    titulo: "Sube fotos o video",
    descripcion:
      "Por cada equipo de tu flota: fotos generales, número de serie, horómetro y estado visible.",
  },
  {
    numero: "02",
    titulo: "IA identifica el equipo",
    descripcion:
      "Marca, modelo, año aproximado, horas de uso y accesorios incluidos, detectados automáticamente.",
  },
  {
    numero: "03",
    titulo: "Comparables reales",
    descripcion:
      "Buscamos listados activos similares en Mercado Libre para anclar un rango de precio defendible.",
  },
  {
    numero: "04",
    titulo: "Anuncio listo, precio justo",
    descripcion:
      "Título y descripción optimizados, publicados directo a Mercado Libre o listos para Facebook Marketplace.",
  },
];

export default function LandingPage() {
  return (
    <main>
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-lg font-bold tracking-tight">Mianca</span>
          <Link
            href="/dashboard"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Entrar al dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
          Para dealers y flotillas de equipo usado
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
          Deja de adivinar el precio de tu equipo.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--muted)] sm:text-xl">
          Sube fotos de tu maquinaria y en minutos obtén un precio justo
          respaldado por comparables reales, más un anuncio ya optimizado
          para Mercado Libre y Facebook Marketplace.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Ver el dashboard →
          </Link>
          <a
            href="#como-funciona"
            className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold transition hover:border-[var(--accent)]"
          >
            Cómo funciona
          </a>
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-t border-[var(--border)] bg-[var(--card)]"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold sm:text-3xl">Cómo funciona</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {pasos.map((paso) => (
              <div key={paso.numero}>
                <span className="text-sm font-bold text-[var(--accent)]">
                  {paso.numero}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{paso.titulo}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {paso.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 sm:p-14">
          <h2 className="text-2xl font-bold sm:text-3xl">
            No competimos por compradores.
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">
            Mianca no es un marketplace nuevo — nos apalancamos en la
            liquidez que ya existe en Mercado Libre y Facebook Marketplace.
            Resolvemos el problema puntual de precio justo y anuncio bien
            armado, para que tu equipo se venda más rápido y sin dejar dinero
            en la mesa.
          </p>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] px-6 py-8 text-sm text-[var(--muted)]">
        <div className="mx-auto max-w-6xl">Mianca — en construcción.</div>
      </footer>
    </main>
  );
}
