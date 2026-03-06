'use client';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-105"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{
            backgroundColor: `${color}33`,
            color: color,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
