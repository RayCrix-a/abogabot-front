import { useState } from 'react';
import { FiSearch, FiPlus } from 'react-icons/fi';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import CaseCard from '@/components/cases/CaseCard';
import { useLawsuits } from '@/hooks/useLawsuits';

export default function CasesIndex() {
  const { lawsuits, isLoadingLawsuits } = useLawsuits();
  const [searchTerm, setSearchTerm] = useState('');  const [filter, setFilter] = useState('all'); // 'all', 'active', 'pending'

  // Filtrar primero para excluir los casos finalizados
  const activeCases = (lawsuits || []).filter(c => c.status !== 'FINALIZED');

  // Aplicar filtros de búsqueda y estado
  const filteredCases = activeCases.filter(caseItem => {
    const matchesSearch = caseItem.subjectMatter?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && caseItem.status === 'IN_PROGRESS';
    if (filter === 'pending') return matchesSearch && caseItem.status === 'PENDING';
    
    return matchesSearch;
  });

  return (
    <MainLayout title="Mis Casos" description="Gestione sus casos legales con AbogaBot">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Mis Casos</h1>
        <p className="text-gray-400">
          Administre todos sus casos legales desde un solo lugar
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
            placeholder="Buscar casos..."
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
            <option value="active">En curso</option>
            <option value="pending">Pendientes</option>
          </select>
          
          <Link href="/cases/new">
            <button className="btn-primary flex items-center gap-2">
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