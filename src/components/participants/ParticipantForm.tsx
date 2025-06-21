import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Person } from '@/types/ParticipantTypes';
import { 
  validateRUT, 
  formatRUT, 
  validateFullName, 
  validateAddress, 
  ParticipantValidationErrors, 
  initialParticipantValidationErrors 
} from '@/utils/validationUtils';

interface ParticipantFormProps {
  participant: Person | null;
  onSave: (participant: Person) => Promise<void>;
  isEditing: boolean;
}

const ParticipantForm = ({ participant, onSave, isEditing }: ParticipantFormProps) => {
  const [formData, setFormData] = useState<Person>({
    id: null,
    idNumber: '',
    fullName: '',
    address: ''
  });
  const [errors, setErrors] = useState<ParticipantValidationErrors>(initialParticipantValidationErrors);
  const [isSaving, setIsSaving] = useState(false);

  // Actualizar formulario cuando cambie el participante
  useEffect(() => {
    if (participant) {
      setFormData({
        id: participant.id,
        idNumber: participant.idNumber,
        fullName: participant.fullName,
        address: participant.address
      });
    } else {
      setFormData({
        id: null,
        idNumber: '',
        fullName: '',
        address: ''
      });
    }
    setErrors(initialParticipantValidationErrors);
  }, [participant]);

  const handleRUTChange = (value: string) => {
    const validChars = value.replace(/[^0-9kK]/g, '');
    
    if (validChars.length > 9) return;
    
    const formattedRUT = formatRUT(validChars);
    const error = validateRUT(formattedRUT);
    
    setFormData(prev => ({ ...prev, idNumber: formattedRUT }));
    setErrors(prev => ({ ...prev, idNumber: error }));
  };

  const handleNameChange = (value: string) => {
    const onlyLetters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    
    if (onlyLetters.length > 100) return;
    
    const error = validateFullName(onlyLetters);
    
    setFormData(prev => ({ ...prev, fullName: onlyLetters }));
    setErrors(prev => ({ ...prev, fullName: error }));
  };

  const handleAddressChange = (value: string) => {
    if (value.length > 255) return;
    
    const error = validateAddress(value);
    
    setFormData(prev => ({ ...prev, address: value }));
    setErrors(prev => ({ ...prev, address: error }));
  };

  const isFormValid = () => {
    const rutValid = !errors.idNumber && formData.idNumber.trim();
    const nameValid = !errors.fullName && formData.fullName.trim();
    const addressValid = !errors.address && formData.address.trim();
    
    return rutValid && nameValid && addressValid;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error al guardar participante:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <input
          type="text"
          placeholder="RUT (ej: 12345678-9)"
          value={formData.idNumber}
          onChange={(e) => handleRUTChange(e.target.value)}
          onKeyPress={(e) => {
            if (!/[0-9kK]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
              e.preventDefault();
            }
          }}
          className={`bg-[#2D3342] text-white w-full p-3 rounded-md focus:outline-none focus:ring-2 ${
            errors.idNumber ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
          }`}
        />
        {errors.idNumber && (
          <p className="text-red-400 text-sm mt-1">{errors.idNumber}</p>
        )}
      </div>
      
      <div>
        <input
          type="text"
          placeholder="Nombre completo"
          value={formData.fullName}
          onChange={(e) => handleNameChange(e.target.value)}
          onKeyPress={(e) => {
            if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
              e.preventDefault();
            }
          }}
          className={`bg-[#2D3342] text-white w-full p-3 rounded-md focus:outline-none focus:ring-2 ${
            errors.fullName ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
          }`}
        />
        {errors.fullName && (
          <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
        )}
        <p className="text-gray-400 text-xs mt-1">{formData.fullName.length}/100 caracteres</p>
      </div>
      
      <div>
        <input
          type="text"
          placeholder="Dirección"
          value={formData.address}
          onChange={(e) => handleAddressChange(e.target.value)}
          className={`bg-[#2D3342] text-white w-full p-3 rounded-md focus:outline-none focus:ring-2 ${
            errors.address ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
          }`}
        />
        {errors.address && (
          <p className="text-red-400 text-sm mt-1">{errors.address}</p>
        )}
        <p className="text-gray-400 text-xs mt-1">{formData.address.length}/255 caracteres</p>
      </div>
      
      <button 
        onClick={handleSubmit}
        className={`w-full p-3 rounded-md flex items-center justify-center gap-2 ${
          isFormValid() && !isSaving
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
        disabled={!isFormValid() || isSaving}
      >
        <Save size={18} />
        {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Agregar persona'}
      </button>
    </div>
  );
};

export default ParticipantForm;