/* ===================================================
   Client App - Router for Client Pages
   ================================================= */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from '@/shared/contexts/AuthContext';
import { SuperAdminProvider } from '@/shared/contexts/SuperAdminContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TenantSelector } from './components/TenantSelector';
import EnhancedDashboardPage from './pages/EnhancedDashboardPage';
import ChatPage from './pages/ChatPage';
import LibraryPage from './pages/LibraryPage';
import TemplatesPage from './pages/TemplatesPage';
import Login from './pages/Login';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.35,
};

const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

const ClientApp = () => {
  const location = useLocation();

  return (
    <AuthProvider>
      <SuperAdminProvider>
        <TenantSelector />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
          <Route path="/login" element={
            <AnimatedPage>
              <Login />
            </AnimatedPage>
          } />

          <Route path="/" element={
            <ProtectedRoute>
              <AnimatedPage>
                <EnhancedDashboardPage />
              </AnimatedPage>
            </ProtectedRoute>
          } />

          <Route path="/chat" element={
            <ProtectedRoute>
              <AnimatedPage>
                <ChatPage />
              </AnimatedPage>
            </ProtectedRoute>
          } />

          <Route path="/library" element={
            <ProtectedRoute>
              <AnimatedPage>
                <LibraryPage />
              </AnimatedPage>
            </ProtectedRoute>
          } />

          <Route path="/templates" element={
            <ProtectedRoute>
              <AnimatedPage>
                <TemplatesPage />
              </AnimatedPage>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      </SuperAdminProvider>
    </AuthProvider>
  );
};

export default ClientApp;
