import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Chat = lazy(() => import('./pages/Chat'));
const Apps = lazy(() => import('./pages/Apps'));
const Builder = lazy(() => import('./pages/Builder'));
const Share = lazy(() => import('./pages/Share'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Knowledge = lazy(() => import('./pages/Knowledge'));
const KnowledgeDetail = lazy(() => import('./pages/KnowledgeDetail'));
const ModelManagement = lazy(() => import('./pages/ModelManagement'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const QuotaManagement = lazy(() => import('./pages/QuotaManagement'));
const Statistics = lazy(() => import('./pages/Statistics'));

const PageLoading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/apps/:appId/builder" element={<Builder />} />
          <Route path="/models" element={<ModelManagement />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
          <Route path="/roles" element={<RoleManagement />} />
          <Route path="/quota" element={<QuotaManagement />} />
          <Route path="/statistics" element={<Statistics />} />
        </Route>
      </Route>
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/share/:shareId" element={<Share />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
