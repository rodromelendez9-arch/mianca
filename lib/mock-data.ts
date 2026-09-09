export type EquipmentStatus = "borrador" | "valuado" | "publicado";

export interface Equipment {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  anio: number;
  horas: number;
  estado: EquipmentStatus;
  precioSugeridoMin: number | null;
  precioSugeridoMax: number | null;
  comparables: number;
  fotoPrincipal: string;
  publicadoEn: ("Mercado Libre" | "Facebook Marketplace")[];
}

export const equiposMock: Equipment[] = [
  {
    id: "eq-1",
    nombre: "Excavadora CAT 320",
    marca: "Caterpillar",
    modelo: "320",
    anio: 2018,
    horas: 6200,
    estado: "publicado",
    precioSugeridoMin: 1150000,
    precioSugeridoMax: 1320000,
    comparables: 9,
    fotoPrincipal: "🚜",
    publicadoEn: ["Mercado Libre"],
  },
  {
    id: "eq-2",
    nombre: "Generador Cummins 150kW",
    marca: "Cummins",
    modelo: "C150D6",
    anio: 2020,
    horas: 1800,
    estado: "valuado",
    precioSugeridoMin: 310000,
    precioSugeridoMax: 365000,
    comparables: 5,
    fotoPrincipal: "⚡",
    publicadoEn: [],
  },
  {
    id: "eq-3",
    nombre: "Compresor Atlas Copco XAS 185",
    marca: "Atlas Copco",
    modelo: "XAS 185",
    anio: 2016,
    horas: 4100,
    estado: "borrador",
    precioSugeridoMin: null,
    precioSugeridoMax: null,
    comparables: 0,
    fotoPrincipal: "🛠️",
    publicadoEn: [],
  },
];
