import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

const PALETTE = ['#4361ee', '#06d6a0', '#7209b7', '#f77f00', '#ef476f', '#3a86ff', '#118ab2', '#ffd166']

export default function Dashboard({ stats }) {
  const {
    industry_counts = [],
    salary_histogram = [],
    department_breakdown = [],
    status_counts = [],
    total_respondents = 0,
  } = stats

  const employed_ft = status_counts.find(s => s.status === 'Employed Full-time')?.count ?? 0
  const salariedRows = department_breakdown.filter(d => d.avg_salary > 0)
  const overallAvg = salariedRows.length
    ? Math.round(salariedRows.reduce((sum, d) => sum + d.avg_salary, 0) / salariedRows.length)
    : 0
  const ftRate = total_respondents ? ((employed_ft / total_respondents) * 100).toFixed(1) : '0.0'

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <KpiCard label="Total Respondents" value={total_respondents.toLocaleString()} accent="#4361ee" />
        <KpiCard label="Employed Full-time" value={employed_ft.toLocaleString()} accent="#06d6a0" />
        <KpiCard label="FT Employment Rate" value={`${ftRate}%`} accent="#7209b7" />
        <KpiCard label="Avg Starting Salary" value={overallAvg ? `$${overallAvg.toLocaleString()}` : '—'} accent="#f77f00" />
      </div>

      {/* Two charts side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <ChartCard title="Respondents by Industry">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={industry_counts}
              layout="vertical"
              margin={{ top: 4, right: 20, bottom: 4, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="industry" type="category" tick={{ fontSize: 11, fill: '#374151' }} width={110} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                cursor={{ fill: '#f0f4ff' }}
              />
              <Bar dataKey="count" name="Respondents" radius={[0, 4, 4, 0]}>
                {industry_counts.map((_, idx) => (
                  <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Salary Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salary_histogram} margin={{ top: 4, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                angle={-35}
                textAnchor="end"
                height={55}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                cursor={{ fill: '#f5f0ff' }}
              />
              <Bar dataKey="count" name="Graduates" fill="#7209b7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pie + Department table */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        <ChartCard title="Employment Status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={status_counts}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="45%"
                outerRadius={85}
                labelLine={false}
              >
                {status_counts.map((_, idx) => (
                  <Cell key={idx} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name) => [val, name]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend
                formatter={(v) => <span style={{ fontSize: '11px', color: '#374151' }}>{v}</span>}
                iconSize={10}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department Breakdown">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  {['Department', 'Graduates', 'FT Employed', 'FT Rate', 'Avg Salary'].map((h, i) => (
                    <th key={h} style={{
                      padding: '8px 12px',
                      textAlign: i === 0 ? 'left' : 'right',
                      color: '#6b7280', fontWeight: 500, fontSize: '12px',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {department_breakdown.map((row, i) => (
                  <tr key={row.department} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 500 }}>{row.department}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#374151' }}>{row.total}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#374151' }}>{row.employed}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                      <RateBadge pct={row.employed_pct} />
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', color: '#374151' }}>
                      {row.avg_salary ? `$${Number(row.avg_salary).toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

function KpiCard({ label, value, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${accent}`,
    }}>
      <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a2e' }}>{value}</p>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    }}>
      <h3 style={{ fontSize: '13px', marginBottom: '16px', color: '#374151', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function RateBadge({ pct }) {
  const bg = pct >= 70 ? '#dcfce7' : pct >= 40 ? '#fef9c3' : '#fee2e2'
  const color = pct >= 70 ? '#15803d' : pct >= 40 ? '#854d0e' : '#dc2626'
  return (
    <span style={{ background: bg, color, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
      {pct}%
    </span>
  )
}
