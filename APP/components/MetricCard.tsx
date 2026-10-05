/**
 * Card de métrica estilo iOS - Para dashboard de inversionista
 * Design: Clean, escaneable, información densa pero clara
 */

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  onClick?: () => void;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  red: 'from-red-500 to-red-600',
  amber: 'from-amber-500 to-amber-600',
  purple: 'from-purple-500 to-purple-600',
};

const trendIcons = {
  up: '↗',
  down: '↘',
  neutral: '→',
};

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = 'blue',
  onClick,
}: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-3xl p-6 shadow-sm
        border border-gray-100
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>

        {icon && (
          <div className={`
            w-12 h-12 rounded-2xl
            bg-gradient-to-br ${colorClasses[color]}
            flex items-center justify-center
            text-white text-xl
            shadow-lg
          `}>
            {icon}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2">
        {trend && trendValue && (
          <span
            className={`
              inline-flex items-center gap-1
              text-xs font-semibold px-2 py-1 rounded-lg
              ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : ''}
              ${trend === 'down' ? 'bg-red-50 text-red-700' : ''}
              ${trend === 'neutral' ? 'bg-gray-50 text-gray-700' : ''}
            `}
          >
            {trendIcons[trend]} {trendValue}
          </span>
        )}

        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Card compacto para listas
 */
interface CompactMetricProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export function CompactMetric({ label, value, icon, color = '#6b7280' }: CompactMetricProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="text-xl" style={{ color }}>
            {icon}
          </span>
        )}
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}
