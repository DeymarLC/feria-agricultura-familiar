/**
 * AcercaDe — Página informativa del proyecto académico.
 */
export default function AcercaDe() {
  return (
    <main id="contenido" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <article aria-labelledby="titulo-acerca">
        <h1 id="titulo-acerca" className="text-3xl font-extrabold text-tierra-900">
          Acerca de la Feria de Agricultura Familiar
        </h1>
        <p className="mt-4 leading-relaxed text-tierra-700">
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