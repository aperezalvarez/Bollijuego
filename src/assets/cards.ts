import type {ImageSourcePropType} from 'react-native';
import type {SuspectId, WitnessId} from '../domain';

/** ÚNICO registro de imágenes (antes estaba copiado 3 veces). Record<…> obliga a cubrir cada id. */
export const SUSPECT_ART: Record<SuspectId, ImageSourcePropType> = {
  Tavio: require('./images/tavio.webp'),
  Pili: require('./images/pili.webp'),
  Pork: require('./images/pork.webp'),
  Charlot: require('./images/charlot.webp'),
  Lolo: require('./images/lolo.webp'),
  Luisa: require('./images/luisa.webp'),
  Charls: require('./images/charls.webp'),
  Reisy: require('./images/reisy.webp'),
};

export const WITNESS_ART: Record<WitnessId, ImageSourcePropType> = {
  Thomas: require('./images/thomas.webp'),
  'Mr. Red': require('./images/mr-red.webp'),
  'La Vicente': require('./images/la-vicente.webp'),
  'Croqueta Batista': require('./images/croqueta-batista.webp'),
};

export const ART = {
  portada: require('./images/portada.webp') as ImageSourcePropType,
  dorso: require('./images/dorso.webp') as ImageSourcePropType,
  testimonio: require('./images/testimonio.webp') as ImageSourcePropType,
  sospechosos: require('./images/sospechosos.webp') as ImageSourcePropType,
  testigos: require('./images/testigos.webp') as ImageSourcePropType,
};
