import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getStatusColor } from '../../theme/colors';

interface StatusBreakdownChartProps {
  data: { status: string; count: number }[];
}

export const StatusBreakdownChart = ({ data }: StatusBreakdownChartProps) => {
  const chartData = data.filter((d) => d.count > 0);

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No appointment data yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="status"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={getStatusColor(entry.status).hex} />
          ))}
        </Pie>
        <Tooltip />
        <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
};
