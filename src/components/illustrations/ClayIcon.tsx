import type { ReactNode } from 'react';

import { useSvgId } from './useSvgId';

/** Two-stop gradients (light top → saturated bottom) that give icons a clay look. */
const GRADIENTS = {
  lav: ['#d3c4ff', '#8a6cf0'],
  mint: ['#c2f7dd', '#42bf8a'],
  coral: ['#ffb7a8', '#e85d4c'],
  butter: ['#fff3ad', '#f0b02a'],
  sky: ['#cfe3ff', '#5a96f2'],
  pink: ['#ffd0e1', '#e56e9d'],
  peach: ['#ffdcc6', '#f08f58'],
  white: ['#ffffff', '#e2dcfa'],
} as const;

type Grad = keyof typeof GRADIENTS;
const NAVY = '#2b2966';

export type ClayIconName =
  | 'url'
  | 'text'
  | 'email'
  | 'phone'
  | 'sms'
  | 'whatsapp'
  | 'wifi'
  | 'vcard'
  | 'event'
  | 'location'
  | 'upi'
  | 'crypto';

type Paint = (g: Grad) => string;

const ICONS: Record<ClayIconName, (p: Paint) => ReactNode> = {
  url: (p) => (
    <>
      <rect
        x="5"
        y="17"
        width="24"
        height="13"
        rx="6.5"
        transform="rotate(-40 17 23.5)"
        fill="none"
        stroke={p('lav')}
        strokeWidth="6"
      />
      <rect
        x="19"
        y="18"
        width="24"
        height="13"
        rx="6.5"
        transform="rotate(-40 31 24.5)"
        fill="none"
        stroke={p('sky')}
        strokeWidth="6"
      />
      <path
        d="M9 21.5 15 15.5"
        stroke="#fff"
        strokeOpacity=".7"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  text: (p) => (
    <>
      <rect x="10" y="5" width="28" height="38" rx="8" fill={p('white')} />
      <rect x="16" y="13" width="16" height="4.5" rx="2.25" fill={p('lav')} />
      <rect x="16" y="21.5" width="11" height="4.5" rx="2.25" fill={p('coral')} />
      <rect x="16" y="30" width="14" height="4.5" rx="2.25" fill={p('mint')} />
      <rect x="13" y="7.5" width="9" height="2.6" rx="1.3" fill="#fff" />
    </>
  ),
  email: (p) => (
    <>
      <rect x="4" y="10" width="40" height="29" rx="9" fill={p('sky')} />
      <path
        d="M8 16 24 28 40 16"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="13" cy="13.5" rx="5" ry="1.6" fill="#fff" opacity=".6" />
    </>
  ),
  phone: (p) => (
    <>
      <rect x="12" y="3" width="24" height="42" rx="8" fill={p('mint')} />
      <rect x="15.5" y="8.5" width="17" height="27" rx="4" fill={p('white')} />
      <circle cx="24" cy="40" r="2.2" fill="#fff" />
      <path
        d="M19.5 15c.8-.8 2-.7 2.5.3l.8 1.8c.3.7 0 1.3-.6 1.7l-.6.4c.7 1.6 1.9 2.8 3.5 3.5l.4-.6c.4-.6 1-.9 1.7-.6l1.8.8c1 .5 1.1 1.7.3 2.5l-.8.8c-1 1-2.4 1.2-3.6.6-2.9-1.3-5.2-3.6-6.5-6.5-.6-1.2-.4-2.6.6-3.6z"
        fill={p('coral')}
      />
      <rect x="15" y="5.5" width="6" height="1.8" rx=".9" fill="#fff" opacity=".7" />
    </>
  ),
  sms: (p) => (
    <>
      <path
        d="M14 7h20a10 10 0 0 1 10 10v7a10 10 0 0 1-10 10H22l-9 8 1-8a10 10 0 0 1-10-10v-7A10 10 0 0 1 14 7z"
        fill={p('lav')}
      />
      <circle cx="15" cy="20.5" r="3.2" fill="#fff" />
      <circle cx="24" cy="20.5" r="3.2" fill="#fff" />
      <circle cx="33" cy="20.5" r="3.2" fill="#fff" />
      <ellipse cx="15" cy="10.5" rx="5" ry="1.6" fill="#fff" opacity=".55" />
    </>
  ),
  whatsapp: (p) => (
    <>
      <path
        d="M24 5a19 19 0 0 1 0 38c-3.3 0-6.4-.8-9.1-2.3L5 43l2.4-9.5A19 19 0 0 1 24 5z"
        fill={p('mint')}
      />
      <path
        d="M17.5 14.5c1-1 2.6-.9 3.2.4l1.1 2.4c.4.9 0 1.7-.7 2.2l-.8.6c1 2.1 2.6 3.7 4.7 4.7l.6-.8c.5-.7 1.3-1.1 2.2-.7l2.4 1.1c1.3.6 1.4 2.2.4 3.2l-1 1c-1.4 1.4-3.3 1.7-5 1-3.9-1.7-7-4.8-8.7-8.7-.7-1.7-.4-3.6 1-5z"
        fill="#fff"
      />
      <ellipse cx="17" cy="10.5" rx="6" ry="1.8" fill="#fff" opacity=".5" />
    </>
  ),
  wifi: (p) => (
    <>
      <path
        d="M6 19a26 26 0 0 1 36 0"
        fill="none"
        stroke={p('lav')}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M12.5 26.5a16 16 0 0 1 23 0"
        fill="none"
        stroke={p('sky')}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M19 33.5a7 7 0 0 1 10 0"
        fill="none"
        stroke={p('mint')}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="24" cy="40.5" r="4" fill={p('butter')} />
    </>
  ),
  vcard: (p) => (
    <>
      <rect x="3" y="9" width="42" height="30" rx="8" fill={p('peach')} />
      <circle cx="15" cy="21" r="5.5" fill={p('lav')} />
      <path d="M7 34a8 8 0 0 1 16 0z" fill={p('lav')} />
      <rect x="27" y="17" width="13" height="4" rx="2" fill="#fff" />
      <rect x="27" y="25" width="9" height="4" rx="2" fill="#fff" opacity=".8" />
      <ellipse cx="11" cy="12.5" rx="5" ry="1.5" fill="#fff" opacity=".6" />
    </>
  ),
  event: (p) => (
    <>
      <rect x="5" y="8" width="38" height="35" rx="9" fill={p('white')} />
      <path d="M14 8h20a9 9 0 0 1 9 9v2H5v-2a9 9 0 0 1 9-9z" fill={p('coral')} />
      <rect x="13" y="4" width="5" height="9" rx="2.5" fill={NAVY} />
      <rect x="30" y="4" width="5" height="9" rx="2.5" fill={NAVY} />
      <circle cx="14" cy="27" r="3" fill={p('lav')} />
      <circle cx="24" cy="27" r="3" fill={p('mint')} />
      <circle cx="34" cy="27" r="3" fill={p('sky')} />
      <circle cx="14" cy="35.5" r="3" fill={p('butter')} />
      <circle cx="24" cy="35.5" r="3" fill={p('pink')} />
      <circle cx="34" cy="35.5" r="3" fill={p('peach')} />
    </>
  ),
  location: (p) => (
    <>
      <ellipse cx="24" cy="43" rx="10" ry="2.8" fill={NAVY} opacity=".15" />
      <path
        d="M24 3c-8.6 0-15.5 6.7-15.5 15C8.5 29 24 42 24 42s15.5-13 15.5-24C39.5 9.7 32.6 3 24 3z"
        fill={p('coral')}
      />
      <circle cx="24" cy="18" r="6.5" fill="#fff" />
      <ellipse
        cx="16"
        cy="10"
        rx="3"
        ry="4.5"
        transform="rotate(30 16 10)"
        fill="#fff"
        opacity=".45"
      />
    </>
  ),
  upi: (p) => (
    <>
      <circle cx="24" cy="24" r="19" fill={p('butter')} />
      <circle
        cx="24"
        cy="24"
        r="14"
        fill="none"
        stroke="#fff"
        strokeOpacity=".65"
        strokeWidth="2"
      />
      <text
        x="24"
        y="25"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="20"
        fontWeight="900"
        fill="#b0760a"
        fontFamily="var(--font-sans)"
      >
        ₹
      </text>
      <ellipse
        cx="15"
        cy="12.5"
        rx="5"
        ry="2"
        transform="rotate(-30 15 12.5)"
        fill="#fff"
        opacity=".6"
      />
    </>
  ),
  crypto: (p) => (
    <>
      <circle cx="24" cy="24" r="19" fill={p('peach')} />
      <circle
        cx="24"
        cy="24"
        r="14"
        fill="none"
        stroke="#fff"
        strokeOpacity=".65"
        strokeWidth="2"
      />
      <text
        x="24"
        y="25"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="20"
        fontWeight="900"
        fill="#b0521c"
        fontFamily="var(--font-sans)"
      >
        ₿
      </text>
      <ellipse
        cx="15"
        cy="12.5"
        rx="5"
        ry="2"
        transform="rotate(-30 15 12.5)"
        fill="#fff"
        opacity=".6"
      />
    </>
  ),
};

interface ClayIconProps {
  name: ClayIconName;
  size?: number;
}

/** Colourful 3D-style icon with soft gradients, gloss and a drop shadow. */
export function ClayIcon({ name, size = 40 }: ClayIconProps) {
  const id = useSvgId('ci');
  const paint: Paint = (g) => `url(#${id(g)})`;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" overflow="visible">
      <defs>
        {(Object.keys(GRADIENTS) as Grad[]).map((g) => (
          <linearGradient key={g} id={id(g)} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor={GRADIENTS[g][0]} />
            <stop offset="1" stopColor={GRADIENTS[g][1]} />
          </linearGradient>
        ))}
        <filter id={id('shadow')} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="2.2" stdDeviation="1.6" floodColor={NAVY} floodOpacity=".22" />
        </filter>
      </defs>
      <g filter={`url(#${id('shadow')})`}>{ICONS[name](paint)}</g>
    </svg>
  );
}
