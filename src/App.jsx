import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import Plan from './pages/Plan.jsx';
import Calculations from './pages/Calculations.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Cargando…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!loading && user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="plan" element={<Plan />} />
        <Route path="calculos" element={<Calculations />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
