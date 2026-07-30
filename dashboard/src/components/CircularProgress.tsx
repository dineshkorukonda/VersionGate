export function CircularProgress({ value = 0, size = 64, strokeWidth = 6 }: { value?: number, size?: number, strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="svg-progress-circle">
      <circle
        stroke="currentColor"
        fill="transparent"
        strokeWidth={strokeWidth}
        className="text-muted/30"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke="currentColor"
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-primary transition-all duration-500 ease-in-out"
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
}
