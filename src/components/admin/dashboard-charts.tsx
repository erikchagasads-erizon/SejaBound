'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = [
  'hsl(258, 90%, 66%)',   // violet
  'hsl(199, 89%, 48%)',   // sky
  'hsl(326, 85%, 60%)',   // pink
  'hsl(38, 92%, 50%)',    // amber
  'hsl(158, 64%, 52%)',   // emerald
  'hsl(0, 84%, 60%)',     // red
  'hsl(271, 81%, 56%)',   // purple
  'hsl(24, 94%, 60%)',    // orange
  'hsl(222, 47%, 60%)',   // slate
];

interface ChartData {
  name: string;
  value: number;
}

interface Props {
  data: ChartData[];
}

export function AdminDashboardCharts({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="empty-chart">
        <p>Nenhuma tarefa registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="charts-wrapper">
      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 17%)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(222, 47%, 8%)',
              border: '1px solid hsl(215, 28%, 17%)',
              borderRadius: '10px',
              color: 'hsl(210, 40%, 96%)',
              fontSize: '12px',
            }}
            cursor={{ fill: 'hsl(258, 90%, 66%, 0.08)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Pie chart */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(222, 47%, 8%)',
              border: '1px solid hsl(215, 28%, 17%)',
              borderRadius: '10px',
              color: 'hsl(210, 40%, 96%)',
              fontSize: '12px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: 'hsl(215, 20%, 65%)', fontSize: '11px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      <style jsx>{`
        .charts-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .empty-chart {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: hsl(var(--text-muted));
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
