// @ts-nocheck
import { Personaje, Asignacion, Testimonio } from './tipos';

export interface CasoGenerado {
  personajes: any;
  testigos: string[];
  asignaciones: Asignacion[];
  solucion: {
    asesinos: string[];
    mentirosos: string[];
  };
}

export const PERSONAJES: Personaje[] = [
  { nombre: "Tavio", gen: "Chico", rasgo: "Muy Arisco" },
  { nombre: "Pili", gen: "Chica", rasgo: "Muy Arisca" },
  { nombre: "Pork", gen: "Chico", rasgo: "Arisco" },
  { nombre: "Charlot", gen: "Chica", rasgo: "Arisca" },
  { nombre: "Lolo", gen: "Chico", rasgo: "Cariñoso" },
  { nombre: "Luisa", gen: "Chica", rasgo: "Cariñosa" },
  { nombre: "Charls", gen: "Chico", rasgo: "Muy Cariñoso" },
  { nombre: "Reisy", gen: "Chica", rasgo: "Muy Cariñosa" }
];

export const TESTIGOS_DB = ["Thomas", "Mr. Red", "La Vicente", "Croqueta Batista"];

const getValorAfecto = (rasgo: string): number => {
  if (rasgo.includes("Muy Arisc")) return 0;
  if (rasgo.includes("Arisc")) return 1;
  if (rasgo.includes("Cariños") && !rasgo.includes("Muy")) return 2;
  if (rasgo.includes("Muy Cariños")) return 3;
  return -1;
};

const normalizarRasgo = (rasgo: string): string => {
  if (rasgo.includes("Muy Arisc")) return "Muy Arisco";
  if (rasgo.includes("Arisc")) return "Arisco";
  if (rasgo.includes("Cariños") && !rasgo.includes("Muy")) return "Cariñoso";
  if (rasgo.includes("Muy Cariños")) return "Muy Cariñoso";
  return rasgo;
};

const compararRasgo = (valAsesino: number, valSpeaker: number, palabraRel: string, isMas: boolean): boolean => {
  if (palabraRel === "cariñoso") {
    return isMas ? valAsesino > valSpeaker : valAsesino < valSpeaker;
  } else {
    return isMas ? valAsesino < valSpeaker : valAsesino > valSpeaker;
  }
};

const evaluarTestimonio = (
  pSpeaker: Personaje, 
  t: Testimonio, 
  asesinos: Personaje[], 
  asignacionesDict: Record<string, Asignacion>, 
  testigosActivos: string[], 
  visitados: Set<string> = new Set()
): boolean => {
  if (visitados.has(pSpeaker.nombre)) return false;
  
  const visitadosCopy = new Set(visitados);
  visitadosCopy.add(pSpeaker.nombre);

  const cat = t.cat;
  const texto = t.texto;

  if (cat === "F") {
    const target = t.target!;
    const isMiente = texto.includes("miente");
    
    if (testigosActivos.includes("Croqueta Batista")) {
      const targetGuilty = asesinos.some(a => a.nombre === target);
      return isMiente ? !targetGuilty : targetGuilty;
    } else {
      const asigTarget = asignacionesDict[target];
      const verdadTarget = evaluarTestimonio(asigTarget.personaje, asigTarget.testimonio, asesinos, asignacionesDict, testigosActivos, visitadosCopy);
      return isMiente ? !verdadTarget : verdadTarget;
    }
  }

  if (cat === "A") {
    if (texto.includes("He sido yo")) return asesinos.some(a => a.nombre === pSpeaker.nombre);
    if (texto.includes("Yo no he sido")) return !asesinos.some(a => a.nombre === pSpeaker.nombre);
    if (texto.includes("No ha sido")) return asesinos.every(a => a.nombre !== t.target);
    if (texto.includes("Ha sido")) return asesinos.some(a => a.nombre === t.target);
  }

  let buscaChico = texto.includes("chico");
  let buscaChica = texto.includes("chica");
  
  if (testigosActivos.includes("Thomas")) {
    buscaChico = texto.includes("chica");
    buscaChica = texto.includes("chico");
  }

  let buscaRasgo = t.rasgo;
  if (buscaRasgo) {
    if (testigosActivos.includes("Mr. Red") && buscaRasgo === "Arisco") buscaRasgo = "Cariñoso";
    else if (testigosActivos.includes("Mr. Red") && buscaRasgo === "Muy Arisco") buscaRasgo = "Muy Cariñoso";
    else if (testigosActivos.includes("La Vicente") && buscaRasgo === "Cariñoso") buscaRasgo = "Arisco";
    else if (testigosActivos.includes("La Vicente") && buscaRasgo === "Muy Cariñoso") buscaRasgo = "Muy Arisco";
  }

  let palabraRel = t.rel_word;
  if (palabraRel) {
    if (testigosActivos.includes("Mr. Red") && palabraRel === "arisco") palabraRel = "cariñoso";
    else if (testigosActivos.includes("La Vicente") && palabraRel === "cariñoso") palabraRel = "arisco";
  }

  if (cat === "B") {
    if (texto.includes("Al menos")) return asesinos.some(a => (buscaChico ? a.gen === "Chico" : a.gen === "Chica"));
    if (texto.includes("Ningún")) return asesinos.every(a => (buscaChico ? a.gen !== "Chico" : a.gen !== "Chica"));
  }

  if (cat === "C") {
    if (texto.includes("Al menos")) return asesinos.some(a => normalizarRasgo(a.rasgo) === buscaRasgo);
    if (texto.includes("Ningún")) return asesinos.every(a => normalizarRasgo(a.rasgo) !== buscaRasgo);
  }

  if (cat === "D") {
    const valMio = getValorAfecto(pSpeaker.rasgo);
    const isMas = texto.includes("más");
    if (texto.includes("Al menos")) return asesinos.some(a => compararRasgo(getValorAfecto(a.rasgo), valMio, palabraRel!, isMas));
    if (texto.includes("Ningún")) return asesinos.every(a => !compararRasgo(getValorAfecto(a.rasgo), valMio, palabraRel!, isMas));
  }

  if (cat === "E") {
    const valMio = getValorAfecto(pSpeaker.rasgo);
    const isMas = texto.includes("más");
    const checkComp = (a: Personaje) => {
      const genOk = (buscaChico ? a.gen === "Chico" : a.gen === "Chica");
      const rasgoOk = compararRasgo(getValorAfecto(a.rasgo), valMio, palabraRel!, isMas);
      return genOk && rasgoOk;
    };
    if (texto.includes("Al menos")) return asesinos.some(checkComp);
  }

  return true;
};

const generarPool = (presentes: Personaje[]): Testimonio[] => {
  const pool: Testimonio[] = [];
  const nombres = presentes.map(p => p.nombre);
  const rasgosBase = ["Muy Arisco", "Arisco", "Cariñoso", "Muy Cariñoso"];
  
  presentes.forEach(p => {
    const sp = p.nombre;
    pool.push({ texto: "He sido yo.", cat: "A", speaker: sp, tags: [] });
    pool.push({ texto: "Yo no he sido.", cat: "A", speaker: sp, tags: [] });
    
    nombres.forEach(otro => {
      if (otro !== sp) {
        pool.push({ texto: `Ha sido ${otro}.`, cat: "A", speaker: sp, target: otro, tags: [] });
        pool.push({ texto: `No ha sido ${otro}.`, cat: "A", speaker: sp, target: otro, tags: [] });
        pool.push({ texto: `${otro} miente.`, cat: "F", speaker: sp, target: otro, tags: ["Croqueta Batista"] });
        pool.push({ texto: `${otro} dice la verdad.`, cat: "F", speaker: sp, target: otro, tags: ["Croqueta Batista"] });
      }
    });
    
    pool.push({ texto: "Al menos un asesino es un chico.", cat: "B", speaker: sp, tags: ["Thomas"] });
    pool.push({ texto: "Al menos un asesino es una chica.", cat: "B", speaker: sp, tags: ["Thomas"] });
    pool.push({ texto: "Ningún asesino es un chico.", cat: "B", speaker: sp, tags: ["Thomas"] });
    pool.push({ texto: "Ningún asesino es una chica.", cat: "B", speaker: sp, tags: ["Thomas"] });

    rasgosBase.forEach(r => {
      // FIX: Array explícitamente tipado
      const tagsR: string[] = []; 
      if (r.includes("Arisco")) tagsR.push("Mr. Red");
      if (r.includes("Cariñoso")) tagsR.push("La Vicente");
      pool.push({ texto: `Al menos un asesino es ${r}.`, cat: "C", speaker: sp, rasgo: r, tags: tagsR });
      pool.push({ texto: `Ningún asesino es ${r}.`, cat: "C", speaker: sp, rasgo: r, tags: tagsR });
    });

    ["cariñoso", "arisco"].forEach(rel => {
      // FIX: Array explícitamente tipado
      const tagsRel: string[] = []; 
      if (rel === "arisco") tagsRel.push("Mr. Red");
      if (rel === "cariñoso") tagsRel.push("La Vicente");
      
      const tagsE = ["Thomas", ...tagsRel];
      
      ["más", "menos"].forEach(cmp => {
        pool.push({ texto: `Al menos un asesino es ${cmp} ${rel} que yo.`, cat: "D", speaker: sp, rel_word: rel, tags: tagsRel });
        pool.push({ texto: `Ningún asesino es ${cmp} ${rel} que yo.`, cat: "D", speaker: sp, rel_word: rel, tags: tagsRel });
        pool.push({ texto: `Al menos un asesino es un chico y ${cmp} ${rel} que yo.`, cat: "E", speaker: sp, rel_word: rel, tags: tagsE });
        pool.push({ texto: `Al menos un asesino es una chica y ${cmp} ${rel} que yo.`, cat: "E", speaker: sp, rel_word: rel, tags: tagsE });
      });
    });
  });
  
  return pool;
};

// Generador Combinatorio auxiliar
function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  function combine(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  combine(0, []);
  return result;
}

// Mezclador aleatorio
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const generarCaso = (config: any): CasoGenerado => {
  const s = config.sospechososTotales;
  const a = config.asesinos;
  const m = config.mentirosos;
  const w_count = config.testigosActivos;
  const isManual = config.modoSeleccion === 'manual';

  const maxIntentos = 15000;
  let intentos = 0;

  while (intentos < maxIntentos) {
    intentos++;
    
    let presentes: Personaje[] = [];
    let testigosActivos: string[] = [];

    if (isManual) {
      presentes = PERSONAJES.filter(p => config.personajesManuales.includes(p.nombre));
      testigosActivos = [...config.testigosManuales];
    } else {
      presentes = shuffle(PERSONAJES).slice(0, s);
      testigosActivos = shuffle(TESTIGOS_DB).slice(0, w_count);
    }

    const poolTotal = generarPool(presentes);
    const testimoniosPorPersona: Record<string, Testimonio[]> = {};
    presentes.forEach(p => {
      testimoniosPorPersona[p.nombre] = poolTotal.filter(t => t.speaker === p.nombre);
    });

    let valido = false;
    let asignacionesLista: Asignacion[] = [];

    for (let tr = 0; tr < 100; tr++) {
      const textosUsados = new Set<string>();
      asignacionesLista = [];
      const nombresShuffle = shuffle(presentes.map(p => p.nombre));
      
      for (const nombre of nombresShuffle) {
        const opciones = testimoniosPorPersona[nombre].filter(t => !textosUsados.has(t.texto));
        if (opciones.length === 0) break;
        
        const neededTags = new Set<string>();
        for (const testigo of testigosActivos) {
          const count = asignacionesLista.filter(asig => asig.testimonio.tags.includes(testigo)).length;
          if (count < 2) neededTags.add(testigo);
        }
          
        const opcionesPrioritarias = opciones.filter(t => t.tags.some(tg => neededTags.has(tg)));
        
        let tSelec: Testimonio;
        if (opcionesPrioritarias.length > 0 && Math.random() < 0.85) {
          tSelec = opcionesPrioritarias[Math.floor(Math.random() * opcionesPrioritarias.length)];
        } else {
          tSelec = opciones[Math.floor(Math.random() * opciones.length)];
        }
          
        const personajeSeleccionado = presentes.find(p => p.nombre === nombre)!;
        asignacionesLista.push({ personaje: personajeSeleccionado, testimonio: tSelec });
        textosUsados.add(tSelec.texto);
      }
        
      if (asignacionesLista.length === s) {
        let testigosCumplidos = true;
        for (const testigo of testigosActivos) {
          const count = asignacionesLista.filter(asig => asig.testimonio.tags.includes(testigo)).length;
          if (count < 2) {
            testigosCumplidos = false;
            break;
          }
        }
        if (testigosCumplidos) {
          valido = true;
          break;
        }
      }
    }

    if (!valido) continue;

    const asignacionesDict: Record<string, Asignacion> = {};
    asignacionesLista.forEach(asig => {
      asignacionesDict[asig.personaje.nombre] = asig;
    });

    const combinaciones = getCombinations(presentes, a);
    const solucionesValidas: Personaje[][] = [];
    const mentirososPorSolucion: string[][] = [];
    
    for (const asesinosPosibles of combinaciones) {
      let falsos = 0;
      const mentirososActuales: string[] = [];
      
      for (const asig of asignacionesLista) {
        const esVerdad = evaluarTestimonio(asig.personaje, asig.testimonio, asesinosPosibles, asignacionesDict, testigosActivos);
        if (!esVerdad) {
          falsos++;
          mentirososActuales.push(asig.personaje.nombre);
        }
      }
      
      if (falsos === m) {
        solucionesValidas.push(asesinosPosibles);
        mentirososPorSolucion.push(mentirososActuales);
      }
    }
        
    if (solucionesValidas.length === 1) {
      if (solucionesValidas.length === 1) {
        return {
          personajes: asignacionesLista.map(a => a.personaje),
          testigos: testigosActivos,
          asignaciones: asignacionesLista,
          solucion: {
            asesinos: solucionesValidas[0].map(x => x.nombre),
            mentirosos: mentirososPorSolucion[0]
          }
        };
      }
    }
  }

  return {
    personajes: [],
    testigos: [],
    asignaciones: [],
    solucion: { asesinos: [], mentirosos: [] }
  };
};
export { evaluarTestimonio, generarPool };
