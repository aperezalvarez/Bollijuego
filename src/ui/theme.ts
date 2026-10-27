/** Tokens derivados del arte real (Portada/Testimonio/Sospechosos/Dorso): madera oscura, pergamino, latón. */
export const color = {
  wood900: '#1b120c',
  wood800: '#2b1c12',
  wood700: '#3d2a1b',
  wood500: '#6f4f31',
  parchment: '#ead9b6',
  parchmentDim: '#c9b48a',
  ink: '#2a1a12',
  brass: '#b8893a',
  gold: '#d9a441',
  goldBright: '#f1c40f',
  blood: '#8e2a22',
  bloodBright: '#a53126',
  sage: '#46603a',
  textOnDark: '#f1e6cc',
  textMuted: '#b9a883',
} as const;

export const space = {xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32} as const;
export const radius = {sm: 6, md: 10, lg: 16, card: 12, pill: 999} as const;
export const hit = {min: 44} as const; // objetivo táctil mínimo (HIG 44 pt · Material 48 dp)

/** Relación de aspecto REAL de las cartas (385×538). */
export const CARD_ASPECT = 385 / 538;

export const shadow = (elevation: 1 | 2 | 3) => ({
  elevation: elevation * 3,
  shadowColor: '#000',
  shadowOpacity: 0.18 + elevation * 0.06,
  shadowRadius: 2 + elevation * 3,
  shadowOffset: {width: 0, height: elevation * 2},
});

export const font = {display: 'serif', body: undefined} as const;
export const type = {
  title: {fontFamily: 'serif', fontWeight: '800' as const, fontSize: 28, letterSpacing: 0.5},
  h2: {fontFamily: 'serif', fontWeight: '800' as const, fontSize: 20, letterSpacing: 0.4},
  h3: {fontWeight: '700' as const, fontSize: 16},
  body: {fontSize: 15, lineHeight: 21},
  small: {fontSize: 13, lineHeight: 18},
  label: {fontWeight: '800' as const, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase' as const},
};
export const overlay = 'rgba(12,7,4,0.78)';
