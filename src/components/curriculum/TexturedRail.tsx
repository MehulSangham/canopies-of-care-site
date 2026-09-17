import { CSSProperties } from 'react';

interface TexturedRailProps {
  className?: string;
  color?: string;
  shadowColor?: string;
  style?: CSSProperties;
}

interface TexturedDotProps {
  className?: string;
  color?: string;
  shadowColor?: string;
  style?: CSSProperties;
}

interface TexturedLineProps {
  className?: string;
  color?: string;
  shadowColor?: string;
  style?: CSSProperties;
}

function buildRoughRailPath() {
  const left: string[] = [];
  const right: string[] = [];

  for (let step = 0; step <= 50; step += 1) {
    const y = step * 2;
    const leftX =
      2.1 +
      0.14 * Math.sin(y * 0.32) +
      0.08 * Math.sin(y * 0.91 + 0.4) +
      0.05 * Math.sin(y * 2.2 + 0.9);
    const rightX =
      3.9 +
      0.15 * Math.sin(y * 0.28 + 1.2) +
      0.08 * Math.sin(y * 1.07 + 0.6) +
      0.05 * Math.sin(y * 2.45 + 0.1);

    left.push(`${step === 0 ? 'M' : 'L'} ${leftX.toFixed(2)} ${y.toFixed(2)}`);
    right.push(`L ${rightX.toFixed(2)} ${y.toFixed(2)}`);
  }

  return `${left.join(' ')} ${right.reverse().join(' ')} Z`;
}

function buildRoughDotPath() {
  const points: string[] = [];

  for (let step = 0; step <= 24; step += 1) {
    const theta = (Math.PI * 2 * step) / 24;
    const radius =
      4.15 +
      0.3 * Math.sin(theta * 3 + 0.4) +
      0.18 * Math.sin(theta * 7 + 1.1) +
      0.1 * Math.sin(theta * 11 + 0.2);
    const x = 6 + Math.cos(theta) * radius;
    const y = 6 + Math.sin(theta) * radius;
    points.push(`${step === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return `${points.join(' ')} Z`;
}

function buildRoughLineStrokePath() {
  const points: string[] = [];

  for (let step = 0; step <= 100; step += 1) {
    const x = step;
    const y =
      3 +
      0.04 * Math.sin(x * 0.24) +
      0.03 * Math.sin(x * 0.73 + 0.4) +
      0.02 * Math.sin(x * 1.9 + 0.9) +
      0.015 * Math.sin(x * 3.1 + 1.1);
    points.push(`${step === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return points.join(' ');
}

const roughRailPath = buildRoughRailPath();
const roughDotPath = buildRoughDotPath();
const roughLineStrokePath = buildRoughLineStrokePath();

export function TexturedRail({
  className = '',
  color = 'rgba(0, 0, 60, 0.18)',
  shadowColor = 'transparent',
  style,
}: TexturedRailProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={style}
      viewBox="0 0 6 100"
      preserveAspectRatio="none"
    >
      {shadowColor !== 'transparent' ? (
        <path d={roughRailPath} fill={shadowColor} transform="translate(0.45 0)" />
      ) : null}
      <path d={roughRailPath} fill={color} />
    </svg>
  );
}

export function TexturedDot({
  className = '',
  color = 'rgba(0, 0, 60, 0.35)',
  shadowColor = 'transparent',
  style,
}: TexturedDotProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={style}
      viewBox="0 0 12 12"
      preserveAspectRatio="xMidYMid meet"
    >
      {shadowColor !== 'transparent' ? (
        <path d={roughDotPath} fill={shadowColor} transform="translate(0.35 0.35)" />
      ) : null}
      <path d={roughDotPath} fill={color} />
    </svg>
  );
}

export function TexturedLine({
  className = '',
  color = 'rgba(0, 0, 60, 1)',
  shadowColor = 'transparent',
  style,
}: TexturedLineProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={style}
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
    >
      {shadowColor !== 'transparent' ? (
        <path
          d={roughLineStrokePath}
          fill="none"
          stroke={shadowColor}
          strokeWidth="2.35"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          transform="translate(0 0.2)"
        />
      ) : null}
      <path
        d={roughLineStrokePath}
        fill="none"
        stroke={color}
        strokeWidth="2.35"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
