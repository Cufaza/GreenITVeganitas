import { DEFAULT_SETTINGS } from './constants.js';

// Caso SIMULADO para la demostración: un departamento de la Universidad Nacional de La Matanza
// (Departamento de Ingeniería e Investigaciones Tecnológicas, DIIT, San Justo). Los equipos, las
// cantidades y los horarios son inventados, NO son mediciones reales de la UNLaM. Es un caso típico
// de laboratorios que quedan encendidos de noche y los fines de semana.
export const DEMO_EMAIL = 'demo@greenitcalc.com';
export const DEMO_PASSWORD = 'demo1234';

export function demoData() {
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      empresa: 'UNLaM, DIIT (caso simulado)',
      // El consumo IT de este departamento supera los 2000 kWh/mes, por eso se usa el tramo G3.
      // Simplificación: una universidad real estaría en una tarifa de gran demanda (T2/T3) y la app
      // solo modela Edenor T1-G. No se verificó qué distribuidora abastece el predio de San Justo.
      tarifaTramo: 'G3',
      tarifaARS: 216.572,
    },
    items: [
      {
        id: 'demo-1',
        catalogId: 'pc-escritorio',
        nombre: 'PCs de los 2 laboratorios de computación',
        cantidad: 60,
        ubicacion: 'oficina',
        horasUso: 60,
        horasReposo: 108,
        cargaPct: 100,
      },
      {
        id: 'demo-2',
        catalogId: 'monitor-lcd',
        nombre: 'Monitores de los laboratorios',
        cantidad: 60,
        ubicacion: 'oficina',
        horasUso: 60,
        horasReposo: 108,
        cargaPct: 100,
      },
      {
        id: 'demo-3',
        catalogId: 'pc-escritorio',
        nombre: 'PCs de secretaría y administración',
        cantidad: 10,
        ubicacion: 'oficina',
        horasUso: 40,
        horasReposo: 128,
        cargaPct: 100,
      },
      {
        id: 'demo-4',
        catalogId: 'monitor-lcd',
        nombre: 'Monitores de secretaría y administración',
        cantidad: 10,
        ubicacion: 'oficina',
        horasUso: 40,
        horasReposo: 128,
        cargaPct: 100,
      },
      {
        id: 'demo-5',
        catalogId: 'notebook',
        nombre: 'Notebooks de docentes',
        cantidad: 15,
        ubicacion: 'oficina',
        horasUso: 30,
        horasReposo: 20,
        cargaPct: 100,
      },
      {
        id: 'demo-6',
        catalogId: 'servidor-2s',
        nombre: 'Servidor de entornos de laboratorio y archivos',
        cantidad: 1,
        ubicacion: 'sala_servidores',
        horasUso: 168,
        horasReposo: 0,
        cargaPct: 35,
      },
      {
        id: 'demo-7',
        catalogId: 'servidor-1s',
        nombre: 'Servidor viejo de cátedras (casi sin uso)',
        cantidad: 1,
        ubicacion: 'sala_servidores',
        horasUso: 168,
        horasReposo: 0,
        cargaPct: 5,
      },
      {
        id: 'demo-8',
        catalogId: 'switch-24',
        nombre: 'Switches de la red del departamento',
        cantidad: 3,
        ubicacion: 'sala_servidores',
        horasUso: 168,
        horasReposo: 0,
        cargaPct: 100,
      },
    ],
  };
}

export function emptyData(empresa = '') {
  return { settings: { ...DEFAULT_SETTINGS, empresa }, items: [] };
}
