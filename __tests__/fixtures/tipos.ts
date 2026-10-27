// @ts-nocheck
export type Genero = "Chico" | "Chica";

export type Rasgo = 
  | "Muy Arisco" 
  | "Arisco" 
  | "Cariñoso" 
  | "Muy Cariñoso"
  | "Muy Arisca"
  | "Arisca"
  | "Cariñosa"
  | "Muy Cariñosa";

export interface Personaje {
  nombre: string;
  gen: Genero;
  rasgo: Rasgo;
}

export interface Testigo {
  nombre: string;
}

export interface Testimonio {
  texto: string;
  cat: string;
  speaker: string;
  target?: string;
  tags: string[];
  rasgo?: string;
  rel_word?: string;
  estaRevelado?: boolean;
}

export interface Asignacion {
  personaje: Personaje;
  testimonio: Testimonio;
}

export type ModoJuego = "individual" | "cooperativo" | "versus";

export interface ConfiguracionCaso {
  cantidadSospechosos: number;
  cantidadAsesinos: number;
  cantidadMentirosos: number;
  cantidadTestigos: number;
  modoManual: boolean;
  personajesSeleccionados: string[];
  testigosSeleccionados: string[];
}