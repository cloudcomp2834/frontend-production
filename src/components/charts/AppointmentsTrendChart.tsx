import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { trendSeriesColor, chartChrome } from '../../theme/chartPalette';

interface AppointmentsTrendChartProps {
  data: { label: string; count: number }[];
}

export const AppointmentsTrendChart = ({ data }: AppointmentsTrendChartProps) => (
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid vertical={false} stroke={chartChrome.gridline} />
      <XAxis dataKey="label" tick={{ fontSize: 12, fill: chartChrome.mutedInk }} axisLine={{ stroke: chartChrome.axis }} tickLine={false} />
      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: chartChrome.mutedInk }} axisLine={false} tickLine={false} />
      <Tooltip cursor={{ fill: chartChrome.gridline }} />
      <Bar dataKey="count" name="Appointments" fill={trendSeriesColor} radius={[4, 4, 0, 0]} maxBarSize={36} />
    </BarChart>
  </ResponsiveContainer>
);
