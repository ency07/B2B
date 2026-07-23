// Tipos y constantes compartidos entre EngineeringCapabilities, ProductCard y
// TechnicalDetailModal. Viven aparte (no en EngineeringCapabilities.tsx) para
// que ProductCard/TechnicalDetailModal no importen de vuelta al componente
// que los usa — evita un import circular entre los 3 archivos.

export interface CapacityItem {
  id: string;
  code: string;
  name: string;
  category: string;
  image: string;
  status: "DISPONIBLE" | "BAJO PEDIDO" | "SERIE ESPECIAL";
  shortDescription: string;
  projectRef: string;
  specs: Array<{ parametro: string; valor: string; cumplimiento: string }>;
  certifications: string[];
  applications: string[];
}

export const statusColor: Record<CapacityItem["status"], string> = {
  DISPONIBLE: "var(--ds-c-marketing-engineering-status-success)",
  "BAJO PEDIDO": "var(--ds-c-marketing-engineering-status-warning)",
  "SERIE ESPECIAL": "var(--ds-c-marketing-engineering-status-info)",
};
