import { useState, useEffect, useRef } from 'react';
import { ParticipantSummaryResponse } from '@/generated/api/data-contracts';
import { ParticipantType, PersonSummary } from '@/types/ParticipantTypes';

interface AutocompleteSearchProps {
  participants: ParticipantSummaryResponse[];
  selectedParticipants: PersonSummary[];
  placeholder: string;
  onSelect: (participantId: string) => void;
}

const AutocompleteSearch = ({ 
  participants, 
  selectedParticipants, 
  placeholder, 
  onSelect 
}: AutocompleteSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ParticipantSummaryResponse[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showingRecommendations, setShowingRecommendations] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Obtener los últimos 5 registros creados que no estén seleccionados
  const getRecentlyCreated = () => {
    return participants
      .filter(participant => {
        return !selectedParticipants.some(p => p.idNumber === participant.idNumber);
      })
      .slice(-5)
      .reverse();
  };

  // Filtrar participantes basado en el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      if (showResults) {
        setResults(getRecentlyCreated());
        setShowingRecommendations(true);
      } else {
        setResults([]);
      }
      return;
    }

    setShowingRecommendations(false);
    const termLower = searchTerm.toLowerCase();
    const filtered = participants
      .filter(participant => {
        const alreadySelected = selectedParticipants.some(p => p.idNumber === participant.idNumber);
        return !alreadySelected && (
          participant.fullName.toLowerCase().includes(termLower) || 
          participant.idNumber.toLowerCase().includes(termLower)
        );
      })
      .slice(0, 5);
    
    setResults(filtered);
  }, [searchTerm, participants, selectedParticipants, showResults]);

  // Manejar click fuera del componente para cerrar resultados
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowResults(true);
  };

  const handleSelectResult = (participant: ParticipantSummaryResponse) => {
    onSelect(participant.idNumber);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleFocus = () => {
    setShowResults(true);
    if (searchTerm.trim() === '') {
      setResults(getRecentlyCreated());
      setShowingRecommendations(true);
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="bg-[#2D3342] text-white w-full p-3 rounded-md border border-gray-500 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors"
      />
      
      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-[#2D3342] border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {showingRecommendations && (
            <div className="px-2.5 py-1.5 text-xs text-gray-400 border-b border-gray-600">
              Últimos registros creados
            </div>
          )}
          {results.map((participant) => (
            <div
              key={participant.idNumber}
              onClick={() => handleSelectResult(participant)}
              className="p-2.5 hover:bg-gray-700 cursor-pointer text-white text-sm"
            >
              <div className="font-medium">{participant.fullName}</div>
              <div className="text-xs text-gray-300">{participant.idNumber}</div>
            </div>
          ))}
        </div>
      )}

      {showResults && searchTerm && results.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-[#2D3342] border border-gray-600 rounded-md shadow-lg p-2.5 text-center text-sm text-gray-400">
          No se encontraron resultados
        </div>
      )}
    </div>
  );
};

export default AutocompleteSearch;