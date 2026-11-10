export function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="120" fill="#E5484D" />
      <text
        x="50%"
        y="52%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="200"
        fill="#FFFFFF"
        letterSpacing="5"
      >
        YFC
      </text>
    </svg>
  );
}
