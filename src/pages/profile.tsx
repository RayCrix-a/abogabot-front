import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';

const ProfilePage = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir a la página de mantenimiento con parámetros relevantes
    router.replace({
      pathname: '/maintenance',
      query: { from: '/profile', title: 'Perfil' },
    });
  }, [router]);

  // Renderizar un placeholder mientras se realiza la redirección
  return <div className="min-h-screen bg-dark"></div>;
};

export default withAuthenticationRequired(ProfilePage);
