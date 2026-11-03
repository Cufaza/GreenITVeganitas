-- Catálogo de equipos y potencias de referencia (idéntico a src/data/catalog.js). Se puede ejecutar varias veces.
insert into public.equipment_catalog
  (id, nombre, categoria, potencia_uso_w, potencia_reposo_w, potencia_apagado_w, potencia_max_w, rango, fuente, confianza, nota)
values
  ('pc-escritorio','PC de escritorio','pc',100,50,1.5,null,'En uso: 60 a 250 W. Encendida sin uso: 50 a 150 W. Apagada: 1,5 W.','DSSW (Bluejay 2006; Kawamoto et al. 2001/2004) y Bluetti','Orientativa','Mediciones de equipos de 2000 a 2006. Reemplazar por la potencia de la etiqueta.'),
  ('monitor-lcd','Monitor LCD','monitor',30,2,0.5,null,'Encendido: 15 a 35 W. Suspensión: 1,5 a 2 W. Apagado: 0,5 W.','DSSW (Roberson et al. 2002; Kawamoto et al. 2004; Webber et al. 2006)','Media','Medidas en monitores de 15 a 18 pulgadas.'),
  ('notebook','Notebook','notebook',19,3,0,null,'En uso: 15 a 19 W. Suspensión: 3 W.','DSSW (Kawamoto et al. 2001; Roberson et al. 2002)','Media','Valores medidos en notebooks de 2000 a 2002.'),
  ('servidor-2s','Servidor de 2 o más sockets','servidor',null,161,0,365,'Potencia máxima de 365 W. Reposo cercano al 44% del máximo.','LBNL 2016','Media','Reposo = 0,44 × 365 W. Potencia en uso = reposo + carga% × (máx − reposo).'),
  ('servidor-1s','Servidor de 1 socket','servidor',null,52,0,118,'Potencia máxima de 118 W. Reposo cercano al 44% del máximo.','LBNL 2016','Media','Reposo = 0,44 × 118 W.'),
  ('switch-24','Switch de 24 puertos','red',15.9,14.5,0,null,'Reposo: 14,52 W. Promedio: 15,88 W. Plena carga: 16,68 W.','Hoja de datos Cisco Catalyst C1000-24T-4G-L','Alta','Switch sin PoE.'),
  ('otro','Otro equipo (potencia propia)','otro',0,0,0,null,'Cargar la potencia de la etiqueta o ficha técnica.','Dato del usuario','Dato propio','Impresoras, UPS, NAS, access points, etc.')
on conflict (id) do update set
  nombre = excluded.nombre, categoria = excluded.categoria,
  potencia_uso_w = excluded.potencia_uso_w, potencia_reposo_w = excluded.potencia_reposo_w,
  potencia_apagado_w = excluded.potencia_apagado_w, potencia_max_w = excluded.potencia_max_w,
  rango = excluded.rango, fuente = excluded.fuente, confianza = excluded.confianza, nota = excluded.nota;
