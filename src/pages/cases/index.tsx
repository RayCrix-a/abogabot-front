import { useState } from 'react';
import { FiSearch, FiPlus, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import CaseCard from '@/components/cases/CaseCard';
import { useLawsuits } from '@/hooks/useLawsuits';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'

const CasesIndex = () => {
  const { lawsuits, isLoadingLawsuits } = useLawsuits();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'pending'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'

  // Filtrar primero para excluir los casos finalizados
  const activeCases = (lawsuits || []).filter(c => c.status !== 'FINALIZED');

  // Aplicar filtros de búsqueda y estado
  let filteredCases = activeCases.filter(caseItem => {
    // Buscar por título de la demanda
    const matchesSearch = caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && caseItem.status === 'IN_PROGRESS';
    if (filter === 'pending') return matchesSearch && caseItem.status === 'PENDING';
    
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
    <MainLayout title="Mis Casos" description="Gestione sus casos legales con AbogaBot">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Mis Casos</h1>
        <p className="text-gray-400">
          Administre todos sus casos legales desde un solo lugar
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
            placeholder="Buscar por título del caso..."
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
            <option value="active">En curso</option>
            <option value="pending">Pendientes</option>
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
          
          {/* Botón Nuevo Caso */}
          <Link href="/cases/new">
            <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto min-w-[140px] px-6">
              <FiPlus className="w-5 h-5" />
              Nuevo Caso
            </button>
          </Link>
        </div>
      </div>

      {/* Lista de casos */}
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
              : 'No tienes casos activos en este momento'}
          </p>
          <Link href="/cases/new">
            <button className="btn-primary">Crear nuevo caso</button>
          </Link>
        </div>
      )}
    </MainLayout>
  );
}

export default withAuthenticationRequired(CasesIndex)