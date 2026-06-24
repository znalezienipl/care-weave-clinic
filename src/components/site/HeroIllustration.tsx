interface Props {
  className?: string;
}

/**
 * Abstract healthcare illustration — soft organic shapes evoking care, calm and femininity.
 * Pure SVG, design-token colors only. No stock imagery.
 */
export function HeroIllustration({ className }: Props) {
  return (
    <svg
      viewBox="0 0 560 560"
      role="img"
      aria-label="Abstrakcyjna ilustracja prywatnej opieki ginekologicznej"
      className={className}
    >
      <defs>
        <radialGradient id="petal" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="oklch(0.93 0.02 35)" />
          <stop offset="100%" stopColor="oklch(0.84 0.03 30)" />
        </radialGradient>
        <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.42 0.05 235)" />
          <stop offset="100%" stopColor="oklch(0.55 0.04 230)" />
        </linearGradient>
      </defs>
      <circle cx="280" cy="280" r="240" fill="oklch(0.97 0.008 80)" />
      <circle cx="280" cy="280" r="180" fill="none" stroke="url(#ring)" strokeOpacity="0.18" strokeWidth="1.5" />
      <circle cx="280" cy="280" r="130" fill="none" stroke="url(#ring)" strokeOpacity="0.25" strokeWidth="1.5" />
      {/* Soft petals */}
      <g transform="translate(280 280)">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-110"
            rx="56"
            ry="120"
            fill="url(#petal)"
            opacity="0.55"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
      <circle cx="280" cy="280" r="42" fill="oklch(0.36 0.04 235)" />
      <circle cx="280" cy="280" r="42" fill="none" stroke="oklch(1 0 0 / 0.5)" strokeWidth="1" />
      <circle cx="280" cy="280" r="14" fill="oklch(0.86 0.025 35)" />
      {/* Tiny accent dots */}
      <circle cx="110" cy="170" r="4" fill="oklch(0.55 0.035 230)" />
      <circle cx="460" cy="200" r="3" fill="oklch(0.55 0.035 230)" />
      <circle cx="430" cy="420" r="5" fill="oklch(0.86 0.025 35)" />
      <circle cx="120" cy="410" r="3" fill="oklch(0.86 0.025 35)" />
    </svg>
  );
}
