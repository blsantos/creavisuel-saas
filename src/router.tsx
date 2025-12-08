/* ===================================================
   CréaVisuel SaaS - Main Router
   Dynamic routing based on subdomain detection
   ================================================= */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider, useTenant, useIsAdminMode } from './shared/contexts/TenantContext';

// Lazy load apps for code splitting
const AdminApp = lazy(() => import('./apps/admin/AdminApp'));
const ClientApp = lazy(() => import('./apps/client/ClientApp'));

// Loading component with glassmorphism
const LoadingScreen = () => (
  <div className="min-h-screen bg-radial-darker flex items-center justify-center">
    <div className="glass-card p-8 text-center">
      <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-white text-lg">Chargement...</p>
    </div>
  </div>
);

// Error screen component
const ErrorScreen = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-radial-darker flex items-center justify-center p-4">
    <div className="glass-card p-8 max-w-md text-center">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-white mb-4">Erreur</h1>
      <p className="text-gray-300 mb-6">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="glass-button px-6 py-3"
      >
        Recharger la page
      </button>
    </div>
  </div>
);

// Router logic component (inside TenantProvider)
const AppRouter = () => {
  const { tenant, isLoading, error } = useTenant();
  const isAdminMode = useIsAdminMode();

  // Show loading screen while fetching tenant
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error screen if tenant fetch failed
  if (error) {
    return <ErrorScreen message={error.message} />;
  }

  // Admin/Marketing mode (no subdomain)
  if (isAdminMode) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AdminApp />
      </Suspense>
    );
  }

  // Client mode (subdomain detected and tenant loaded)
  if (tenant) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ClientApp />
      </Suspense>
    );
  }

  // Fallback (should not reach here)
  return <ErrorScreen message="Configuration invalide" />;
};

// Main router export
export const Router = () => {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AppRouter />
      </TenantProvider>
    </BrowserRouter>
  );
};

export default Router;
