import MainLayout from '@/components/layout/MainLayout';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import useSidebarState from '@/hooks/useSidebarState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SettingsPage = () => {
  useSidebarState();

  return (
    <MainLayout title="Configuración" description="Configuración de la aplicación">
      <h1 className="text-2xl font-bold text-white mb-1">Configuración</h1>
      <p className="text-gray-400">
        Ajuste la configuración deseada del sistema
      </p>
      <div className='mt-6'>
        <Tabs defaultValue="usuarios" className="w-[400px]">
          <TabsList>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
          </TabsList>
          <TabsContent value="usuarios">Gestiona usuarios aquí</TabsContent>
          <TabsContent value="roles">Gestiona roles aquí</TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default withAuthenticationRequired(SettingsPage);