import Link from "next/link";
import { LogoutButton } from "@/app/components/LogoutButton";
import { headers } from "next/headers";

// Componente para los links de navegación con efecto animado
const NavLink = ({ href, children, active }: { href: string, children: React.ReactNode, active?: boolean }) => (
  <Link 
    href={href} 
    className={`relative px-2 py-1 text-sm font-medium transition-colors
                ${active ? 'text-white-pure' : 'text-white-soft/70 hover:text-white-pure'}`}
  >
    {children}
    {active && (
      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white-pure rounded-full" />
    )}
    {!active && (
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-white-pure rounded-full group-hover:w-full transition-all duration-300" />
    )}
  </Link>
);


// Placeholder para el Avatar del Usuario
const UserAvatar = () => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-300 to-crimson-400 flex items-center justify-center text-white-pure font-bold text-lg">
    P
  </div>
);


export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get('x-next-pathname') || '';

  return (
    <div className="min-h-screen bg-white-blue font-sans">
      {/* Header Glassmorphic Fijo */}
      <header 
        className="sticky top-0 z-50 h-20
                   bg-blue-900/50 backdrop-blur-xl border-b border-white-pure/10 shadow-lg"
      >
        <div className="container mx-auto px-4 h-full">
          <div className="flex justify-between items-center h-full">
            
            {/* Logo y Título */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg" />
              <h1 className="font-display text-xl font-bold text-white-pure hidden sm:block">
                Dashboard del Patrón
              </h1>
            </div>

            {/* Navegación Principal */}
            <nav className="hidden md:flex items-center gap-4 group">
              <NavLink href="/owner" active={pathname === '/owner' || pathname.startsWith('/owner/')}>
                Dashboard
              </NavLink>
              <NavLink href="/accounting" active={pathname.startsWith('/accounting')}>
                Contabilidad
              </NavLink>
              <NavLink href="/collector" active={pathname.startsWith('/collector')}>
                Cobranza
              </NavLink>
            </nav>

            {/* Menú de Usuario */}
            <div className="flex items-center gap-4">
              <UserAvatar />
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-white-pure">Patrón</span>
                <span className="text-xs text-white-soft/70">Inversionista</span>
              </div>
              <LogoutButton />
            </div>

          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}