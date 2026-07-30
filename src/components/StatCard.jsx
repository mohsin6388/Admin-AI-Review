export default function StatCard({ label, value, sub, tone = 'default', icon }) {
  const toneMap = {
    default: 'bg-white',
    good: 'bg-white',
    bad: 'bg-white',
  };

  return (
    <div className={`rounded-2xl border border-gray-200 p-5 ${toneMap[tone]} shadow-sm`}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <div className="text-accent">{icon}</div>}
      </div>
      <p className="mt-2 text-2xl lg:text-3xl font-bold text-ink tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
