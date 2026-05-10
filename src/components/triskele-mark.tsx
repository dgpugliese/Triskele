/**
 * Three-fold quorum mark for the landing hero.
 * Three keys arranged at 120° around a sealed center; subtle pulse animation.
 */
export function TriskeleMark({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5EE7FF" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#5EE7FF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#5EE7FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5EE7FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#5EE7FF" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Outer halo */}
        <circle cx="200" cy="200" r="180" fill="url(#core)" />

        {/* Concentric rings */}
        <circle
          cx="200"
          cy="200"
          r="160"
          stroke="url(#ring)"
          strokeWidth="1"
          strokeDasharray="2 6"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 200 200"
            to="360 200 200"
            dur="60s"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="200" cy="200" r="120" stroke="#1B222B" strokeWidth="1" />
        <circle cx="200" cy="200" r="80" stroke="#1B222B" strokeWidth="1" />

        {/* Three radial guardian arcs at 90°, 210°, 330° */}
        {[90, 210, 330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const cx = 200 + 130 * Math.cos(rad);
          const cy = 200 + 130 * Math.sin(rad);
          return (
            <g key={deg}>
              <line
                x1={200 + 80 * Math.cos(rad)}
                y1={200 + 80 * Math.sin(rad)}
                x2={cx}
                y2={cy}
                stroke="#5EE7FF"
                strokeOpacity="0.25"
                strokeWidth="1"
              />
              {/* Guardian node */}
              <circle cx={cx} cy={cy} r="14" fill="#0B0D10" stroke="#5EE7FF" strokeWidth="1.5" />
              <circle cx={cx} cy={cy} r="4" fill="#5EE7FF">
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="3s"
                  begin={`${i * 1}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}

        {/* Sealed center */}
        <circle cx="200" cy="200" r="38" fill="#0B0D10" stroke="#5EE7FF" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="38" fill="#0B0D10" stroke="#5EE7FF" strokeOpacity="0.3" strokeWidth="6" />
      </svg>

      {/* Center glyph */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="w-[76px] h-[76px] rounded-full bg-obsidian border border-cipher-blue/40 grid place-items-center shadow-cipher-glow">
          <span
            className="material-symbols-outlined text-cipher-blue text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            shield_lock
          </span>
        </div>
      </div>
    </div>
  );
}
