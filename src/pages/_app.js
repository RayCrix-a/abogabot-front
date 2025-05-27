import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { Auth0Provider } from '@auth0/auth0-react';
import '@/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

export default function App({ Component, pageProps }) {
  // Crear cliente de React Query con configuración
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 60 * 1000, // 1 minuto
        retry: 1,
        onError: (err) => {
          console.error('Query error:', err);
        }
      },
      mutations: {
        onError: (err) => {
          console.error('Mutation error:', err);
        }
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <Auth0Provider
          domain={process.env.NEXT_PUBLIC_OAUTH2_DOMAIN}
          clientId={process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID}
          authorizationParams={{
            redirect_uri: typeof window !== "undefined"? window.location.origin : undefined,
            audience: process.env.NEXT_PUBLIC_OAUTH2_AUDIENCE
          }}
      >
        <Component {...pageProps} />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </Auth0Provider>
    </QueryClientProvider>
  );
}