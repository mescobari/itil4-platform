import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ITIL4SalesPage } from './pages/ITIL4SalesPage';
import SalesPage    from './pages/SalesPage';
import ContentPage  from './pages/ContentPage';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GetCodePage  from './pages/GetCodePage';
import ActivatePage from './pages/ActivatePage';
import CoachingPage from './pages/CoachingPage';
import DashboardPage from './pages/DashboardPage';
import AttemptPage   from './pages/AttemptPage';
import ResultPage    from './pages/ResultPage';
import AdminLayout            from './pages/admin/AdminLayout';
import AdminCodesPage         from './pages/admin/AdminCodesPage';
import AdminChallengesPage    from './pages/admin/AdminChallengesPage';
import AdminCodeRequestsPage  from './pages/admin/AdminCodeRequestsPage';
import AdminUsersPage         from './pages/admin/AdminUsersPage';
import AdminStatsPage         from './pages/admin/AdminStatsPage';
import { AuthProvider } from './lib/authStore';
import { RequireAccess, RequireAdmin } from './lib/guards';

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public — sales / marketing */}
          <Route path="/"           element={<Navigate to="/itil4" replace />} />
          <Route path="/itil4"      element={<ITIL4SalesPage />} />
          <Route path="/libro-itil" element={<ITIL4SalesPage />} />
          <Route path="/ventas"     element={<SalesPage />} />
          <Route path="/content"    element={<ContentPage />} />

          {/* Public — auth flow */}
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/registro"  element={<RegisterPage />} />
          <Route path="/get-code"  element={<GetCodePage />} />
          <Route path="/activar"   element={<ActivatePage />} />
          <Route path="/coaching"  element={<CoachingPage />} />

          {/* Authenticated */}
          <Route
            path="/dashboard"
            element={
              <RequireAccess>
                <DashboardPage />
              </RequireAccess>
            }
          />
          <Route
            path="/intento/:id"
            element={
              <RequireAccess>
                <AttemptPage />
              </RequireAccess>
            }
          />
          <Route
            path="/resultado/:id"
            element={
              <RequireAccess>
                <ResultPage />
              </RequireAccess>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="stats" replace />} />
            <Route path="stats"        element={<AdminStatsPage />} />
            <Route path="codigos"      element={<AdminCodesPage />} />
            <Route path="challenges"   element={<AdminChallengesPage />} />
            <Route path="solicitudes"  element={<AdminCodeRequestsPage />} />
            <Route path="usuarios"     element={<AdminUsersPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/itil4" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
