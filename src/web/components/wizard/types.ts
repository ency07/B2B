// Tipos compartidos del formulario del Wizard Web. Fuente única para todos
// los sub-componentes de paso (ServiceSelectionStep, TechnicalAnalysisStep,
// CorporateInfoStep, SummaryStep) y para WizardStepper, que es quien posee
// el estado real.

export interface WizardFormState {
  servicio: "fabricacion" | "venta" | "mantenimiento" | "reparacion" | "otro";
  urgencia: "baja" | "media" | "alta";
  length: number;
  width: number;
  height: number;
  altitude: number;
  environment: string;
  nombre: string;
  empresa: string;
  taxId: string;
  cargo: string;
  telefono: string;
  email: string;
  ciudad: string;
  otroDetalle: string;
}

export interface WizardSymptomsState {
  heat: boolean;
  dust: boolean;
  humidity: boolean;
  gases: boolean;
}

export type WizardFormChangeHandler = <K extends keyof WizardFormState>(
  key: K,
  val: WizardFormState[K]
) => void;
