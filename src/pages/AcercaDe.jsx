/**
 * AcercaDe — Página informativa del proyecto académico.
 */
export default function AcercaDe() {
  return (
    <main id="contenido" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <article aria-labelledby="titulo-acerca">
        <header className="marca animar-entrada relative isolate overflow-hidden rounded-[2rem] px-6 py-10 text-white shadow-xl sm:px-10 sm:py-12">
          <span aria-hidden="true" className="halo -right-12 -top-16 h-56 w-56 bg-sol-500" />
          <div className="relative flex flex-wrap items-center gap-6">
            <img
              src="/logo.svg"
              alt=""
              width="88"
              height="88"
              className="size-20 rounded-2xl shadow-lg sm:size-24"
            />
            <div>
              <h1 id="titulo-acerca" className="text-3xl font-black sm:text-4xl">
                Acerca de FeriaCruz
              </h1>
              <p className="mt-2 max-w-2xl text-verde-50">
                Ferias de agricultura familiar de Santa Cruz, Bolivia.
              </p>
            </div>
          </div>
        </header>

        <p className="mt-6 leading-relaxed text-tierra-700">
          Este proyecto frontend forma parte de la asignatura <strong>Programación Web 2</strong>.
          Su objetivo es demostrar una implementación profesional de React, Vite y Tailwind
          CSS aplicando accesibilidad WCAG AA y buenas prácticas de rendimiento web.
        </p>

        <section aria-labelledby="titulo-tecnologias" className="mt-8">
          <h2 id="titulo-tecnologias" className="text-xl font-bold text-tierra-900">
            Tecnologías utilizadas
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-tierra-700">
            <li>React 19 con componentes funcionales y hooks.</li>
            <li>Vite como empaquetador (build ultra rápido).</li>
            <li>Tailwind CSS v4, enfoque Mobile-First.</li>
            <li>react-router-dom para el enrutamiento.</li>
          </ul>
        </section>

        <section aria-labelledby="titulo-mision" className="mt-8">
          <h2 id="titulo-mision" className="text-xl font-bold text-tierra-900">
            Nuestra motivación
          </h2>
          <p className="mt-3 leading-relaxed text-tierra-700">
            Valorar el trabajo de las familias campesinas, fomentar el consumo de
            productos locales y crear puentes digitales entre campo y ciudad.
          </p>
        </section>
      </article>
    </main>
  )
}