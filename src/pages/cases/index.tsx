import { useState } from 'react';
import { FiSearch, FiPlus, FiArrowUp, FiArrowDown, FiTrash2, FiCheck } from 'react-icons/fi';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import CaseCard from '@/components/cases/CaseCard';
import { useLawsuits } from '@/hooks/useLawsuits';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

const CasesIndex = () => {
  const { lawsuits, isLoadingLawsuits, deleteLawsuit, isDeletingLawsuit } = useLawsuits();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'pending'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest'
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCases, setSelectedCases] = useState<number[]>([]);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const queryClient = useQueryClient();

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

  // Función para alternar el modo de selección
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setSelectedCases([]);
    }
    setIsSelectionMode(!isSelectionMode);
  };

  // Función para alternar la selección de un caso
  const toggleCaseSelection = (id: number) => {
    if (selectedCases.includes(id)) {
      setSelectedCases(selectedCases.filter(caseId => caseId !== id));
    } else {
      setSelectedCases([...selectedCases, id]);
    }
  };

  // Función para seleccionar todos los casos
  const selectAllCases = () => {
    const allIds = filteredCases.map(c => c.id);
    setSelectedCases(allIds);
  };

  // Función para deseleccionar todos los casos
  const deselectAllCases = () => {
    setSelectedCases([]);
  };
  
  // Función para eliminar múltiples casos
  const deleteSelectedCases = async () => {
    if (selectedCases.length === 0) return;
    
    // Confirmar la eliminación
    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${selectedCases.length} caso(s)? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    setIsDeletingMultiple(true);
    
    try {
      // Eliminar cada caso seleccionado
      const promises = selectedCases.map(id => deleteLawsuit(id));
      await Promise.all(promises);
      
      // Invalidar consultas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['lawsuits'] });
      
      toast.success(`${selectedCases.length} caso(s) eliminado(s) correctamente`);
      
      // Limpiar selección y salir del modo de selección
      setSelectedCases([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error al eliminar casos:', error);
      toast.error(`Error al eliminar casos: ${error && error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  return (
    <MainLayout title="Mis Casos" description="Gestione sus casos legales con AbogaBot">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Mis Casos</h1>
        <p className="text-gray-400">
          Administre todos sus casos legales desde un solo lugar
        </p>
      </div>      {/* Buscador y filtros */}
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
            disabled={isSelectionMode}
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
            disabled={isSelectionMode}
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
          
          {isSelectionMode ? (
            <>
              {/* Botones de selección múltiple */}
              <button
                onClick={selectedCases.length === 0 ? selectAllCases : deselectAllCases}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#55b0b0] hover:bg-gray-600 text-white rounded-md transition-colors font-medium"
                disabled={isDeletingMultiple}
              >
                <FiCheck className="w-4 h-4" />
                {selectedCases.length === 0 ? 'Seleccionar todos' : 'Deseleccionar todos'}
              </button>
              
              <button
                onClick={deleteSelectedCases}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors font-medium"
                disabled={selectedCases.length === 0 || isDeletingMultiple}
              >
                {isDeletingMultiple ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    Eliminar ({selectedCases.length})
                  </>
                )}
              </button>
              
              <button
                onClick={toggleSelectionMode}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#FFC300] hover:bg-gray-600 text-white rounded-md transition-colors font-medium"
                disabled={isDeletingMultiple}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              {/* Botón para entrar en modo de selección */}
              <button
                onClick={toggleSelectionMode}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors font-medium"
              >
                <FiTrash2 className="w-4 h-4" />
                Eliminar Casos
              </button>
              
              {/* Botón Nuevo Caso */}
              <Link href="/cases/new">
                <button className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto min-w-[140px] px-6">
                  <FiPlus className="w-5 h-5" />
                  Nuevo Caso
                </button>
              </Link>
            </>
          )}
        </div>
      </div>      {/* Lista de casos */}
      {isLoadingLawsuits ? (
        <div className="text-center py-6">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-400">Cargando casos...</p>
        </div>
      ) : filteredCases.length > 0 ? (
        <>
          {isSelectionMode && (
          <div className="mb-4 bg-dark-lighter p-4 rounded-lg">
              <p className="text-white flex items-center">
                <FiCheck className="w-5 h-5 mr-2 text-primary" />
                {selectedCases.length === 0 
                  ? 'Haz clic en cualquier tarjeta para seleccionar los casos que deseas eliminar' 
                  : `${selectedCases.length} caso(s) seleccionado(s)`}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCases.map(caseItem => (
              <CaseCard 
                key={caseItem.id} 
                caseData={caseItem}
                isSelectable={isSelectionMode}
                isSelected={selectedCases.includes(caseItem.id)}
                onToggleSelect={toggleCaseSelection}
              />
            ))}
          </div>
        </>
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