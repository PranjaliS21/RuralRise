import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import Layout from './components/Layout';
import { useAuth } from './auth/AuthContext';

import Home from './pages/Home';
import About from './pages/About';
import Opportunities from './pages/Opportunities';
import OpportunityDetail from './pages/OpportunityDetail';
import Skills from './pages/Skills';
import Business from './pages/Business';
import BusinessPlan from './pages/BusinessPlan';
import Schemes from './pages/Schemes';
import Login from './pages/Login';
import Register from './pages/Register';
import YouthDashboard from './pages/YouthDashboard';
import ProfileEdit from './pages/ProfileEdit';
import EmployerDashboard from './pages/EmployerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function Protected({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/opportunities/:slug" element={<OpportunityDetail />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/business" element={<Business />} />
        <Route path="/business/plans/:id" element={<BusinessPlan />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Protected><YouthDashboard /></Protected>} />
        <Route path="/profile" element={<Protected><ProfileEdit /></Protected>} />
        <Route path="/employer" element={<Protected roles={['EMPLOYER']}><EmployerDashboard /></Protected>} />
        <Route path="/admin" element={<Protected roles={['ADMIN']}><AdminDashboard /></Protected>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
