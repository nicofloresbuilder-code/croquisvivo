/** Croquis de ejemplo. Todos los sitios y personas son inventados para la demo. */
import { Site, Zone, Person, FLOOR, WALL, EXIT, OBST, SPK, NOISE, DOOR, WIN, STAIR, FURN, mulberry32 } from "./nucleo";


function makeSite(cols: number, rows: number, name: string): Site {
  return { name, cols, rows, g: new Uint8Array(cols * rows), zones: [], people: [] };
}
function painter(s: Site) {
  const idx = (x: number, y: number) => y * s.cols + x;
  const put = (x: number, y: number, t: number) => {
    if (x >= 0 && x < s.cols && y >= 0 && y < s.rows) s.g[idx(x, y)] = t;
  };
  const rect = (x: number, y: number, w: number, h: number, t: number) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(i, j, t);
  };
  return {
    put, rect,
    door: (x: number, y: number, n = 2) => { for (let k = 0; k < n; k++) put(x + k, y, DOOR) },
    vdoor: (x: number, y: number, n = 2) => { for (let k = 0; k < n; k++) put(x, y + k, DOOR) },
    border: () => { rect(0, 0, s.cols, 1, WALL); rect(0, s.rows - 1, s.cols, 1, WALL); rect(0, 0, 1, s.rows, WALL); rect(s.cols - 1, 0, 1, s.rows, WALL) },
  };
}
function fillPeople(s: Site, spec: [string, number, string][]) {
  const rnd = mulberry32(77);
  let n = 0;
  s.people = [];
  for (const [zoneName, count, role] of spec) {
    const z = s.zones.find((q) => q.name === zoneName);
    if (!z) continue;
    const free: [number, number][] = [];
    for (let y = z.y; y < z.y + z.h; y++) for (let x = z.x; x < z.x + z.w; x++) {
      if (s.g[y * s.cols + x] === FLOOR) free.push([x, y]);
    }
    for (let k = free.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [free[k], free[j]] = [free[j], free[k]] }
    for (let c = 0; c < count && c < free.length; c++) {
      s.people.push({ x: free[c][0] + 0.5, y: free[c][1] + 0.5, name: `Persona ${String(n + 1).padStart(2, "0")}`, role, zone: z.name });
      n++;
    }
  }
}

export function presetHospital(): Site {
  const s = makeSite(52, 32, "Hospital de ejemplo (inventado) · piso 2"), p = painter(s);
  p.border();
  p.rect(1, 13, 50, 1, WALL); p.rect(1, 19, 50, 1, WALL);
  [9, 18, 27, 36, 44].forEach((x) => p.rect(x, 1, 1, 12, WALL));
  [11, 21, 31, 41].forEach((x) => p.rect(x, 20, 1, 11, WALL));
  [4, 13, 22, 31, 40, 47].forEach((x) => p.door(x, 13));
  [5, 16, 26, 36, 46].forEach((x) => p.door(x, 19));
  // escaleras de emergencia en los dos extremos del pasillo
  p.rect(1, 15, 3, 3, STAIR); p.put(4, 14, WALL); p.put(4, 18, WALL);
  p.rect(48, 15, 3, 3, STAIR); p.put(47, 14, WALL); p.put(47, 18, WALL);
  ([[3,6],[12,15],[21,24],[30,33],[38,41],[46,49]] as [number,number][]).forEach((r) => p.rect(r[0], 0, r[1] - r[0] + 1, 1, WIN));
  ([[3,7],[14,18],[24,28],[34,38],[44,48]] as [number,number][]).forEach((r) => p.rect(r[0], 31, r[1] - r[0] + 1, 1, WIN));
  ([[2,2],[2,5],[2,8]] as [number,number][]).forEach((c) => p.rect(c[0], c[1], 2, 1, FURN));
  p.rect(6, 10, 2, 1, FURN);
  p.rect(11, 8, 4, 1, FURN); p.rect(15, 2, 2, 1, FURN);
  p.rect(21, 3, 3, 1, FURN); p.rect(21, 8, 2, 1, FURN); p.rect(24, 10, 2, 1, FURN);
  p.rect(29, 2, 6, 1, FURN); p.rect(29, 10, 6, 1, FURN);
  ([[38,2],[38,5],[38,8],[41,2],[41,5],[41,8]] as [number,number][]).forEach((c) => p.rect(c[0], c[1], 2, 1, FURN));
  ([[46,2],[46,5],[46,8]] as [number,number][]).forEach((c) => p.rect(c[0], c[1], 2, 1, FURN));
  p.rect(2, 23, 6, 1, FURN); p.rect(2, 27, 3, 1, FURN);
  p.rect(15, 24, 3, 2, FURN);
  [23, 26, 29].forEach((x) => p.rect(x, 21, 1, 8, FURN));
  ([[34,22],[38,22],[34,26],[38,26]] as [number,number][]).forEach((c) => p.rect(c[0], c[1], 2, 1, FURN));
  p.rect(43, 21, 1, 7, FURN); p.rect(49, 21, 1, 7, FURN);
  // alertamiento en todas las áreas menos Rayos X
  ([[4,3],[22,3],[31,3],[40,3],[47,3],[5,23],[16,23],[26,23],[36,23],[46,23],[12,16],[38,16]] as [number,number][])
    .forEach((c) => p.put(c[0], c[1], SPK));
  p.put(13, 4, NOISE);        // compresor del equipo de rayos X
  p.rect(45, 14, 1, 5, OBST); // camillas apiladas en el pasillo oriente
  s.zones = [
    { name: "Urgencias", x: 1, y: 1, w: 8, h: 12 }, { name: "Rayos X", x: 10, y: 1, w: 8, h: 12 },
    { name: "Consultorios", x: 19, y: 1, w: 8, h: 12 }, { name: "Laboratorio", x: 28, y: 1, w: 8, h: 12 },
    { name: "Hospitalización A", x: 37, y: 1, w: 7, h: 12 }, { name: "Hosp. B", x: 45, y: 1, w: 6, h: 12 },
    { name: "Pasillo central", x: 1, y: 14, w: 50, h: 5 },
    { name: "Recepción", x: 1, y: 20, w: 10, h: 11 }, { name: "Quirófanos", x: 12, y: 20, w: 9, h: 11 },
    { name: "Almacén", x: 22, y: 20, w: 9, h: 11 }, { name: "Cafetería", x: 32, y: 20, w: 9, h: 11 },
    { name: "Vestidores", x: 42, y: 20, w: 9, h: 11 },
  ];
  fillPeople(s, [["Urgencias",4,"enfermería"],["Rayos X",4,"técnico radiólogo"],["Consultorios",3,"médico"],
    ["Laboratorio",3,"laboratorista"],["Hospitalización A",4,"enfermería"],["Hosp. B",3,"camillero"],
    ["Pasillo central",2,"brigadista"],["Recepción",3,"administrativo"],["Quirófanos",2,"cirugía"],
    ["Almacén",1,"almacenista"],["Cafetería",2,"cocina"],["Vestidores",1,"intendencia"]]);
  return s;
}

export function presetEscuela(): Site {
  const s = makeSite(54, 34, "Primaria de ejemplo (inventada) · planta baja"), p = painter(s);
  p.border();
  p.rect(1, 13, 52, 1, WALL); p.rect(1, 17, 52, 1, WALL);
  [11, 22, 33, 44].forEach((x) => p.rect(x, 1, 1, 12, WALL));
  [5, 16, 27, 38, 48].forEach((x) => p.door(x, 13));
  [20, 27, 34].forEach((x) => p.door(x, 17));
  p.rect(13, 18, 1, 15, WALL); p.rect(40, 18, 1, 15, WALL);
  p.rect(1, 25, 12, 1, WALL); p.rect(41, 25, 12, 1, WALL);
  p.vdoor(13, 21); p.vdoor(13, 29); p.vdoor(40, 21); p.vdoor(40, 29);
  p.rect(24, 33, 5, 1, EXIT); p.rect(16, 33, 3, 1, EXIT);
  ([[3,8],[14,19],[25,30],[36,41],[47,51]] as [number,number][]).forEach((r) => p.rect(r[0], 0, r[1] - r[0] + 1, 1, WIN));
  p.rect(0, 19, 1, 4, WIN); p.rect(53, 19, 1, 4, WIN);
  [1, 12, 23, 34].forEach((ax) => {          // pupitres y escritorio del maestro
    for (let dx = 1; dx <= 7; dx += 2) for (let dy = 3; dy <= 9; dy += 2) p.put(ax + dx, dy, FURN);
    p.rect(ax + 3, 11, 2, 1, FURN);
  });
  p.rect(46, 3, 5, 1, FURN); p.rect(46, 9, 5, 1, FURN);
  p.rect(3, 20, 2, 1, FURN); p.rect(8, 20, 2, 1, FURN);
  p.rect(2, 28, 7, 1, FURN);
  [42, 45, 48].forEach((x) => p.rect(x, 19, 1, 5, FURN));
  ([[43,28],[48,28],[43,31],[48,31]] as [number,number][]).forEach((c) => p.rect(c[0], c[1], 3, 1, FURN));
  p.rect(17, 22, 2, 2, FURN); p.rect(36, 22, 2, 2, FURN);
  ([[5,6],[16,6],[27,6],[16,15],[30,15],[27,28],[6,21],[46,21],[46,29]] as [number,number][])
    .forEach((c) => p.put(c[0], c[1], SPK));   // 4º A se queda sin altavoz propio
  p.put(45, 7, NOISE);       // planta de luz pegada al muro de 4º A
  p.rect(20, 17, 2, 1, OBST); // bancas apiladas tapando la puerta poniente
  s.zones = [
    { name: "1º A", x: 1, y: 1, w: 10, h: 12 }, { name: "2º A", x: 12, y: 1, w: 10, h: 12 },
    { name: "3º A", x: 23, y: 1, w: 10, h: 12 }, { name: "4º A", x: 34, y: 1, w: 10, h: 12 },
    { name: "Servicios", x: 45, y: 1, w: 8, h: 12 },
    { name: "Pasillo", x: 1, y: 14, w: 52, h: 3 },
    { name: "Dirección", x: 1, y: 18, w: 12, h: 7 }, { name: "Baños", x: 1, y: 26, w: 12, h: 7 },
    { name: "Patio", x: 14, y: 18, w: 26, h: 15 },
    { name: "Biblioteca", x: 41, y: 18, w: 12, h: 7 }, { name: "Comedor", x: 41, y: 26, w: 12, h: 7 },
  ];
  fillPeople(s, [["1º A",8,"alumnado"],["2º A",8,"alumnado"],["3º A",8,"alumnado"],["4º A",8,"alumnado"],
    ["Servicios",1,"mantenimiento"],["Pasillo",2,"prefectura"],["Dirección",2,"administrativo"],
    ["Patio",3,"docente"],["Biblioteca",2,"docente"],["Comedor",3,"cocina"]]);
  return s;
}

/** Croquis disponibles en esta versión (el editor libre queda fuera del alcance). */
export const PRESETS: Record<string, () => Site> = { hospital: presetHospital, escuela: presetEscuela };
export const PRESET_LABELS: [string, string][] = [
  ["hospital", "Hospital de ejemplo · piso 2"],
  ["escuela", "Primaria de ejemplo · planta baja"],
];
export type SitioId = "hospital" | "escuela";
export type { Zone, Person };
