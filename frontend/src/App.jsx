import { useRef, useState } from 'react'
import axios from 'axios'
import Dashboard from './components/Dashboard'
import WordCloud from './components/WordCloud'

const C = {
  primary: '#4361ee',
  success: '#06d6a0',
  bg: '#f0f2f5',
  card: '#ffffff',
  text: '#1a1a2e',
  muted: '#6b7280',
}

export default function App() {
  const [step, setStep] = useState('idle')
  const [uploadInfo, setUploadInfo] = useState(null)
  const [cleanReport, setCleanReport] = useState(null)
  const [stats, setStats] = useState(null)
  const [wordFreqs, setWordFreqs] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleUpload = async (file) => {
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post('/api/upload', formData)
      setUploadInfo(res.data)
      setCleanReport(null)
      setStats(null)
      setWordFreqs(null)
      setStep('uploaded')
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Check the file and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSample = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get('/api/sample')
      setUploadInfo(res.data)
      setCleanReport(null)
      setStats(null)
      setWordFreqs(null)
      setStep('uploaded')
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not load sample data.')
    } finally {
      setLoading(false)
    }
  }

  const handleClean = async () => {
    setLoading(true)
    setError(null)
    try {
      const cleanRes = await axios.post('/api/clean')
      setCleanReport(cleanRes.data.report)

      const [statsRes, wordRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/wordcloud'),
      ])
      setStats(statsRes.data)
      setWordFreqs(wordRes.data.frequencies)
      setStep('cleaned')
    } catch (e) {
      setError(e.response?.data?.detail || 'Cleaning failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setError(null)
    try {
      const res = await axios.get('/api/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'salesforce_ready.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Export failed. Make sure data has been cleaned first.')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const stepIndex = { idle: 0, uploaded: 1, cleaned: 2 }[step]

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <header style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff',
        padding: '18px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>
        <div>
          <h1 style={{ fontSize: '20px', letterSpacing: '-0.3px' }}>Survey Outcomes Pipeline</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Career outcomes data cleaning &amp; visualization
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {['Upload', 'Clean', 'Analyze'].map((label, i) => {
            const done = i < stepIndex
            const active = i === stepIndex
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: done ? C.success : active ? C.primary : '#2d3748',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700,
                }}>
                  {done ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '12px', marginLeft: '5px', color: done || active ? '#e2e8f0' : '#64748b' }}>
                  {label}
                </span>
                {i < 2 && (
                  <div style={{ width: '20px', height: '2px', background: done ? C.success : '#2d3748', margin: '0 8px' }} />
                )}
              </div>
            )
          })}
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
            padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px' }}>×</button>
          </div>
        )}

        {step === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '48px' }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? C.primary : '#93c5fd'}`,
                borderRadius: '16px',
                padding: '64px 80px',
                textAlign: 'center',
                background: dragOver ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                width: '100%',
                maxWidth: '520px',
                transition: 'all 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>📊</div>
              <h2 style={{ fontSize: '18px', marginBottom: '8px', color: C.text }}>
                Drop your survey CSV here
              </h2>
              <p style={{ color: C.muted, fontSize: '14px' }}>
                Qualtrics exports, Google Forms, or any CSV with survey data
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0', color: C.muted }}>
              <div style={{ height: '1px', width: '100px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '13px' }}>or try the sample dataset</span>
              <div style={{ height: '1px', width: '100px', background: '#e5e7eb' }} />
            </div>

            <button
              onClick={handleSample}
              disabled={loading}
              style={btnStyle(C.primary, loading)}
            >
              {loading ? 'Loading…' : 'Load Sample Dataset'}
            </button>
          </div>
        )}

        {step === 'uploaded' && (
          <div>
            <Card>
              <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>File Loaded Successfully</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <MiniStat label="Filename" value={uploadInfo?.filename ?? '—'} />
                <MiniStat label="Rows" value={uploadInfo?.rows?.toLocaleString() ?? '—'} />
                <MiniStat label="Columns" value={uploadInfo?.columns?.length ?? '—'} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: C.muted, marginBottom: '8px' }}>Detected columns:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {uploadInfo?.columns?.map((col) => (
                    <span key={col} style={{
                      background: '#eff6ff', color: '#1d4ed8',
                      borderRadius: '4px', padding: '3px 8px', fontSize: '12px', fontWeight: 500,
                    }}>{col}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={handleClean} disabled={loading} style={btnStyle(C.success, loading)}>
                  {loading ? 'Cleaning…' : 'Clean & Analyze Data'}
                </button>
                <button onClick={() => { setStep('idle'); setUploadInfo(null) }} style={btnStyle('#6b7280', false)}>
                  Upload Different File
                </button>
              </div>
            </Card>
          </div>
        )}

        {step === 'cleaned' && stats && (
          <div>
            {cleanReport && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px',
                padding: '14px 20px', marginBottom: '20px', fontSize: '13px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
              }}>
                <div>
                  <strong style={{ color: '#15803d' }}>Data cleaned successfully.</strong>
                  {' '}
                  <span style={{ color: '#166534' }}>
                    {cleanReport.duplicate_ids_removed > 0 && `${cleanReport.duplicate_ids_removed} duplicate IDs removed. `}
                    {cleanReport.invalid_salaries_nulled > 0 && `${cleanReport.invalid_salaries_nulled} invalid salaries nulled. `}
                    {cleanReport.empty_rows_dropped > 0 && `${cleanReport.empty_rows_dropped} empty rows dropped. `}
                    {cleanReport.final_rows} rows ready for analysis.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleExport} style={btnStyle('#15803d', false, '12px')}>
                    Export Salesforce CSV ↓
                  </button>
                  <button onClick={() => { setStep('idle'); setUploadInfo(null); setStats(null) }} style={btnStyle('#6b7280', false, '12px')}>
                    Start Over
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
              {[['dashboard', 'Dashboard'], ['wordcloud', 'Word Cloud']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  style={{
                    padding: '8px 22px', borderRadius: '8px', border: 'none',
                    background: activeTab === id ? C.primary : '#e5e7eb',
                    color: activeTab === id ? '#fff' : '#374151',
                    cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'dashboard' && <Dashboard stats={stats} />}
            {activeTab === 'wordcloud' && <WordCloud frequencies={wordFreqs ?? []} />}
          </div>
        )}
      </main>
    </div>
  )
}

function btnStyle(bg, disabled, fontSize = '14px') {
  return {
    background: disabled ? '#9ca3af' : bg,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 22px',
    fontSize,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 500,
    transition: 'opacity 0.15s',
  }
}

function Card({ children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px',
    }}>
      {children}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 16px' }}>
      <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '18px', fontWeight: 600 }}>{value}</p>
    </div>
  )
}
