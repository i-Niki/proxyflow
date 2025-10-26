/**
 * Stats Card Component
 * Displays a single statistic with icon
 */

import { Card } from '../common';

export default function StatsCard({ 
  icon, 
  title, 
  value, 
  subtitle,
  color = 'blue' 
}) {
  const colors = {
    blue: 'text-blue-500 bg-blue-500',
    purple: 'text-purple-500 bg-purple-500',
    green: 'text-green-500 bg-green-500',
    red: 'text-red-500 bg-red-500',
    yellow: 'text-yellow-500 bg-yellow-500',
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]} bg-opacity-20`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}