import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';
import ProviderButtons from './ProviderButtons';

// Esquema de validación para el formulario de login
const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  remember: z.boolean().optional()
});

const LoginForm = () => {
  const { login, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  // Configuración del formulario con React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false
    }
  });

  // Manejador del envío del formulario
  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password, data.remember);
      toast.success('Inicio de sesión exitoso');
    } catch (err) {
      toast.error(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="w-full max-w-md p-8 mx-auto rounded-lg bg-dark-lighter">
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 mb-4 rounded-full bg-gray-700 flex items-center justify-center">
          <img 
            src="/images/logo.png" 
            alt="AbogaBot Logo" 
            className="w-16 h-16 object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white">Bienvenido a AbogaBot</h1>
        <p className="text-gray-400 text-sm">Su asistente legal con AI</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Campo de Correo electrónico */}
        <div>
          <label className="block text-gray-300 mb-1">Correo electrónico</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiMail className="text-gray-500" />
            </div>
            <input
              type="email"
              placeholder="correo@correo.com"
              {...register('email')}
              className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Campo de Contraseña */}
        <div>
          <label className="block text-gray-300 mb-1">Contraseña</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiLock className="text-gray-500" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="********"
              {...register('password')}
              className={`input-field pl-10 ${errors.password ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showPassword ? (
                <FiEyeOff className="text-gray-500" />
              ) : (
                <FiEye className="text-gray-500" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Recordarme y ¿Olvidaste tu contraseña? */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              {...register('remember')}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600 focus:ring-primary"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-300">
              Recuérdame
            </label>
          </div>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Botón de Ingresar */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex justify-center"
        >
          {loading ? 'Cargando...' : 'Ingresar'}
        </button>

        {/* Mensaje de error */}
        {error && <p className="text-center text-red-500 text-sm">{error}</p>}

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-dark-lighter text-gray-400">O continua con</span>
          </div>
        </div>

        {/* Botones de proveedores */}
        <ProviderButtons />
      </form>
    </div>
  );
};

export default LoginForm;
