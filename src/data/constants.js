// Parámetros reales usados por el motor de cálculo, con su fuente.
// Todos son editables por el usuario desde la pantalla "Inventario".

export const HORAS_SEMANA = 168;
export const SEMANAS_MES = 52 / 12; // 4,3333 semanas por mes

export const FACTOR_EMISION = {
  valor: 0.283,
  anio: 2022,
  unidad: 'kg CO₂/kWh',
  fuente:
    'Subsecretaría de Ambiente de la Nación. Factores de Emisión GEI (SNIGEI-AR) aplicables al cálculo de Huella de Carbono, 2025. Tabla 5: Uso de electricidad.',
  url: 'https://inventariogei.ambiente.gob.ar/files/Factores_de_Emision_SNIGEIAR_para_HC_2025.pdf',
  nota: 'Es el valor más reciente de la serie 1990-2022 de ese documento. Incluye CO₂, CH₄ y N₂O (PCG del AR5).',
};

export const TARIFA_EDENOR_T1G = {
  vigencia: 'desde el 1 de abril de 2026',
  cargoFijoARS: 16756.35,
  tramos: [
    { id: 'G1', rango: '0 a 800 kWh/mes', cargoVariable: 192.109 },
    { id: 'G2', rango: '801 a 2000 kWh/mes', cargoVariable: 214.17 },
    { id: 'G3', rango: 'Más de 2000 kWh/mes', cargoVariable: 216.572 },
  ],
  fuente:
    'Cuadro tarifario de Edenor vigente desde el 1/4/2026 (ENRE, IF-2026-31102078-APN-ARYEE#ENRE). Tarifa 1-G (general).',
  url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/420000-424999/424394/res198-anexo2.pdf',
  nota: 'Se usa solo el cargo variable de energía ($/kWh), sin cargo fijo ni impuestos. Para otra distribuidora, cargue su valor manualmente.',
};

export const PUE = {
  closet: { valor: 2.0, etiqueta: 'Rack en armario (closet)' },
  sala: { valor: 2.5, etiqueta: 'Sala de servidores dedicada' },
  mejorado: 1.7,
  fuente:
    'Shehabi et al. (LBNL, 2016). United States Data Center Energy Usage Report. Tabla 4 (PUE 2014 por tipo de espacio) y Tabla 6 (escenario Improved Management).',
  url: 'https://escholarship.org/content/qt84p772fc/qt84p772fc.pdf',
  nota: 'PUE = energía total ÷ energía de los equipos IT. La parte que supera 1 corresponde a refrigeración y pérdidas eléctricas.',
};

export const DEFAULT_SETTINGS = {
  empresa: '',
  tarifaTramo: 'G1',
  tarifaARS: 192.109,
  factorEmision: FACTOR_EMISION.valor,
  factorAnio: FACTOR_EMISION.anio,
  tipoSala: 'sala',
  pue: PUE.sala.valor,
};

export const CATEGORIAS = {
  pc: 'PCs de escritorio',
  monitor: 'Monitores',
  notebook: 'Notebooks',
  servidor: 'Servidores',
  red: 'Red (switches)',
  otro: 'Otros equipos',
};

export const UBICACIONES = {
  oficina: 'Oficina o laboratorio',
  sala_servidores: 'Sala de servidores',
};

export const FUENTES = [
  { id: 'fe', titulo: FACTOR_EMISION.fuente, url: FACTOR_EMISION.url },
  { id: 'tarifa', titulo: TARIFA_EDENOR_T1G.fuente, url: TARIFA_EDENOR_T1G.url },
  { id: 'pue', titulo: PUE.fuente, url: PUE.url },
  {
    id: 'dssw',
    titulo:
      'DSSW. Review of Computer Energy Consumption and Potential Savings (reúne mediciones de Kawamoto et al. 2001/2004, Roberson et al. 2002 y Bluejay 2006).',
    url: 'https://www.dssw.co.uk/research/computer_energy_consumption.html',
  },
  {
    id: 'cisco',
    titulo: 'Cisco. Hoja de datos del switch Catalyst C1000-24T-4G-L (consumo en reposo, promedio y a plena carga).',
    url: 'https://www.router-switch.com/pdf/c1000-24t-4g-l-datasheet.pdf',
  },
  {
    id: 'bluetti',
    titulo: 'Bluetti. Laptop vs. Desktop: How Many Watts Does a Computer Use? (referencia comercial orientativa).',
    url: 'https://www.bluettipower.com/blogs/knowledge/how-many-watts-does-a-laptop-use',
  },
];
