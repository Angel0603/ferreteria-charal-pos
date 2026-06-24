import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="text-center max-w-md">

        <p className="text-8xl font-semibold text-accent opacity-20 leading-none mb-6">
          404
        </p>

        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          Página no encontrada
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          La ruta que buscas no existe o fue movida.
          Verifica la URL o regresa al inicio.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm
                       font-medium hover:bg-accent-hover transition-colors"
          >
            Ir al dashboard
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 border border-border text-text-secondary
                       rounded-xl text-sm font-medium hover:bg-hover transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>

      </div>
    </div>
  )
}