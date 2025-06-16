import { FiPlus, FiFolder } from 'react-icons/fi';
import MainLayout from '@/components/layout/MainLayout';
import CaseCard from '@/components/cases/CaseCard';
import { useLawsuits } from '@/hooks/useLawsuits';
import Link from 'next/link';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'

const Home = () => {
  const { lawsuits, isLoadingLawsuits } = useLawsuits();
  const { user } = useAuth0();

  // Filtrar casos activos (no finalizados)
  const activeCases = (lawsuits || []).filter(c => c.status !== 'FINALIZED');

  // Obtener los 3 casos más recientes
  const recentCases = [...(activeCases || [])]
    .sort((a, b) => {
      // Ordenar por fecha de creación (más recientes primero)
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  return (
    <MainLayout title="Dashboard" description="Gestione sus casos legales con AbogaBot">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-400">
          Bienvenido {user?.name || ''} a AbogaBot, tu asistente legal con inteligencia artificial
        </p>
      </div>

      {/* Botón de nuevo caso */}
      <div className="flex justify-end mb-6">
        <Link href="/cases/new">
          <button className="btn-primary flex items-center justify-center gap-2 min-w-[140px] px-6">
            <FiPlus className="w-5 h-5" />
            Nuevo Caso
          </button>
        </Link>
      </div>

      {/* Sección de casos recientes */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <FiFolder className="text-primary mr-2 w-5 h-5" />
          <h2 className="text-xl font-semibold text-white">Casos recientes</h2>
          <Link href="/cases" className="ml-auto text-primary text-sm hover:underline">
            Ver todos
          </Link>
        </div>
        
        {isLoadingLawsuits ? (
          <div className="text-center py-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-400">Cargando casos...</p>
          </div>
        ) : recentCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentCases.map(caseItem => (
              <CaseCard key={caseItem.id} caseData={caseItem} />
            ))}
          </div>
        ) : (
          <div className="bg-dark p-6 rounded-lg text-center">
            <p className="text-gray-400 mb-4">
              No tienes casos recientes
            </p>
            <Link href="/cases/new">
              <button className="btn-primary">Crear primer caso</button>
            </Link>
          </div>
        )}
      </section>
    </MainLayout>
  );
}

export default withAuthenticationRequired(Home)