import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

export type IconName =
  | 'menu'
  | 'close'
  | 'check'
  | 'pencil'
  | 'eraser'
  | 'undo'
  | 'trash'
  | 'exit'
  | 'lock'
  | 'heart'
  | 'male'
  | 'female'
  | 'book'
  | 'notes'
  | 'scale'
  | 'dice'
  | 'copy'
  | 'share'
  | 'gear'
  | 'chart'
  | 'play'
  | 'wifi'
  | 'users'
  | 'knife'
  | 'mask'
  | 'shield'
  | 'feather'
  | 'search'
  | 'back'
  | 'trophy'
  | 'clock'
  | 'eye'
  | 'sound'
  | 'vibrate'
  | 'sun'
  | 'grid';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}

/** Iconos vectoriales propios (24×24): idénticos en cualquier fabricante, tematizables y escalables. */
export function Icon({name, size = 24, color = '#f1e6cc', filled = false}: Props) {
  const s = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  const f = {fill: color, stroke: color, strokeWidth: 1.5, strokeLinejoin: 'round' as const};
  let body: React.ReactNode;
  switch (name) {
    case 'menu':
      body = <Path d="M4 7h16M4 12h16M4 17h16" {...s} />;
      break;
    case 'close':
      body = <Path d="M6 6l12 12M18 6L6 18" {...s} />;
      break;
    case 'check':
      body = <Path d="M5 12.5l4.5 4.5L19 7" {...s} />;
      break;
    case 'back':
      body = <Path d="M15 5l-7 7 7 7" {...s} />;
      break;
    case 'pencil':
      body = (
        <>
          <Path d="M4 20l1-4L16.5 4.5a2 2 0 013 3L8 19l-4 1z" {...s} />
          <Path d="M14 7l3 3" {...s} />
        </>
      );
      break;
    case 'eraser':
      body = (
        <>
          <Path d="M9 19l-5-5 9-9 6 6-7 7H9z" {...s} />
          <Path d="M13 19h8M8 9l7 7" {...s} />
        </>
      );
      break;
    case 'undo':
      body = (
        <>
          <Path d="M9 14L4 9l5-5" {...s} />
          <Path d="M4 9h10a6 6 0 010 12h-4" {...s} />
        </>
      );
      break;
    case 'trash':
      body = (
        <>
          <Path d="M4 7h16M9 7V4h6v3" {...s} />
          <Path d="M6 7l1 13h10l1-13M10 11v6M14 11v6" {...s} />
        </>
      );
      break;
    case 'exit':
      body = (
        <>
          <Path d="M10 4H5v16h5" {...s} />
          <Path d="M14 8l4 4-4 4M18 12H9" {...s} />
        </>
      );
      break;
    case 'lock':
      body = (
        <>
          <Rect x="6" y="11" width="12" height="9" rx="2" {...s} />
          <Path d="M8 11V8a4 4 0 018 0v3" {...s} />
        </>
      );
      break;
    case 'heart':
      body = (
        <Path d="M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z" {...(filled ? f : s)} />
      );
      break;
    case 'male':
      body = (
        <>
          <Circle cx="10" cy="14" r="5" {...s} />
          <Path d="M14 10l6-6M15 4h5v5" {...s} />
        </>
      );
      break;
    case 'female':
      body = (
        <>
          <Circle cx="12" cy="9" r="5" {...s} />
          <Path d="M12 14v7M9 18h6" {...s} />
        </>
      );
      break;
    case 'book':
      body = (
        <>
          <Path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3V4z" {...s} />
          <Path d="M8 4v13" {...s} />
        </>
      );
      break;
    case 'notes':
      body = (
        <>
          <Path d="M6 3h9l4 4v14H6z" {...s} />
          <Path d="M15 3v4h4M9 12h7M9 16h7" {...s} />
        </>
      );
      break;
    case 'scale':
      body = (
        <>
          <Path d="M12 4v16M5 20h14M5 8h14" {...s} />
          <Path d="M7 8l-3 7a3 3 0 006 0L7 8zM17 8l-3 7a3 3 0 006 0l-3-7z" {...s} />
        </>
      );
      break;
    case 'dice':
      body = (
        <>
          <Rect x="4" y="4" width="16" height="16" rx="3" {...s} />
          <Circle cx="9" cy="9" r="1" {...f} />
          <Circle cx="15" cy="15" r="1" {...f} />
          <Circle cx="12" cy="12" r="1" {...f} />
        </>
      );
      break;
    case 'copy':
      body = (
        <>
          <Path d="M8 8h11v12H8z" {...s} />
          <Path d="M5 16V4h11" {...s} />
        </>
      );
      break;
    case 'share':
      body = (
        <>
          <Circle cx="18" cy="5" r="3" {...s} />
          <Circle cx="6" cy="12" r="3" {...s} />
          <Circle cx="18" cy="19" r="3" {...s} />
          <Path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" {...s} />
        </>
      );
      break;
    case 'gear':
      body = (
        <>
          <Circle cx="12" cy="12" r="3.2" {...s} />
          <Path
            d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"
            {...s}
          />
        </>
      );
      break;
    case 'chart':
      body = <Path d="M5 20V10M12 20V4M19 20v-7" {...s} />;
      break;
    case 'play':
      body = <Path d="M8 4.5l12 7.5-12 7.5z" {...f} />;
      break;
    case 'wifi':
      body = (
        <>
          <Path d="M2.5 9a14 14 0 0119 0M5.5 12.5a9.5 9.5 0 0113 0M8.7 16a5 5 0 016.6 0" {...s} />
          <Circle cx="12" cy="19.5" r="1" {...f} />
        </>
      );
      break;
    case 'users':
      body = (
        <>
          <Circle cx="9" cy="7.5" r="3.5" {...s} />
          <Path d="M2.5 20a6.5 6.5 0 0113 0M16.5 4.5a3.2 3.2 0 010 6M18 14a6 6 0 013.5 6" {...s} />
        </>
      );
      break;
    case 'knife':
      body = (
        <>
          <Path d="M12 2.5l3.2 9-3.2 3-3.2-3z" {...s} />
          <Path d="M12 15v6M9 17h6" {...s} />
        </>
      );
      break;
    case 'mask':
      body = (
        <>
          <Path d="M4 6c4 2 12 2 16 0v6c0 5-4 8-8 8s-8-3-8-8z" {...s} />
          <Path d="M8 11h2.5M13.5 11H16M9.5 15.5c1.5 1 3.5 1 5 0" {...s} />
        </>
      );
      break;
    case 'shield':
      body = (
        <>
          <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" {...s} />
          <Path d="M9 12l2 2 4-4" {...s} />
        </>
      );
      break;
    case 'feather':
      body = (
        <>
          <Path d="M20 4C10 4 5 10 5 17l-1 3 3-1c7 0 13-5 13-15z" {...s} />
          <Path d="M5 17l9-9" {...s} />
        </>
      );
      break;
    case 'search':
      body = (
        <>
          <Circle cx="10.5" cy="10.5" r="6.5" {...s} />
          <Path d="M15.5 15.5L21 21" {...s} />
        </>
      );
      break;
    case 'trophy':
      body = (
        <>
          <Path d="M7 4h10v5a5 5 0 01-10 0V4z" {...s} />
          <Path d="M7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 20h8" {...s} />
        </>
      );
      break;
    case 'clock':
      body = (
        <>
          <Circle cx="12" cy="12" r="9" {...s} />
          <Path d="M12 7v5l3 2" {...s} />
        </>
      );
      break;
    case 'eye':
      body = (
        <>
          <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" {...s} />
          <Circle cx="12" cy="12" r="3" {...s} />
        </>
      );
      break;
    case 'sound':
      body = (
        <>
          <Path d="M4 9h4l5-4v14l-5-4H4z" {...s} />
          <Path d="M16.5 9a4 4 0 010 6M19 6.5a8 8 0 010 11" {...s} />
        </>
      );
      break;
    case 'vibrate':
      body = (
        <>
          <Rect x="8" y="3.5" width="8" height="17" rx="2" {...s} />
          <Path d="M4 8v8M20 8v8" {...s} />
        </>
      );
      break;
    case 'sun':
      body = (
        <>
          <Circle cx="12" cy="12" r="4" {...s} />
          <Path
            d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"
            {...s}
          />
        </>
      );
      break;
    case 'grid':
      body = (
        <>
          <Rect x="4" y="4" width="16" height="16" rx="2" {...s} />
          <Path d="M4 10h16M4 15h16M10 4v16" {...s} />
        </>
      );
      break;
  }
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no">
      {body}
    </Svg>
  );
}
