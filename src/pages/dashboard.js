import { useState } from 'react';
import { FiPlus, FiFolder, FiSearch } from 'react-icons/fi';
import MainLayout from '@/components/layout/MainLayout';
import CaseCard from '@/components/cases/CaseCard';
import { useLawsuits } from '@/hooks/useLawsuits';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
  const { lawsuits, isLoadingLawsuits } = useLawsuits();
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  // Filtrar casos activos (no finalizados)
  const activeCases = (lawsuits || []).filter(c => c.status !== 'FINALIZED');

  // Obtener los 3 casos más recientes
  const recentCases = [...(activeCases || [])]
    .sort((a, b) => {
      // Ordenar por fecha de creación (más recientes primero)
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    })
    .slice(0, 3);

  // Filtrar casos según término de búsqueda
  const filteredCases = recentCases.filter(caseItem => 
    caseItem.subjectMatter?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout title="Dashboard" description="Gestione sus casos legales con AbogaBot">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-400">
          Bienvenido {user?.name || ''} a AbogaBot, tu asistente legal con inteligencia artificial
        </p>
      </div>

      {/* Buscador y botón de nuevo caso */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar casos recientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <Link href="/cases/new">
          <button className="btn-primary flex items-center gap-2">
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
        ) : filteredCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCases.map(caseItem => (
              <CaseCard key={caseItem.id} caseData={caseItem} />
            ))}
          </div>
        ) : (
          <div className="bg-dark p-6 rounded-lg text-center">
            <p className="text-gray-400 mb-4">
              {searchTerm
                ? 'No se encontraron casos que coincidan con tu búsqueda'
                : 'No tienes casos recientes'}
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