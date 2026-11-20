// オリジナル家紋「丸に四つ葉菱」（このゲームのために描いた図案）
// 外側の丸の中に、4枚の葉と中心の小さな丸がある、シンプルな形。
interface Props {
  color?: string;
}

export function Kamon({ color = 'currentColor' }: Props) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="7" />
      {[0, 90, 180, 270].map((deg) => (
        <path
          key={deg}
          d="M50 50 C 40 40, 40 24, 50 16 C 60 24, 60 40, 50 50 Z"
          fill={color}
          transform={`rotate(${deg + 45} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="5" fill="#f7f1e6" stroke={color} strokeWidth="3" />
    </svg>
  );
}
