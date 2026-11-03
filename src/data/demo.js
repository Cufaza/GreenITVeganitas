import { DEFAULT_SETTINGS } from './constants.js';

// Empresa ficticia para la demostración. Los equipos y horarios son un caso típico de una
// oficina chica donde las PCs quedan encendidas todo el fin de semana y de noche.
export const DEMO_EMAIL = 'demo@greenitcalc.com';
export const DEMO_PASSWORD = 'demo1234';

export function demoData() {
  return {
    settings: {
      ...DEFAULT_SETTINGS,
      empresa: 'Estudio Contable Delta (empresa ficticia de demo)',
      // El consumo IT de esta oficina supera los 800 kWh/mes, por eso se usa el tramo G2.
      tarifaTramo: 'G2',
      tarifaARS: 214.17,
    },
    items: [
      {
        id: 'demo-1',
        catalogId: 'pc-escritorio',
        nombre: 'PCs de escritorio del estudio',
        cantidad: 12,
        ubicacion: 'oficina',
        horasUso: 40,
        horasReposo: 128,
        cargaPct: 100,
      },
      {
        id: 'demo-2',
        catalogId: 'monitor-lcd',
        nombre: 'Monitores de las PCs',
        cantidad: 12,
        ubicacion: 'oficina',
        horasUso: 40,
        horasReposo: 128,
        cargaPct: 100,
      },
      {
        id: 'demo-3',
        catalogId: 'notebook',
        nombre: 'Notebooks de los socios',
        cantidad: 4,
        ubicacion: 'oficina',
        horasUso: 30,
        horasReposo: 20,
        cargaPct: 100,
      },
      {
        id: 'demo-4',
        catalogId: 'servidor-2s',
        nombre: 'Servidor de archivos y sistema contable',
        cantidad: 1,
        ubicacion: 'sala_servidores',
        horasUso: 168,
        horasReposo: 0,
        cargaPct: 35,
      },
      {
        id: 'demo-5',
        catalogId: 'servidor-1s',
        nombre: 'Servidor viejo de pruebas (casi sin uso)',
        cantidad: 1,
        ubicacion: 'sala_servidores',
        horasUso: 168,
        horasReposo: 0,
        cargaPct: 5,
      },
      {
        id: 'demo-6',
        catalogId: 'switch-24',
        nombre: 'Switch de la red del estudio',
        cantidad: 1,
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
