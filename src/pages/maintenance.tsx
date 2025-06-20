import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { FiTool, FiClock, FiArrowLeft } from 'react-icons/fi';

const MaintenancePage = () => {
  const router = useRouter();
  const { from, title } = router.query;
  const [dots, setDots] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [isAnimating, setIsAnimating] = useState(false);

  // Efecto para los puntos animados
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Efecto para la cuenta regresiva
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Determinar el título y el mensaje basados en la ruta de origen
  const getPageInfo = () => {
    const pageTitle = title as string || 'Esta página';
    
    switch (from) {
      case '/profile':
        return {
          title: `Perfil`,
          message: `La página de perfil está en desarrollo. Muy pronto podrás gestionar tus datos personales.`
        };
      case '/settings':
        return {
          title: `Configuración`,
          message: `La página de configuración está en desarrollo. Muy pronto podrás personalizar la aplicación.`
        };
      default:
        return {
          title: pageTitle,
          message: `Esta sección está en desarrollo. Estamos trabajando para habilitar esta funcionalidad pronto.`
        };
    }
  };

  const { title: pageTitle, message } = getPageInfo();

  // Manejar la animación al entrar/salir
  const handleAnimationToggle = () => {
    setIsAnimating(true);
    setTimeout(() => {
      router.back();
    }, 300);
  };

  return (
    <MainLayout title={`${pageTitle} - En Mantenimiento`} description="Esta página está en mantenimiento">
      <div className={`flex flex-col items-center justify-center min-h-[60vh] transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        {/* Contenedor principal con efecto de pulso */}
        <div className="relative bg-dark-lighter p-8 rounded-lg border-2 border-primary/30 shadow-xl max-w-2xl w-full text-center">
          {/* Animación de engranajes */}
          <div className="absolute top-5 right-5 text-primary animate-spin">
            <FiTool className="w-8 h-8" />
          </div>
          <div className="absolute bottom-5 left-5 text-primary animate-spin-slow">
            <FiTool className="w-6 h-6" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {pageTitle} <span className="text-primary">en construcción</span>
          </h1>
          
          <div className="w-24 h-2 bg-primary mx-auto rounded-full mb-6"></div>
          
          <div className="animate-pulse mb-8">
            <FiClock className="w-20 h-20 text-primary mx-auto" />
          </div>
          
          <p className="text-xl text-gray-300 mb-6">{message}</p>
          
          <p className="text-gray-400 mb-8">
            Estamos trabajando en ello{dots}
          </p>
          
          {/* Botón de regreso con animación */}
          <button 
            onClick={handleAnimationToggle}
            className="btn-primary flex items-center justify-center mx-auto gap-2 py-3 px-6 transition-transform duration-200 hover:scale-105"
          >
            <FiArrowLeft className="w-5 h-5" />
            Regresar
          </button>
          
          {/* Cuenta regresiva */}
          <p className="text-sm text-gray-500 mt-6">
            Regresando automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default MaintenancePage;
