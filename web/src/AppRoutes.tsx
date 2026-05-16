import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Apps from './pages/Apps';
import Builder from './pages/Builder';
import Share from './pages/Share';
import Knowledge from './pages/Knowledge';
import KnowledgeDetail from './pages/KnowledgeDetail';
import ModelManagement from './pages/ModelManagement';
import RoleManagement from './pages/RoleManagement';
import QuotaManagement from './pages/QuotaManagement';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
        </Route>
      </Route>
      <Route path="/share/:shareId" element={<Share />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
