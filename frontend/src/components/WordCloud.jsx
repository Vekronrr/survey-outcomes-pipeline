const COLORS = [
  '#4361ee', '#7209b7', '#3a86ff', '#f77f00', '#06d6a0',
  '#ef476f', '#118ab2', '#ffd166', '#e63946', '#2ec4b6',
  '#ff9f1c', '#cbf3f0', '#9b5de5', '#f15bb5', '#00bbf9',
]

export default function WordCloud({ frequencies }) {
  if (!frequencies || frequencies.length === 0) {
    return (
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '60px',
        textAlign: 'center', color: '#6b7280', fontSize: '14px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        No open-response data found. Make sure your CSV has an <strong>open_response</strong> column.
      </div>
    )
  }

  const cloud = frequencies.slice(0, 50)
  const table = frequencies.slice(0, 24)

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Visual word cloud */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        borderRadius: '16px',
        padding: '40px 32px',
        minHeight: '320px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px 18px',
        alignContent: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        {cloud.map((word, i) => {
          const color = COLORS[i % COLORS.length]
          return (
            <span
              key={word.text}
              title={`"${word.text}" — ${word.value} occurrence${word.value !== 1 ? 's' : ''}`}
              style={{
                fontSize: `${word.size}px`,
                color,
                fontWeight: word.size > 40 ? 800 : word.size > 28 ? 600 : 400,
                lineHeight: 1.1,
                cursor: 'default',
                letterSpacing: word.size > 40 ? '-0.5px' : 'normal',
                textShadow: word.size > 40 ? `0 0 20px ${color}40` : 'none',
                transition: 'opacity 0.2s',
                userSelect: 'none',
              }}
            >
              {word.text}
            </span>
          )
        })}
      </div>

      {/* Top keywords grid */}
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <h3 style={{
          fontSize: '13px', marginBottom: '16px', color: '#374151',
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          Top Keywords
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          {table.map((word, i) => {
            const color = COLORS[i % COLORS.length]
            const barWidth = Math.round((word.value / frequencies[0].value) * 100)
            return (
              <div key={word.text} style={{
                background: '#f8fafc', borderRadius: '8px', padding: '10px 12px',
                borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', marginRight: '5px' }}>#{i + 1}</span>
                    {word.text}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color }}>{word.value}</span>
                </div>
                <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${barWidth}%`, background: color, borderRadius: '2px' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
