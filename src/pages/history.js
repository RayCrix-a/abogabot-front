import { useState } from 'react';
import { FiSearch, FiClock, FiArchive } from 'react-icons/fi';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import CaseCard from '@/components/cases/CaseCard';
import { useLawsuits } from '@/hooks/useLawsuits';
import { parseISO } from 'date-fns';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'

const HistoryPage = () => {
  const { lawsuits, isLoadingLawsuits } = useLawsuits();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'recent'

  // Filtrar para mostrar solo los casos finalizados
  const historyCases = (lawsuits || []).filter(c => c.status === 'FINALIZED');

  // Aplicamos filtros de búsqueda y tipo
  const filteredCases = historyCases.filter(caseItem => {
    const matchesSearch = caseItem.subjectMatter?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'recent') {
      // Casos de los últimos 30 días
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const caseDate = parseISO(caseItem.createdAt);
        return matchesSearch && caseDate >= thirtyDaysAgo;
      } catch (error) {
        console.error('Error al filtrar por fecha:', error);
        return matchesSearch;
      }
    }
    
    return matchesSearch;
  });

  return (
    <MainLayout title="Historial" description="Historial de casos legales en AbogaBot">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Historial de Casos</h1>
        <p className="text-gray-400">
          Acceda a todos sus casos finalizados y archivados
        </p>
      </div>

      {/* Buscador y filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar en historial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        
        <div className="flex space-x-2 w-full md:w-auto">
          <select
            className="input-field flex-grow md:flex-grow-0"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos los casos</option>
            <option value="recent">Últimos 30 días</option>
          </select>
        </div>
      </div>

      {/* Lista de casos del historial */}
      {isLoadingLawsuits ? (
        <div className="text-center py-6">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-400">Cargando historial...</p>
        </div>
      ) : filteredCases?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map(caseItem => (
            <CaseCard key={caseItem.id} caseData={caseItem} />
          ))}
        </div>
      ) : (
        <div className="bg-dark p-6 rounded-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <FiArchive className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-400 mb-4">
            {searchTerm
              ? 'No se encontraron casos en el historial que coincidan con tu búsqueda'
              : 'No tienes casos finalizados en el historial'}
          </p>
          <Link href="/">
            <button className="btn-primary">Volver al Dashboard</button>
          </Link>
        </div>
      )}

      {/* Estadísticas del historial */}
      {filteredCases?.length > 0 && (
        <div className="mt-8 bg-dark-lighter rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiClock className="mr-2" />
            Estadísticas del historial
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Total de casos</p>
              <p className="text-2xl font-bold text-white">{historyCases?.length || 0}</p>
            </div>
            <div className="bg-dark p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Casos del último mes</p>
              <p className="text-2xl font-bold text-white">
                {historyCases?.filter(c => {
                  try {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return new Date(c.createdAt) >= thirtyDaysAgo;
                  } catch (error) {
                    return false;
                  }
                }).length || 0}
              </p>
            </div>
            <div className="bg-dark p-4 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm">Tiempo promedio de resolución</p>
              <p className="text-2xl font-bold text-white">
                15 días
              </p>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default withAuthenticationRequired(HistoryPage)