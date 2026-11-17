import styles from './Mascots.module.css';
import { useSvgId } from './useSvgId';

const NAVY = '#2b2966';

/** Points for a five-pointed star centred on (cx, cy). */
function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

interface MascotProps {
  size?: number;
  className?: string;
}

/** A finder-pattern eye: navy rounded ring, pupil and a glint. */
function FinderEye({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 16} y={cy - 16} width="32" height="32" rx="10" fill={NAVY} />
      <rect x={cx - 10.5} y={cy - 10.5} width="21" height="21" rx="6.5" fill="#fff" />
      <rect x={cx - 6.5} y={cy - 6.5} width="13" height="13" rx="4.5" fill={NAVY} />
      <circle cx={cx + 2.6} cy={cy - 2.8} r="2.6" fill="#fff" />
    </g>
  );
}

/** "Quibi", the QR buddy: a lavender clay character whose eyes are finder patterns. */
export function QrBuddy({ size = 220, className }: MascotProps) {
  const id = useSvgId('qb');
  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Quibi, a friendly QR code character, waving"
    >
      <defs>
        <linearGradient id={id('body')} x1="0.1" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#ddd0ff" />
          <stop offset="0.55" stopColor="#b39cfb" />
          <stop offset="1" stopColor="#8466ea" />
        </linearGradient>
        <linearGradient id={id('face')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ebe6fb" />
        </linearGradient>
        <radialGradient id={id('ball')} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fff6c4" />
          <stop offset="1" stopColor="#f2b52c" />
        </radialGradient>
        <filter id={id('soft')} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#6b4fd6" floodOpacity=".28" />
        </filter>
      </defs>

      {/* confetti */}
      <polygon
        points={starPoints(38, 52, 11, 5)}
        fill="#ffd95a"
        stroke="#ffd95a"
        strokeWidth="3"
        strokeLinejoin="round"
        className={styles.twinkle}
      />
      <polygon
        points={starPoints(212, 150, 8, 3.6)}
        fill="#ff9d8a"
        stroke="#ff9d8a"
        strokeWidth="2"
        strokeLinejoin="round"
        className={styles.twinkleSlow}
      />
      <circle cx="26" cy="148" r="6" fill="#9fe8c6" />
      <circle cx="196" cy="34" r="5" fill="#ffb6d1" />
      <rect
        x="200"
        y="196"
        width="12"
        height="7"
        rx="3.5"
        transform="rotate(-30 206 199)"
        fill="#a9ccff"
      />
      <rect
        x="22"
        y="196"
        width="10"
        height="6"
        rx="3"
        transform="rotate(25 27 199)"
        fill="#ffd95a"
      />

      <ellipse cx="120" cy="224" rx="60" ry="8" fill={NAVY} opacity=".12" />

      <g className={styles.bob}>
        <g filter={`url(#${id('soft')})`}>
          {/* feet */}
          <ellipse cx="96" cy="205" rx="19" ry="11" fill={`url(#${id('body')})`} />
          <ellipse cx="144" cy="205" rx="19" ry="11" fill={`url(#${id('body')})`} />
          {/* resting arm */}
          <path
            d="M60 128 44 160"
            stroke={`url(#${id('body')})`}
            strokeWidth="17"
            strokeLinecap="round"
          />
          {/* antenna */}
          <path d="M120 44V24" stroke="#8466ea" strokeWidth="5" strokeLinecap="round" />
          <circle cx="120" cy="19" r="10" fill={`url(#${id('ball')})`} />
          <ellipse cx="116.5" cy="15" rx="3.5" ry="2.2" fill="#fff" opacity=".8" />
          {/* body */}
          <rect x="52" y="40" width="136" height="160" rx="48" fill={`url(#${id('body')})`} />
          {/* waving arm */}
          <g className={styles.wave}>
            <path
              d="M180 124 203 82"
              stroke={`url(#${id('body')})`}
              strokeWidth="17"
              strokeLinecap="round"
            />
            <circle cx="205" cy="77" r="12" fill="#c7b5ff" />
          </g>
        </g>

        {/* gloss */}
        <ellipse
          cx="90"
          cy="62"
          rx="26"
          ry="10"
          transform="rotate(-18 90 62)"
          fill="#fff"
          opacity=".5"
        />

        {/* face screen */}
        <rect x="70" y="64" width="100" height="106" rx="30" fill={`url(#${id('face')})`} />
        <FinderEye cx={99} cy={100} />
        <FinderEye cx={141} cy={100} />
        <ellipse cx="86" cy="127" rx="8" ry="5" fill="#ffadc8" opacity=".85" />
        <ellipse cx="154" cy="127" rx="8" ry="5" fill="#ffadc8" opacity=".85" />
        <path d="M107 126q13 15 26 0z" fill={NAVY} />
        <ellipse cx="120" cy="132" rx="5" ry="3" fill="#ff8f86" />
        {/* QR freckles */}
        <g fill={NAVY} opacity=".85">
          <rect x="86" y="146" width="6" height="6" rx="2" />
          <rect x="96" y="152" width="6" height="6" rx="2" />
          <rect x="112" y="148" width="6" height="6" rx="2" />
          <rect x="128" y="153" width="6" height="6" rx="2" />
          <rect x="140" y="146" width="6" height="6" rx="2" />
          <rect x="150" y="153" width="6" height="6" rx="2" />
        </g>
      </g>
    </svg>
  );
}

/** A happy butter-yellow star, used when a code is ready to scan. */
export function StarBuddy({ size = 36, className }: MascotProps) {
  const id = useSvgId('sb');
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id('g')} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff4b8" />
          <stop offset="1" stopColor="#f2b229" />
        </radialGradient>
      </defs>
      <polygon
        points={starPoints(32, 35, 27, 13.5)}
        fill={`url(#${id('g')})`}
        stroke="#f6c443"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <ellipse
        cx="22"
        cy="20"
        rx="4.5"
        ry="2.4"
        transform="rotate(-35 22 20)"
        fill="#fff"
        opacity=".7"
      />
      <ellipse cx="26" cy="34" rx="2.6" ry="3.4" fill={NAVY} />
      <ellipse cx="38" cy="34" rx="2.6" ry="3.4" fill={NAVY} />
      <circle cx="27" cy="32.8" r="1" fill="#fff" />
      <circle cx="39" cy="32.8" r="1" fill="#fff" />
      <ellipse cx="21" cy="40" rx="3" ry="1.8" fill="#ff9fb8" opacity=".8" />
      <ellipse cx="43" cy="40" rx="3" ry="1.8" fill="#ff9fb8" opacity=".8" />
      <path
        d="M28 40q4 4.5 8 0"
        fill="none"
        stroke={NAVY}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A curious mint monster for empty and error states. */
export function BlobBuddy({ size = 120, className }: MascotProps) {
  const id = useSvgId('bb');
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id('g')} x1="0.2" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#c8f8df" />
          <stop offset="1" stopColor="#4cc290" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="112" rx="30" ry="4.5" fill={NAVY} opacity=".12" />
      <path d="M45 28 37 11M75 28l8-17" stroke="#3fae80" strokeWidth="4" strokeLinecap="round" />
      <circle cx="36" cy="9" r="6" fill="#ffd95a" />
      <circle cx="84" cy="9" r="6" fill="#ff9d8a" />
      <ellipse cx="22" cy="74" rx="8" ry="11" transform="rotate(20 22 74)" fill="#5ccb9b" />
      <ellipse cx="98" cy="74" rx="8" ry="11" transform="rotate(-20 98 74)" fill="#5ccb9b" />
      <path
        d="M60 20c25 0 40 19 40 45 0 25-15 42-40 42S20 90 20 65c0-26 15-45 40-45z"
        fill={`url(#${id('g')})`}
      />
      <ellipse
        cx="43"
        cy="33"
        rx="9"
        ry="4.5"
        transform="rotate(-25 43 33)"
        fill="#fff"
        opacity=".55"
      />
      <circle cx="47" cy="58" r="11.5" fill="#fff" />
      <circle cx="73" cy="58" r="11.5" fill="#fff" />
      <circle cx="49" cy="60" r="6.5" fill={NAVY} />
      <circle cx="71" cy="60" r="6.5" fill={NAVY} />
      <circle cx="51" cy="57.5" r="2.2" fill="#fff" />
      <circle cx="73" cy="57.5" r="2.2" fill="#fff" />
      <ellipse cx="36" cy="76" rx="5" ry="3" fill="#ff9fb8" opacity=".75" />
      <ellipse cx="84" cy="76" rx="5" ry="3" fill="#ff9fb8" opacity=".75" />
      <ellipse cx="60" cy="81" rx="6" ry="7" fill={NAVY} />
      <ellipse cx="60" cy="84.5" rx="3.5" ry="2.5" fill="#ff8f86" />
    </svg>
  );
}
