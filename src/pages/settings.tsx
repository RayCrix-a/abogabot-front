import MainLayout from '@/components/layout/MainLayout';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import useSidebarState from '@/hooks/useSidebarState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserTable from '@/components/users/user-table';
import RoleTable from '@/components/roles/role-table';

const SettingsPage = () => {
  useSidebarState();

  return (
    <MainLayout title="Configuración" description="Configuración de la aplicación">
      <h1 className="text-2xl font-bold text-white mb-1">Configuración</h1>
      <p className="text-gray-400">
        Ajuste la configuración deseada del sistema
      </p>
      <div className='mt-6'>
        <Tabs defaultValue="usuarios" className="w-full">
          <TabsList>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
          </TabsList>
          <TabsContent value="usuarios">
            <UserTable />
          </TabsContent>
          <TabsContent value="roles">
            <RoleTable />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default withAuthenticationRequired(SettingsPage);