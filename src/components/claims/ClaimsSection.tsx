import { useState, useRef, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';

interface ClaimsSectionProps {
  claims: string[];
  onClaimsChange: (claims: string[]) => void;
}

const predefinedClaims = [
  'DEMANDA CIVIL',
  'DEMANDA EJECUTIVA Y MANDAMIENTO DE EJECUCIÓN Y EMBARGO',
  'SEÑALA BIENES PARA EMBARGO Y DEPOSITARIO PROVISIONAL',
  'ACOMPAÑA DOCUMENTOS, CON CITACIÓN',
  'FORMACIÓN DE CUADERNO SEPARADO',
  'PATROCINIO Y PODER',
  'FORMA DE NOTIFICACIÓN ELECTRÓNICA'
];

const ClaimsSection = ({ claims, onClaimsChange }: ClaimsSectionProps) => {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleAddClaim = (claim: string) => {
    if (!claim || typeof claim !== 'string') {
      return;
    }

    const normalizedClaim = claim.trim().toUpperCase();
    if (normalizedClaim) {
      const exists = claims.some(c => c.toUpperCase() === normalizedClaim);
      if (exists) {
        toast.warning('Esta petición ya ha sido agregada');
        setCustomInput('');
        return;
      }
      onClaimsChange([...claims, normalizedClaim]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (customInput && customInput.trim()) {
        handleAddClaim(customInput);
      }
    }
  };

  const handleDeleteClaim = (claimToDelete: string) => {
    onClaimsChange(claims.filter(claim => claim !== claimToDelete));
  };

  return (
    <div className="bg-gray-800/20 border border-gray-600 rounded-lg p-6">
      <label className="block mb-4 text-white font-medium">Peticiones al tribunal</label>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <PredefinedClaimsAutocomplete onSelect={handleAddClaim} />
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            title="Añadir petición personalizada"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600 text-white cursor-pointer focus:outline-none transition-colors shadow-md"
          >
            {showCustomInput ? (
              <FiX className="w-5 h-5" />
            ) : (
              <PlusCircle className="w-5 h-5" />
            )}
          </button>
        </div>

        {showCustomInput && (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escriba una petición personalizada"
              className="flex-1 bg-[#2D3342] text-white p-3 rounded-md border border-gray-500 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors"
            />
            <button
              type="button"
              onClick={() => {
                if (customInput && customInput.trim()) {
                  handleAddClaim(customInput);
                }
              }}
              className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              Agregar
            </button>
          </div>
        )}

        <div className="bg-gray-900/50 border border-gray-600 p-4 rounded-md min-h-[100px]">
          {claims.length > 0 ? (
            <ul className="space-y-2">
              {claims.map((claim, index) => (
                <li key={index} className="flex justify-between items-start p-3 bg-gray-700/50 border border-gray-600 rounded-md hover:bg-gray-700/70 transition-colors">
                  <span className="text-white break-words pr-2" style={{ wordBreak: 'break-word', flex: '1' }}>
                    {claim}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteClaim(claim)}
                    className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0 transition-colors"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No hay peticiones agregadas</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de búsqueda con autocompletado para peticiones predefinidas
const PredefinedClaimsAutocomplete = ({ onSelect }: { onSelect: (claim: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showingAllOptions, setShowingAllOptions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      if (showResults) {
        setResults(predefinedClaims.slice(0, 5));
        setShowingAllOptions(true);
      } else {
        setResults([]);
      }
      return;
    }

    setShowingAllOptions(false);
    const termLower = searchTerm.toLowerCase();
    const filtered = predefinedClaims
      .filter(claim => claim.toLowerCase().includes(termLower))
      .slice(0, 5);

    setResults(filtered);
  }, [searchTerm, showResults]);

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

  const handleSelectResult = (claim: string) => {
    onSelect(claim);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleFocus = () => {
    setShowResults(true);
    if (searchTerm.trim() === '') {
      setResults(predefinedClaims.slice(0, 5));
      setShowingAllOptions(true);
    }
  };

  return (
    <div ref={searchRef} className="relative flex-1">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        onFocus={handleFocus}
        placeholder="Buscar petición predefinida..."
        className="bg-[#2D3342] text-white w-full p-3 rounded-md border border-gray-500 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-colors"
      />

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-[#2D3342] border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {showingAllOptions && (
            <div className="px-2.5 py-1.5 text-xs text-gray-400 border-b border-gray-600">
              Peticiones predefinidas
            </div>
          )}
          {results.map((claim) => (
            <div
              key={claim}
              onClick={() => handleSelectResult(claim)}
              className="p-2.5 hover:bg-gray-700 cursor-pointer text-white text-sm"
            >
              {claim}
            </div>
          ))}
        </div>
      )}

      {showResults && searchTerm && results.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-[#2D3342] border border-gray-600 rounded-md shadow-lg p-2.5 text-center text-sm text-[#ffffff]">
          ⚠️ No se encontraron peticiones, dale al botón "➕" para agregar una nueva ⚠️ ➡️
        </div>
      )}
    </div>
  );
};

export default ClaimsSection;