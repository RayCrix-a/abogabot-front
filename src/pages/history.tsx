import { useState } from 'react';
import { FiSearch, FiClock, FiArchive, FiArrowUp, FiArrowDown } from 'react-icons/fi';
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
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'

  // Filtrar para mostrar solo los casos finalizados
  const historyCases = (lawsuits || []).filter(c => c.status === 'FINALIZED');

  // Aplicamos filtros de búsqueda y tipo
  let filteredCases = historyCases.filter(caseItem => {
    // Buscar por título de la demanda
    const matchesSearch = caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
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

  // Ordenar casos según el criterio seleccionado
  filteredCases = [...filteredCases].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    
    if (sortOrder === 'newest') {
      return dateB - dateA; // Más recientes primero
    } else {
      return dateA - dateB; // Más antiguos primero
    }
  });

  // Función para alternar el orden
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  return (
    <MainLayout title="Historial" description="Historial de casos legales en AbogaBot">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Historial de Casos</h1>
        <p className="text-gray-400">
          Acceda a todos sus casos finalizados y archivados
        </p>
      </div>

      {/* Buscador y filtros */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="relative w-full lg:w-1/2">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar por título en historial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          {/* Selector de filtro */}
          <select
            className="input-field w-full sm:w-auto min-w-[140px]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos los casos</option>
            <option value="recent">Últimos 30 días</option>
          </select>
          
          {/* Botón de ordenamiento */}
          <button
            onClick={toggleSortOrder}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors font-medium min-w-[140px] border border-gray-600"
            title={sortOrder === 'newest' ? 'Ordenar por más antiguos primero' : 'Ordenar por más recientes primero'}
          >
            {sortOrder === 'newest' ? (
              <>
                <FiArrowDown className="w-4 h-4" />
                Más recientes
              </>
            ) : (
              <>
                <FiArrowUp className="w-4 h-4" />
                Más antiguos
              </>
            )}
          </button>
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