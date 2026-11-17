import { contrastRatio, luminance, safeColor } from './color';
import { isUnderLogo, logoArea } from './logo';
import { isFinderModule } from './matrix';
import { paintColors } from './paint';
import { SCALABLE_DOT_STYLES } from './shapes';
import type { ErrorCorrectionLevel, QrDesign, QrMatrix } from './types';

export type HealthLevel = 'good' | 'warn' | 'bad';

export interface HealthCheck {
  id: 'contrast' | 'polarity' | 'logo' | 'quiet-zone' | 'dot-size' | 'density';
  level: HealthLevel;
  title: string;
  detail: string;
}

export interface HealthReport {
  level: HealthLevel;
  checks: HealthCheck[];
}

/** Share of codewords each level can recover. */
export const RECOVERY_CAPACITY: Record<ErrorCorrectionLevel, number> = {
  L: 0.07,
  M: 0.15,
  Q: 0.25,
  H: 0.3,
};

const RANK: Record<HealthLevel, number> = { good: 0, warn: 1, bad: 2 };

function foregroundColors(design: QrDesign): string[] {
  const colors = paintColors(design.dots.paint);
  if (!design.eyeFrame.inherit) colors.push(...paintColors(design.eyeFrame.paint));
  if (!design.eyeBall.inherit) colors.push(...paintColors(design.eyeBall.paint));
  return colors;
}

/** Fraction of data modules hidden or covered by the logo. */
export function logoCoverage(matrix: QrMatrix, design: QrDesign): number {
  const area = logoArea(matrix.size, design.logo);
  if (!area) return 0;
  let covered = 0;
  let total = 0;
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      if (isFinderModule(row, col, matrix.size)) continue;
      total++;
      if (isUnderLogo(row, col, area)) covered++;
    }
  }
  return total === 0 ? 0 : covered / total;
}

/** Heuristic scannability report for a design. */
export function assessScannability(matrix: QrMatrix, design: QrDesign): HealthReport {
  const checks: HealthCheck[] = [];
  const fg = foregroundColors(design);
  const bg = design.background.transparent
    ? ['#ffffff']
    : paintColors(design.background.paint).map((c) => safeColor(c));

  const minContrast = Math.min(...fg.flatMap((f) => bg.map((b) => contrastRatio(f, b))));
  checks.push({
    id: 'contrast',
    level: minContrast >= 4 ? 'good' : minContrast >= 2.5 ? 'warn' : 'bad',
    title: `Contrast ${minContrast.toFixed(1)}:1`,
    detail: design.background.transparent
      ? 'Measured against white. Place transparent codes on a plain, light surface.'
      : minContrast >= 4
        ? 'Strong contrast between code and background.'
        : 'Increase the difference between the code colour and the background.',
  });

  const avg = (list: string[]) => list.reduce((s, c) => s + luminance(c), 0) / list.length;
  const inverted = avg(fg) > avg(bg);
  checks.push({
    id: 'polarity',
    level: inverted ? 'warn' : 'good',
    title: inverted ? 'Inverted colours' : 'Dark on light',
    detail: inverted
      ? 'Light codes on dark backgrounds are not read by some older scanners.'
      : 'Standard polarity works with every scanner.',
  });

  if (design.logo.src) {
    const coverage = logoCoverage(matrix, design);
    const capacity = RECOVERY_CAPACITY[design.errorCorrection];
    const load = coverage / capacity;
    checks.push({
      id: 'logo',
      level: load <= 0.55 ? 'good' : load <= 0.85 ? 'warn' : 'bad',
      title: `Logo covers ${(coverage * 100).toFixed(0)}%`,
      detail:
        load <= 0.55
          ? `Well within what level ${design.errorCorrection} can recover.`
          : `Close to the ${(capacity * 100).toFixed(0)}% level ${design.errorCorrection} can recover. Shrink the logo or raise error correction.`,
    });
  }

  const margin = Math.round(design.margin);
  checks.push({
    id: 'quiet-zone',
    level: margin >= 2 ? 'good' : margin === 1 ? 'warn' : 'bad',
    title: `Quiet zone ${margin}`,
    detail:
      margin >= 2
        ? 'Enough empty space around the code.'
        : 'Scanners need a blank border. Use a margin of at least 2.',
  });

  if (SCALABLE_DOT_STYLES.has(design.dots.style)) {
    const scale = design.dots.scale;
    checks.push({
      id: 'dot-size',
      level: scale >= 0.75 ? 'good' : scale >= 0.6 ? 'warn' : 'bad',
      title: `Dot size ${Math.round(scale * 100)}%`,
      detail: scale >= 0.75 ? 'Modules are large enough.' : 'Small modules are harder to read.',
    });
  }

  checks.push({
    id: 'density',
    level: matrix.version <= 15 ? 'good' : 'warn',
    title: `Version ${matrix.version} · ${matrix.size}×${matrix.size}`,
    detail:
      matrix.version <= 15
        ? 'Comfortable density.'
        : 'Dense code. Print it larger or shorten the content.',
  });

  const level = checks.reduce<HealthLevel>(
    (worst, c) => (RANK[c.level] > RANK[worst] ? c.level : worst),
    'good',
  );
  return { level, checks };
}
