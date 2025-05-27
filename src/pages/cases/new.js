import MainLayout from '@/components/layout/MainLayout';
import CaseForm from '@/components/cases/CaseForm';

import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'

const NewCase = () => {
  return (
    <MainLayout title="Nuevo Caso" description="Crear un nuevo caso en AbogaBot">
      <div className="max-w-4xl mx-auto bg-dark-lighter rounded-lg p-6">
        <CaseForm />
      </div>
    </MainLayout>
  );
}

export default withAuthenticationRequired(NewCase)
