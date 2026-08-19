const CATEGORY = {
  1: { g1: '#C85A35', g2: '#F2A07A', symbol: '◎', bg2: '#E8734A' }, // Cerámica
  2: { g1: '#7A5230', g2: '#C4884F', symbol: '⟁', bg2: '#A06838' }, // Carpintería
  3: { g1: '#2E7D6A', g2: '#5BAF9A', symbol: '⊛', bg2: '#3D9A84' }, // Tejido
  4: { g1: '#B8860B', g2: '#E8C040', symbol: '⬡', bg2: '#C89A1A' }, // Gastronomía
  5: { g1: '#5C3D2E', g2: '#9B6B50', symbol: '◈', bg2: '#7A5040' }, // Marroquinería
  6: { g1: '#9A6800', g2: '#D4A820', symbol: '◆', bg2: '#B88010' }, // Joyería
  7: { g1: '#7B3F7A', g2: '#C07FBE', symbol: '✦', bg2: '#9A5A98' }, // Arte textil
  8: { g1: '#4A7B5E', g2: '#7AAF8F', symbol: '✿', bg2: '#5A9470' }, // Otros
};

const DEFAULT = { g1: '#E8734A', g2: '#F2B830', symbol: '✦', bg2: '#ED9060' };

function ArtisanLogo({ nombre, id_categoria, size = 80 }) {
  const initial = (nombre || '?').charAt(0).toUpperCase();
  const cfg = CATEGORY[id_categoria] || DEFAULT;
  // stable SVG gradient ID based on category + name initial so it's unique per logo on the page
  const uid = `al_${id_categoria || 0}_${initial}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      style={{flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={cfg.g1} />
          <stop offset="100%" stopColor={cfg.g2} />
        </linearGradient>
      </defs>

      {/* background circle */}
      <circle cx="40" cy="40" r="40" fill={`url(#${uid})`} />

      {/* inner ring */}
      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />

      {/* category symbol watermark */}
      <text
        x="40" y="40"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.15)"
        fontSize="52"
        fontFamily="Georgia, serif"
      >
        {cfg.symbol}
      </text>

      {/* initial letter */}
      <text
        x="40" y="41"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="34"
        fontFamily="'DM Serif Display', Georgia, serif"
        fontWeight="bold"
      >
        {initial}
      </text>
    </svg>
  );
}

export default ArtisanLogo;
