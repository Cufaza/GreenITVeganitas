import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../context/DataContext.jsx';
import KpiCard from '../components/KpiCard.jsx';
import { escenarioCombinado, RECOMENDACIONES } from '../lib/calc.js';
import { CATEGORIAS } from '../data/constants.js';
import { fmt, fmtARS, fmtPct } from '../lib/format.js';

const COLORES = ['#2E7D32', '#0B1F3A', '#F39C12', '#66BB6A', '#5F6B7A', '#1E5FBF'];

export default function Dashboard() {
  const { items, settings, calculo, resetDemo } = useData();
  if (!items.length) {
    return (
      <div className="card empty">
        <h1>Todavía no cargaste equipos</h1>
        <p>Agregá tu inventario IT o cargá el ejemplo de demostración para ver cómo funciona.</p>
        <div className="actions center">
          <Link className="btn" to="/inventario">Cargar inventario</Link>
          <button className="btn btn-orange" onClick={resetDemo}>Cargar ejemplo de demo</button>
        </div>
      </div>
    );
  }
  const { totales, porCategoria } = calculo;
  const plan = escenarioCombinado(items, settings, RECOMENDACIONES.map((r) => r.id));

  const barData = Object.entries(porCategoria).map(([k, v]) => ({
    name: CATEGORIAS[k],
    'Equipos IT': Number(v.kWhMesIT.toFixed(1)),
    Refrigeración: Number(v.kWhRefrig.toFixed(1)),
  }));
  const pieData = Object.entries(porCategoria).map(([k, v]) => ({ name: CATEGORIAS[k], value: Number(v.co2Mes.toFixed(1)) }));
  const compData = [
    { name: 'Hoy', co2: Number(totales.co2Mes.toFixed(1)) },
    { name: 'Con el plan', co2: Number(plan.despues.totales.co2Mes.toFixed(1)) },
  ];

  return (
    <>
      <header className="page-head">
        <h1>Panel</h1>
        <p>{settings.empresa || 'Tu empresa'} · cifras mensuales con la tarifa y el factor de emisión cargados en Inventario.</p>
      </header>
      <div className="kpis">
        <KpiCard label="Consumo mensual" value={`${fmt(totales.kWhMes)} kWh`} sub={`${fmt(totales.kWhRefrig)} kWh son refrigeración`} />
        <KpiCard label="Costo de energía por mes" value={fmtARS(totales.costoMes)} sub={`${fmtARS(totales.costoAnio)} por año`} tone="navy" />
        <KpiCard label="Huella de carbono por mes" value={`${fmt(totales.co2Mes)} kg CO₂`} sub={`${fmt(totales.co2Anio / 1000, 1)} t CO₂ por año`} tone="orange" />
        <KpiCard label="Ahorro posible con el plan" value={fmtPct(plan.ahorro.pct)} sub={`${fmtARS(plan.ahorro.costoAnio)} y ${fmt(plan.ahorro.co2Anio / 1000, 1)} t CO₂ por año`} />
      </div>

      <div className="charts">
        <section className="card">
          <h2>Consumo por tipo de equipo (kWh/mes)</h2>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `${fmt(v, 1)} kWh`} />
                <Legend />
                <Bar dataKey="Equipos IT" stackId="a" fill="#2E7D32" />
                <Bar dataKey="Refrigeración" stackId="a" fill="#F39C12" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card">
          <h2>Huella de carbono por tipo (kg CO₂/mes)</h2>
          <div className="chart">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `${fmt(v, 1)} kg CO₂`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card">
          <h2>Hoy vs. con el plan (kg CO₂/mes)</h2>
          <div className="chart">
            <ResponsiveContainer>
              <BarChart data={compData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => `${fmt(v, 1)} kg CO₂`} />
                <Bar dataKey="co2" radius={[6, 6, 0, 0]}>
                  <Cell fill="#0B1F3A" />
                  <Cell fill="#2E7D32" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="hint">Detalle del plan en <Link to="/plan">Plan de ahorro</Link>. Todas las cuentas en <Link to="/calculos">Cálculos</Link>.</p>
        </section>
        <section className="card">
          <h2>Objetivos de Desarrollo Sostenible</h2>
          <div className="chips">
            <span className="chip">ODS 7 Energía asequible y no contaminante</span>
            <span className="chip">ODS 9 Industria, innovación e infraestructura</span>
            <span className="chip">ODS 12 Producción y consumo responsables</span>
            <span className="chip">ODS 13 Acción por el clima</span>
          </div>
          <p className="hint">Cada kWh que se deja de consumir reduce el costo y las emisiones de la empresa.</p>
        </section>
      </div>
    </>
  );
}
