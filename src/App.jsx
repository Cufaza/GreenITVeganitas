import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Loader from './components/ui/Loader.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import Plan from './pages/Plan.jsx';
import Calculations from './pages/Calculations.jsx';

// The public landing is isolated in src/landing and loaded on demand so its dependencies stay out of the app bundle.
const Landing = lazy(() => import('./landing/Landing.jsx'));

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader size="lg" text="Cargando…" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={<Suspense fallback={<div className="min-h-screen bg-background" />}><Landing /></Suspense>}
      />
      <Route path="/login" element={!loading && user ? <Navigate to="/panel" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="panel" element={<Dashboard />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="plan" element={<Plan />} />
        <Route path="calculos" element={<Calculations />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
