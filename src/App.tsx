import { supabase } from './supabaseClient'
import { useState, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ColumnId = 'wishlist' | 'applied' | 'interviewing' | 'offer' | 'rejected'
type NavId = 'dashboard' | 'analytics' | 'resumes' | 'settings'

interface Job {
  id: string
  company: string
  companyInitial: string
  companyColor: string
  title: string
  date: string
  salary: string
  column: ColumnId
  notes?: string
}

// ─── Theme helpers ────────────────────────────────────────────────────────────

const T = (dark: boolean) => ({
  bg:            dark ? '#1C1C1C' : '#F0F0F0',
  surface:       dark ? '#282828' : '#FFFFFF',
  surfaceHover:  dark ? '#323232' : '#EEF4FB',
  colBg:         dark ? '#222222' : '#E8F1FA',
  border:        dark ? '#3A3A3A' : '#D9EAF7',
  borderSoft:    dark ? '#2E2E2E' : '#E4EFF9',
  text:          dark ? '#F0F3F4' : '#001F3F',
  textMuted:     dark ? '#A0A0A0' : '#005B96',
  textSubtle:    dark ? '#606060' : '#7A9FBF',
  primary:       dark ? '#6B8E23' : '#007BFF',
  primaryHover:  dark ? '#7CA828' : '#0066DD',
  salaryBg:      dark ? 'rgba(107,142,35,0.18)' : '#D9EAF7',
  salaryText:    dark ? '#A9DFBF' : '#003366',
  searchBg:      dark ? '#161616' : '#F0F0F0',
  searchFocusBg: dark ? '#2A2A2A' : '#FFFFFF',
  focusRing:     dark ? 'rgba(107,142,35,0.28)' : 'rgba(0,123,255,0.12)',
  focusBorder:   dark ? '#6B8E23' : '#007BFF',
  danger:        dark ? '#F1948A' : '#E74C3C',
  dangerBg:      dark ? 'rgba(241,148,138,0.12)' : '#FEF2F2',
})

// ─── Data ─────────────────────────────────────────────────────────────────────

const COMPANY_COLORS = ['#635BFF','#F24E1E','#5E6AD2','#1DB954','#FF5A5F','#007BFF','#6B8E23','#E74C3C','#F39C12','#9B59B6','#1ABC9C','#E67E22']

const COLUMNS: { id: ColumnId; label: string; accent: string; lightBg: string; darkBg: string; lightText: string; darkText: string }[] = [
  { id: 'wishlist',     label: 'Wishlist',     accent: '#B0B0B0', lightBg: '#F0F0F0', darkBg: '#252525', lightText: '#5A6A7A', darkText: '#A0A0A0' },
  { id: 'applied',      label: 'Applied',      accent: '#007BFF', lightBg: '#D9EAF7', darkBg: '#212820', lightText: '#003366', darkText: '#A9DFBF' },
  { id: 'interviewing', label: 'Interviewing', accent: '#4A90E2', lightBg: '#D9EAD3', darkBg: '#1E2430', lightText: '#2D5A27', darkText: '#7EB8E8' },
  { id: 'offer',        label: 'Offer',        accent: '#2ECC71', lightBg: '#D9EAD3', darkBg: '#1A2620', lightText: '#1A5C34', darkText: '#6EDA9C' },
  { id: 'rejected',     label: 'Rejected',     accent: '#E74C3C', lightBg: '#FDDEDE', darkBg: '#2A1E1E', lightText: '#8B1A1A', darkText: '#F1948A' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)
const IconAnalytics = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const IconResumes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
)
const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
const IconPanelLeft = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="1.5" width="17" height="17" rx="3"/>
    <line x1="7" y1="1.5" x2="7" y2="18.5"/>
  </svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IconUpload = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
  </svg>
)

// ─── Dark mode toggle ─────────────────────────────────────────────────────────

function DarkToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const t = T(dark)
  return (
    <button
      onClick={onToggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '0 12px', height: 36, borderRadius: 8,
        background: t.colBg, border: `1px solid ${t.border}`,
        color: t.textMuted, cursor: 'pointer',
        fontSize: 12, fontWeight: 500,
        fontFamily: "'Instrument Sans', sans-serif",
        transition: 'background 0.2s, border-color 0.2s, color 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'flex', transition: 'transform 0.3s', transform: dark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
        {dark ? <IconSun /> : <IconMoon />}
      </span>
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}

// ─── Sidebar toggle button ────────────────────────────────────────────────    

function SidebarToggleBtn({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const t = T(dark)
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Toggle sidebar"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: hovered ? t.colBg : 'transparent',
        border: `1px solid ${hovered ? t.border : 'transparent'}`,
        color: hovered ? t.text : t.textMuted,
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
      }}
    >
      <IconPanelLeft />
    </button>
  )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ dark, title, onClose, children }: { dark: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const t = T(dark)
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.surface, borderRadius: 14,
          border: `1px solid ${t.border}`,
          boxShadow: `0 24px 64px rgba(0,0,0,${dark ? '0.6' : '0.2'})`,
          width: '100%', maxWidth: 480,
          overflow: 'hidden',
          animation: 'modalIn 0.18s ease',
        }}
      >
        <style>{`@keyframes modalIn { from { opacity:0; transform:translateY(8px) scale(0.98) } to { opacity:1; transform:none } }`}</style>
        <div style={{
          padding: '18px 20px', borderBottom: `1px solid ${t.borderSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: "'Instrument Sans',sans-serif", fontWeight: 700, fontSize: 15, color: t.text }}>
            {title}
          </span>
          <button onClick={onClose} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 7,
            background: 'transparent', border: 'none', color: t.textMuted,
            cursor: 'pointer',
          }}>
            <IconX />
          </button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function Field({ label, dark, children }: { label: string; dark: boolean; children: React.ReactNode }) {
  const t = T(dark)
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 5, letterSpacing: 0.3 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = (dark: boolean): React.CSSProperties => {
  const t = T(dark)
  return {
    width: '100%', height: 36, borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.searchBg, color: t.text,
    padding: '0 12px', fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    outline: 'none', boxSizing: 'border-box',
  }
}

const selectStyle = (dark: boolean): React.CSSProperties => ({
  ...inputStyle(dark), cursor: 'pointer', appearance: 'none', paddingRight: 32,
})

// ─── New / Edit Application modal ─────────────────────────────────────────────

function JobModal({ dark, job, onClose, onSave, onDelete }: {
  dark: boolean
  job?: Job
  onClose: () => void
  onSave: (j: Omit<Job, 'id'>) => void
  onDelete?: (job: Job) => void
}) {
  const t = T(dark)
  const [company, setCompany]   = useState(job?.company ?? '')
  const [title, setTitle]       = useState(job?.title ?? '')
  const [salary, setSalary]     = useState(job?.salary ?? '')
  const [date, setDate]         = useState(job?.date ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  const [column, setColumn]     = useState<ColumnId>(job?.column ?? 'wishlist')
  const [notes, setNotes]       = useState(job?.notes ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!company.trim() || !title.trim()) return
    const color = job?.companyColor ?? COMPANY_COLORS[Math.floor(Math.random() * COMPANY_COLORS.length)]
    onSave({ company: company.trim(), companyInitial: company.trim()[0].toUpperCase(), companyColor: color, title: title.trim(), salary: salary.trim() || 'Not specified', date, column, notes })
    onClose()
  }

  return (
    <Modal dark={dark} title={job ? 'Edit Application' : 'New Application'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="COMPANY" dark={dark}>
          <input required value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" style={inputStyle(dark)} />
        </Field>
        <Field label="JOB TITLE" dark={dark}>
          <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" style={inputStyle(dark)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="SALARY RANGE" dark={dark}>
            <input value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. $120k–$150k" style={inputStyle(dark)} />
          </Field>
          <Field label="DATE APPLIED" dark={dark}>
            <input value={date} onChange={e => setDate(e.target.value)} placeholder="e.g. Aug 15" style={inputStyle(dark)} />
          </Field>
        </div>
        <Field label="STATUS" dark={dark}>
          <div style={{ position: 'relative' }}>
            <select value={column} onChange={e => setColumn(e.target.value as ColumnId)} style={selectStyle(dark)}>
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: t.textSubtle }}>
              <IconChevronDown />
            </span>
          </div>
        </Field>
        <Field label="NOTES" dark={dark}>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this role…" rows={3} style={{
            ...inputStyle(dark), height: 'auto', padding: '8px 12px', resize: 'vertical', lineHeight: 1.5,
          }} />
        </Field>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
          {job && (
            <button type="button" onClick={() => { onClose(); onDelete?.(job) }} style={{
              padding: '0 14px', height: 36, borderRadius: 8,
              background: t.dangerBg, border: `1px solid ${t.danger}33`,
              color: t.danger, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: "'Instrument Sans',sans-serif",
            }}>Delete</button>
          )}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={onClose} style={{
            padding: '0 16px', height: 36, borderRadius: 8,
            background: 'transparent', border: `1px solid ${t.border}`,
            color: t.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            fontFamily: "'Instrument Sans',sans-serif",
          }}>Cancel</button>
          <button type="submit" style={{
            padding: '0 18px', height: 36, borderRadius: 8,
            background: t.primary, border: 'none',
            color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            fontFamily: "'Instrument Sans',sans-serif",
          }}>{job ? 'Save Changes' : 'Add Application'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({ dark, job, onClose, onConfirm }: { dark: boolean; job: Job; onClose: () => void; onConfirm: () => void }) {
  const t = T(dark)
  return (
    <Modal dark={dark} title="Delete Application" onClose={onClose}>
      <p style={{ fontSize: 14, color: t.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
        Remove <strong style={{ color: t.text }}>{job.title}</strong> at <strong style={{ color: t.text }}>{job.company}</strong>? This can't be undone.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{
          padding: '0 16px', height: 36, borderRadius: 8,
          background: 'transparent', border: `1px solid ${t.border}`,
          color: t.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600,
          fontFamily: "'Instrument Sans',sans-serif",
        }}>Cancel</button>
        <button onClick={onConfirm} style={{
          padding: '0 18px', height: 36, borderRadius: 8,
          background: t.danger, border: 'none',
          color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          fontFamily: "'Instrument Sans',sans-serif",
        }}>Delete</button>
      </div>
    </Modal>
  )
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, dark, onDragStart, onEdit, onDelete }: {
  job: Job; dark: boolean
  onDragStart: (id: string) => void
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
}) {
  const [hovered, setHovered]   = useState(false)
  const [dragging, setDragging] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const t = T(dark)

  useEffect(() => {
    if (!menuOpen) return 
    const close = () => setMenuOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  return (
    <div
      draggable
      onDragStart={e => { e.stopPropagation(); setDragging(true); onDragStart(job.id) }}
      onDragEnd={() => setDragging(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
      onClick={() => { if (!menuOpen) onEdit(job) }}
      style={{
        background: t.surface, borderRadius: 10,
        border: `1px solid ${hovered && !dragging ? (dark ? '#6B8E23' : '#007BFF') : t.border}`,
        padding: '14px 14px 12px',
        cursor: dragging ? 'grabbing' : 'pointer',
        opacity: dragging ? 0.45 : 1,
        boxShadow: dragging
          ? 'none'
          : hovered
            ? `0 4px 16px ${dark ? 'rgba(107,142,35,0.20)' : 'rgba(0,123,255,0.14)'}, 0 1px 4px rgba(0,0,0,${dark ? '0.3' : '0.05'})`
            : `0 1px 3px rgba(0,0,0,${dark ? '0.25' : '0.07'})`,
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s, opacity 0.15s',
        transform: hovered && !dragging ? 'translateY(-1px)' : 'none',
        userSelect: 'none', position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: job.companyColor === '#000000' && dark ? '#374151' : job.companyColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontSize: 11, fontWeight: 700, color: '#fff',
          fontFamily: "'Instrument Sans', sans-serif", letterSpacing: 0.3,
        }}>
          {job.companyInitial}
        </div>
        <span style={{ fontSize: 12, color: t.textSubtle, fontWeight: 500, letterSpacing: 0.1, flex: 1 }}>
          {job.company}
        </span>

        <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, borderRadius: 6, border: 'none',
              background: menuOpen ? t.colBg : 'transparent',
              color: t.textMuted, cursor: 'pointer',
              opacity: hovered || menuOpen ? 1 : 0,
              transition: 'opacity 0.15s, background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = t.colBg}
            onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = 'transparent' }}
          >
            <IconDots />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 30, zIndex: 100,
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 9, padding: 4, minWidth: 140,
              boxShadow: `0 8px 24px rgba(0,0,0,${dark ? '0.5' : '0.14'})`,
              animation: 'fadeUp 0.12s ease',
            }}>
              <button onClick={() => { setMenuOpen(false); onEdit(job) }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', borderRadius: 6, border: 'none',
                background: 'transparent', color: t.text, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                fontFamily: "'Inter', sans-serif", textAlign: 'left',
              }}
                onMouseEnter={e => e.currentTarget.style.background = t.colBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <IconEdit /> Edit application
              </button>
              <div style={{ height: 1, background: t.borderSoft, margin: '3px 0' }} />
              <button onClick={() => { setMenuOpen(false); onDelete(job) }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', borderRadius: 6, border: 'none',
                background: 'transparent', color: t.danger, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                fontFamily: "'Inter', sans-serif", textAlign: 'left',
              }}
                onMouseEnter={e => e.currentTarget.style.background = t.dangerBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <IconTrash /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{
        fontSize: 13.5, fontWeight: 600, color: t.text,
        fontFamily: "'Instrument Sans', sans-serif",
        lineHeight: 1.35, marginBottom: 10,
      }}>
        {job.title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.textSubtle }}>
          <IconCalendar />
          <span style={{ fontSize: 11, fontWeight: 500 }}>Applied {job.date}</span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600,
          background: t.salaryBg, color: t.salaryText,
          borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap', letterSpacing: 0.1,
        }}>
          {job.salary}
        </span>
      </div>

      {job.notes && (
        <div style={{ marginTop: 8, fontSize: 11, color: t.textSubtle, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.notes}
        </div>
      )}
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ col, jobs, dark, onDragStart, onDrop, onEdit, onDelete }: {
  col: typeof COLUMNS[0]; jobs: Job[]; dark: boolean
  onDragStart: (id: string) => void
  onDrop: (colId: ColumnId) => void
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const t = T(dark)
  const badgeBg   = dark ? col.darkBg   : col.lightBg
  const badgeText = dark ? col.darkText  : col.lightText

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => { setDragOver(false); onDrop(col.id) }}
      style={{
        width: '100%', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: dragOver ? (dark ? '#2C3020' : '#D9EAF7') : (dark ? '#222222' : '#E8F1FA'),
        borderRadius: 12,
        border: `2px dashed ${dragOver ? (dark ? '#6B8E23' : '#007BFF') : 'transparent'}`,
        transition: 'background 0.15s, border-color 0.15s',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.accent, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Instrument Sans',sans-serif", fontWeight: 600, fontSize: 13, color: t.text, letterSpacing: 0.1 }}>
          {col.label}
        </span>
        <span style={{
          marginLeft: 2, fontSize: 11, fontWeight: 700,
          background: badgeBg, color: badgeText,
          borderRadius: 20, padding: '1px 7px', border: `1px solid ${col.accent}33`,
        }}>
          {jobs.length}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 }}>
        {jobs.map(job => (
          <JobCard key={job.id} job={job} dark={dark} onDragStart={onDragStart} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {jobs.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 0', color: t.textSubtle, fontSize: 12, fontStyle: 'italic' }}>
            Drop cards here
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV: { id: NavId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: <IconDashboard /> },
  { id: 'analytics',  label: 'Analytics',  icon: <IconAnalytics /> },
  { id: 'resumes',    label: 'Resumes',    icon: <IconResumes /> },
  { id: 'settings',   label: 'Settings',   icon: <IconSettings /> },
]

function NavItem({ item, active, dark, onClick }: { item: typeof NAV[0]; active: boolean; dark: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const t = T(dark)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 8, marginBottom: 2,
        cursor: 'pointer',
        background: active ? (dark ? '#323232' : '#D9EAF7') : hovered ? (dark ? '#2C2C2C' : t.surfaceHover) : 'transparent',
        color: active ? (dark ? '#A9DFBF' : '#003366') : hovered ? t.text : t.textMuted,
        borderLeft: active ? (dark ? '2px solid #6B8E23' : '2px solid #007BFF') : '2px solid transparent',
        fontWeight: active ? 600 : 500, fontSize: 13.5,
        transition: 'background 0.12s, color 0.12s',
        userSelect: 'none',
      }}
    >
      <span style={{ color: active ? (dark ? '#6B8E23' : '#007BFF') : hovered ? t.text : t.textSubtle }}>
        {item.icon}
      </span>
      {item.label}
    </div>
  )
}

function Sidebar({ dark, open, activeNav, onToggle, onNav, userName, userEmail, userInitials }: {
  dark: boolean; open: boolean; activeNav: NavId
  onToggle: () => void; onNav: (id: NavId) => void
  userName: string; userEmail: string; userInitials: string;
}) {
  const t = T(dark)
  return (
    <aside style={{
      width: open ? 220 : 0, flexShrink: 0, height: '100vh',
      position: 'relative', zIndex: 50,
      background: t.surface, borderRight: open ? `1px solid ${t.border}` : 'none',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      pointerEvents: open ? 'auto' : 'none',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s, background 0.25s',
    }}>
      <div style={{ width: 220, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ padding: '18px 14px 16px 18px', borderBottom: `1px solid ${t.borderSoft}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: dark ? 'linear-gradient(135deg, #6B8E23 0%, #3D3D3D 100%)' : 'linear-gradient(135deg, #007BFF 0%, #003366 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="6" height="18" rx="2"/>
                <rect x="10" y="3" width="6" height="11" rx="2"/>
                <rect x="18" y="3" width="4" height="7" rx="2"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Instrument Sans',sans-serif", fontWeight: 700, fontSize: 15.5, color: t.text, letterSpacing: -0.3, flex: 1 }}>
              CareerBoard
            </span>
            <SidebarToggleBtn dark={dark} onToggle={onToggle} />
          </div>
        </div>
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {NAV.map(item => (
            <NavItem key={item.id} item={item} active={activeNav === item.id} dark={dark} onClick={() => onNav(item.id)} />
          ))}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${t.borderSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: dark ? 'linear-gradient(135deg, #6B8E23, #3D3D3D)' : 'linear-gradient(135deg, #007BFF, #003366)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
            fontFamily: "'Instrument Sans',sans-serif",
          }}>{userInitials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text, lineHeight: 1.3 }}>{userName}</div>
            <div style={{ fontSize: 11, color: t.textSubtle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userEmail}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ─── New Application button ───────────────────────────────────────────────────

function NewAppButton({ dark, onClick }: { dark: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const t = T(dark)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 16px', height: 36, borderRadius: 8,
        background: hovered ? t.primaryHover : t.primary,
        color: '#fff', border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 700,
        fontFamily: "'Instrument Sans',sans-serif", letterSpacing: 0.1,
        boxShadow: hovered
          ? `0 4px 14px ${dark ? 'rgba(107,142,35,0.45)' : 'rgba(0,123,255,0.35)'}`
          : `0 1px 4px ${dark ? 'rgba(107,142,35,0.25)' : 'rgba(0,123,255,0.18)'}`,
        transition: 'background 0.15s, box-shadow 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      <IconPlus />
      New Application
    </button>
  )
}

// ─── Analytics view ───────────────────────────────────────────────────────────

function AnalyticsView({ jobs, dark }: { jobs: Job[]; dark: boolean }) {
  const t = T(dark)
  const total = jobs.length
  const byCol = COLUMNS.map(c => ({ ...c, count: jobs.filter(j => j.column === c.id).length }))
  const responseRate = total ? Math.round((jobs.filter(j => j.column !== 'wishlist' && j.column !== 'rejected').length / total) * 100) : 0
  const offerRate    = total ? Math.round((jobs.filter(j => j.column === 'offer').length / total) * 100) : 0

  const statCard = (label: string, value: string | number, sub: string) => (
    <div style={{ background: t.surface, borderRadius: 12, border: `1px solid ${t.border}`, padding: '20px 24px', boxShadow: `0 1px 3px rgba(0,0,0,${dark ? '0.25' : '0.06'})`, minHeight: 100, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: dark ? '#F0F3F4' : '#0A1628', fontFamily: "'Instrument Sans',sans-serif", marginBottom: 4, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>{label}</div>
      <div style={{ fontSize: 11, color: t.textSubtle, marginTop: 2 }}>{sub}</div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        {statCard('Total Applications', total, 'across all stages')}
        {statCard('Response Rate', `${responseRate}%`, 'applied → active pipeline')}
        {statCard('Offer Rate', `${offerRate}%`, 'of all applications')}
        {statCard('Active Pipeline', jobs.filter(j => j.column === 'interviewing').length, 'currently interviewing')}
      </div>

      <div style={{ background: t.surface, borderRadius: 12, border: `1px solid ${t.border}`, padding: '20px 24px', boxShadow: `0 1px 3px rgba(0,0,0,${dark ? '0.25' : '0.06'})` }}>
        <div style={{ fontFamily: "'Instrument Sans',sans-serif", fontWeight: 700, fontSize: 14, color: t.text, marginBottom: 18 }}>
          Pipeline Breakdown
        </div>
        {byCol.map(col => (
          <div key={col.id} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: dark ? col.darkText : col.lightText }}>{col.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: col.accent }}>{col.count}</span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: dark ? col.darkBg : col.lightBg, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, background: col.accent,
                width: total ? `${(col.count / total) * 100}%` : '0%',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Resumes view ─────────────────────────────────────────────────────────────

function ResumesView({ dark, session }: { dark: boolean; session: any }) {
  const t = T(dark)
  const [resumes, setResumes] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchResumes()
  }, [])

  async function fetchResumes() {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setResumes(data)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath)

      const sizeFormatted = `${Math.round(file.size / 1024)} KB`
      const { error: dbError } = await supabase.from('resumes').insert([{
        user_id: session.user.id,
        name: file.name,
        size: sizeFormatted,
        url: publicUrl,
        is_primary: resumes.length === 0
      }])

      if (dbError) throw dbError
      fetchResumes()
    } catch (err: any) {
      alert('Error uploading resume: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('resumes').delete().eq('id', id)
    if (!error) fetchResumes()
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
      <label style={{ display: 'block', marginBottom: 20, cursor: uploading ? 'not-allowed' : 'pointer' }}>
        <div style={{ background: t.surface, borderRadius: 12, border: `2px dashed ${t.border}`, padding: '36px', textAlign: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = t.primary)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = t.border)}
        >
          <div style={{ color: t.textSubtle, marginBottom: 12 }}><IconUpload /></div>
          <div style={{ fontFamily: "'Instrument Sans',sans-serif", fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 4 }}>
            {uploading ? 'Uploading to database…' : 'Upload a Resume'}
          </div>
          <div style={{ fontSize: 12, color: t.textSubtle }}>PDF, DOCX up to 5 MB</div>
        </div>
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
      </label>

      {resumes.map(r => (
        <div key={r.id} style={{
          background: t.surface, borderRadius: 10, border: `1px solid ${r.is_primary ? t.primary : t.border}`,
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10,
          boxShadow: `0 1px 3px rgba(0,0,0,${dark ? '0.2' : '0.05'})`,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: t.salaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconResumes />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 2, textDecoration: 'none', display: 'block' }}>
              {r.name}
            </a>
            <div style={{ fontSize: 11, color: t.textSubtle }}>{r.size} · Uploaded {new Date(r.created_at).toLocaleDateString()}</div>
          </div>
          {r.is_primary && (
            <span style={{ fontSize: 11, fontWeight: 700, background: t.salaryBg, color: t.salaryText, borderRadius: 20, padding: '2px 8px' }}>
              Primary
            </span>
          )}
          <button onClick={() => handleDelete(r.id)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            background: 'transparent', border: 'none', color: t.danger, cursor: 'pointer',
          }}><IconTrash /></button>
        </div>
      ))}
    </div>
  )
}

// ─── Settings view ────────────────────────────────────────────────────────────

function SettingsView({ dark, onToggleDark, onSignOut, initialName, initialEmail, jobs }: { 
  dark: boolean; onToggleDark: () => void; onSignOut: () => void;
  initialName: string; initialEmail: string; jobs: Job[];
}) {
  const t = T(dark)
  const [name, setName]   = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [saved, setSaved] = useState(false)

  const save = async () => { 
    await supabase.auth.updateUser({
      data: { full_name: name }
    });
    setSaved(true); 
    setTimeout(() => setSaved(false), 2000); 
  }

  // --- NEW: CSV Export Logic ---
  const handleExportCSV = () => {
    if (jobs.length === 0) {
      alert("You don't have any applications to export yet!");
      return;
    }

    // Define CSV headers
    const headers = ['Company', 'Job Title', 'Salary', 'Date Applied', 'Status', 'Notes'];
    const csvRows = [headers.join(',')];

    // Loop through jobs and format each row
    for (const job of jobs) {
      // We wrap values in quotes and escape existing quotes to prevent CSV breaking from commas in notes/salaries
      const row = [
        `"${job.company.replace(/"/g, '""')}"`,
        `"${job.title.replace(/"/g, '""')}"`,
        `"${job.salary.replace(/"/g, '""')}"`,
        `"${job.date.replace(/"/g, '""')}"`,
        `"${job.column.replace(/"/g, '""')}"`,
        `"${(job.notes || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }

    // Create a Blob from the CSV string
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a hidden link and trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'CareerBoard_Applications.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: t.surface, borderRadius: 12, border: `1px solid ${t.border}`, marginBottom: 16, overflow: 'hidden', boxShadow: `0 1px 3px rgba(0,0,0,${dark ? '0.2' : '0.05'})` }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.borderSoft}` }}>
        <span style={{ fontFamily: "'Instrument Sans',sans-serif", fontWeight: 700, fontSize: 13, color: t.text }}>{title}</span>
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  )

  const Row = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: t.textSubtle, marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px', maxWidth: 600 }}>
      <Section title="Profile">
        <Field label="FULL NAME" dark={dark}>
          <input value={name} onChange={e => setName(e.target.value)} style={inputStyle(dark)} />
        </Field>
        <Field label="EMAIL" dark={dark}>
          <input disabled value={email} onChange={e => setEmail(e.target.value)} style={{...inputStyle(dark), opacity: 0.6, cursor: 'not-allowed'}} title="Email cannot be changed" />
        </Field>
        <button onClick={save} style={{
          padding: '0 18px', height: 36, borderRadius: 8,
          background: saved ? (dark ? '#4A5E3D' : '#D9EAD3') : t.primary,
          border: 'none', color: saved ? (dark ? '#A9DFBF' : '#1A5C34') : '#fff',
          cursor: 'pointer', fontSize: 13, fontWeight: 700,
          fontFamily: "'Instrument Sans',sans-serif",
          transition: 'background 0.2s, color 0.2s',
        }}>{saved ? '✓ Saved' : 'Save Changes'}</button>
      </Section>

      <Section title="Appearance">
        <Row label="Dark Mode" sub="Switch between light and dark interface">
          <button onClick={onToggleDark} style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 0,
            background: dark ? t.primary : t.border, position: 'relative', transition: 'background 0.2s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3, left: dark ? 23 : 3,
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </Row>
      </Section>

      <Section title="Data">
        <Row label="Clear All Applications" sub="Permanently remove all job cards">
          <button style={{
            padding: '0 14px', height: 32, borderRadius: 8,
            background: t.dangerBg, border: `1px solid ${t.danger}33`,
            color: t.danger, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            fontFamily: "'Instrument Sans',sans-serif",
          }}>Clear Data</button>
        </Row>
        <Row label="Export to CSV" sub="Download your applications as a spreadsheet">
          {/* --- NEW: Added onClick handler here --- */}
          <button onClick={handleExportCSV} style={{
            padding: '0 14px', height: 32, borderRadius: 8,
            background: t.colBg, border: `1px solid ${t.border}`,
            color: t.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            fontFamily: "'Instrument Sans',sans-serif",
          }}>Export</button>
        </Row>
        <Row label="Sign Out" sub="Return to the login screen">
          <button onClick={onSignOut} style={{
            padding: '0 14px', height: 32, borderRadius: 8,
            background: t.dangerBg, border: `1px solid ${t.danger}33`,
            color: t.danger, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            fontFamily: "'Instrument Sans',sans-serif",
          }}>Sign Out</button>
        </Row>
      </Section>
    </div>
  )
}

// ─── Auth Page ────────────────────────────────────────────────────────────────

const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const IconGitHub = ({ dark }: { dark: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={dark ? '#ffffff' : '#111827'}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
)

function AuthPage({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void; onAuth: () => void }) {
  const t = T(dark)
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { full_name: name }
          }
        })
        if (error) throw error;
        alert("Account created successfully! You are now logged in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })
        if (error) throw error;
      }
    } catch (error: any) {
      alert("Auth Error: " + error.message);
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) alert("Google Login Error: " + error.message);
  }

  const handleGithubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
    if (error) alert("GitHub Login Error: " + error.message);
  }

  const orbs: React.CSSProperties[] = [
    { position: 'absolute', width: 500, height: 500, borderRadius: '50%', top: -120, left: -140, background: dark ? 'radial-gradient(circle, rgba(107,142,35,0.18) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(0,123,255,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' },
    { position: 'absolute', width: 420, height: 420, borderRadius: '50%', bottom: -100, right: -100, background: dark ? 'radial-gradient(circle, rgba(169,223,191,0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(74,144,226,0.10) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' },
  ]

  const dotGrid: React.CSSProperties = {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: `radial-gradient(circle, ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'} 1px, transparent 1px)`,
    backgroundSize: '22px 22px',
  }

  const fieldStyle = (id: string): React.CSSProperties => ({
    width: '100%', height: 42, borderRadius: 9, boxSizing: 'border-box',
    border: `1.5px solid ${focusedField === id ? t.focusBorder : t.border}`,
    background: focusedField === id ? t.searchFocusBg : t.searchBg,
    boxShadow: focusedField === id ? `0 0 0 3px ${t.focusRing}` : 'none',
    color: t.text, padding: '0 14px', fontSize: 14,
    fontFamily: "'Inter', sans-serif", outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
  })

  const socialBtn = (label: string): React.CSSProperties => ({
    width: '100%', height: 42, borderRadius: 9, border: `1.5px solid ${t.border}`,
    background: t.surface, color: t.text, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    fontSize: 14, fontWeight: 600, fontFamily: "'Instrument Sans', sans-serif",
    transition: 'background 0.15s, border-color 0.15s',
    boxSizing: 'border-box',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? '#1C1C1C' : '#F9FAFB', position: 'relative', overflow: 'hidden', transition: 'background 0.25s' }}>
      <div style={dotGrid} />
      {orbs.map((o, i) => <div key={i} style={o} />)}

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, margin: '0 20px',
        background: t.surface, borderRadius: 16,
        border: `1px solid ${t.border}`,
        boxShadow: dark
          ? '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 8px 40px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.05)',
        padding: '36px 36px 32px',
        animation: 'fadeUp 0.3s ease',
      }}>
        <style>{`
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
          .social-btn:hover { background: var(--hover-bg) !important; border-color: var(--hover-border) !important; }
          .auth-input::placeholder { color: ${t.textSubtle}; }
        `}</style>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, marginBottom: 14,
            background: dark ? 'linear-gradient(135deg, #6B8E23 0%, #3D3D3D 100%)' : 'linear-gradient(135deg, #007BFF 0%, #003366 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: dark ? '0 4px 14px rgba(107,142,35,0.4)' : '0 4px 14px rgba(0,123,255,0.3)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="6" height="18" rx="2"/>
              <rect x="10" y="3" width="6" height="11" rx="2"/>
              <rect x="18" y="3" width="4" height="7" rx="2"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: 18, color: t.text, letterSpacing: -0.4, marginBottom: 6 }}>
            CareerBoard
          </span>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 700, fontSize: 22, color: t.text, margin: 0, letterSpacing: -0.5, textAlign: 'center' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 13.5, color: t.textMuted, margin: '6px 0 0', textAlign: 'center' }}>
            {mode === 'login' ? 'Log in to track your applications' : 'Start your job search journey'}
          </p>
        </div>

        <div style={{ display: 'flex', background: t.colBg, borderRadius: 10, padding: 4, marginBottom: 22, border: `1px solid ${t.border}` }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, height: 34, borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600, fontSize: 13,
              background: mode === m ? t.surface : 'transparent',
              color: mode === m ? t.text : t.textMuted,
              boxShadow: mode === m ? `0 1px 4px rgba(0,0,0,${dark ? '0.3' : '0.08'})` : 'none',
              transition: 'all 0.18s',
            }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Continue with Google', icon: <IconGoogle />, action: handleGoogleLogin },
            { label: 'Continue with GitHub', icon: <IconGitHub dark={dark} />, action: handleGithubLogin },
          ].map(({ label, icon, action }) => (
            <button key={label} type="button" onClick={action} style={socialBtn(label)}
              onMouseEnter={e => { e.currentTarget.style.background = t.surfaceHover; e.currentTarget.style.borderColor = t.focusBorder }}
              onMouseLeave={e => { e.currentTarget.style.background = t.surface; e.currentTarget.style.borderColor = t.border }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: t.textSubtle, letterSpacing: 0.8 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6, letterSpacing: 0.3 }}>FULL NAME</label>
              <input className="auth-input" required value={name} onChange={e => setName(e.target.value)} placeholder="Alex Kim" style={fieldStyle('name')}
                onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 6, letterSpacing: 0.3 }}>EMAIL ADDRESS</label>
            <input className="auth-input" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com" style={fieldStyle('email')}
              onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} />
          </div>

          <div style={{ marginBottom: mode === 'login' ? 8 : 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, letterSpacing: 0.3 }}>PASSWORD</label>
              {mode === 'login' && (
                <button type="button" style={{ fontSize: 12, color: t.primary, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 500, padding: 0 }}>
                  Forgot password?
                </button>
              )}
            </div>
            <input className="auth-input" required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={fieldStyle('password')}
              onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} />
          </div>

          {mode === 'login' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input type="checkbox" id="remember" style={{ accentColor: t.primary, width: 14, height: 14, cursor: 'pointer' }} />
              <label htmlFor="remember" style={{ fontSize: 13, color: t.textMuted, cursor: 'pointer', userSelect: 'none' }}>
                Remember me for 30 days
              </label>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', height: 44, borderRadius: 9, border: 'none',
            background: loading ? t.textSubtle : t.primary,
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 15, fontWeight: 700, fontFamily: "'Instrument Sans', sans-serif",
            letterSpacing: 0.1, boxSizing: 'border-box',
            boxShadow: loading ? 'none' : dark ? '0 4px 16px rgba(107,142,35,0.4)' : '0 4px 16px rgba(0,123,255,0.3)',
            transition: 'background 0.15s, box-shadow 0.15s, transform 0.1s',
            transform: loading ? 'none' : undefined,
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = t.primaryHover }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = t.primary }}
          >
            {loading ? 'Signing in…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 13, color: t.textSubtle }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{
            fontSize: 13, fontWeight: 600, color: t.primary, background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, fontFamily: "'Inter', sans-serif",
          }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <DarkToggle dark={dark} onToggle={onToggleDark} />
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('careerboard_dark_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('careerboard_dark_mode', String(dark));
  }, [dark]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState<NavId>('dashboard');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const dragId = useRef<string | null>(null);
  const t = T(dark);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchLiveJobs();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchLiveJobs();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchLiveJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedJobs: Job[] = data.map((dbJob: any) => ({
          id: dbJob.id,
          company: dbJob.company || 'Unknown',
          companyInitial: (dbJob.company || 'U')[0].toUpperCase(),
          companyColor: COMPANY_COLORS[Math.floor(Math.random() * COMPANY_COLORS.length)],
          title: dbJob.role || 'Unknown Role', 
          date: new Date(dbJob.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          salary: 'Not specified', 
          column: (dbJob.status || 'applied') as ColumnId,
          notes: ''
        }));
        setJobs(mappedJobs);
      }
    } catch (error) {
      console.error("Error fetching jobs from Supabase:", error);
    }
  }

  const handleDragStart = (id: string) => { dragId.current = id }
  const handleDrop = async (colId: ColumnId) => {
    if (!dragId.current) return;
    const movedJobId = dragId.current;
    
    setJobs(prev => prev.map(j => j.id === movedJobId ? { ...j, column: colId } : j));
    dragId.current = null;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: colId })
        .eq('id', movedJobId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Failed to update database:", error.message);
    }
  }

  const handleAddJob = async (data: Omit<Job, 'id'>) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .insert([{ 
          company: data.company, 
          role: data.title, 
          status: data.column 
        }]);

      if (error) throw error;
      fetchLiveJobs();
    } catch (error: any) {
      console.error("Error adding job:", error.message);
    }
  }

  const handleEditJob = async (data: Omit<Job, 'id'>) => {
    if (!editingJob) return;
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ 
          company: data.company, 
          role: data.title, 
          status: data.column 
        })
        .eq('id', editingJob.id);

      if (error) throw error;
      fetchLiveJobs();
    } catch (error: any) {
      console.error("Error editing job:", error.message);
    }
    setEditingJob(null);
  }

  const handleDeleteJob = async () => {
    if (!deletingJob) return;
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', deletingJob.id);

      if (error) throw error;
      fetchLiveJobs();
    } catch (error: any) {
      console.error("Error deleting job:", error.message);
    }
    setDeletingJob(null);
  }

  const filtered = jobs.filter(j =>
    !search ||
    j.company.toLowerCase().includes(search.toLowerCase()) ||
    j.title.toLowerCase().includes(search.toLowerCase())
  )

  const PAGE_TITLES: Record<NavId, string> = {
    dashboard: 'My Applications', analytics: 'Analytics', resumes: 'Resumes', settings: 'Settings',
  }

  if (!session) return <AuthPage dark={dark} onToggleDark={() => setDark(d => !d)} onAuth={() => {}} />

  const userEmail = session?.user?.email || '';
  const userName = session?.user?.user_metadata?.full_name || 'My Account';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', height: '100vh', background: t.bg, overflow: 'hidden', transition: 'background 0.25s' }}>
      <Sidebar
        dark={dark} open={sidebarOpen} activeNav={activeNav}
        onToggle={() => setSidebarOpen(o => !o)}
        onNav={setActiveNav}
        userName={userName} userEmail={userEmail} userInitials={userInitials}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          minHeight: 64, flexShrink: 0, background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '12px 28px', gap: 12,
          transition: 'background 0.25s, border-color 0.25s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {!sidebarOpen && <SidebarToggleBtn dark={dark} onToggle={() => setSidebarOpen(true)} />}
              <h1 style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: 17, fontWeight: 700, color: t.text, margin: 0, letterSpacing: -0.2 }}>
                {PAGE_TITLES[activeNav]}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>
              {activeNav === 'dashboard' && (
                <div style={{ position: 'relative', width: 200 }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: t.textSubtle, pointerEvents: 'none' }}>
                    <IconSearch />
                  </span>
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search jobs…"
                    style={{ width: '100%', height: 36, borderRadius: 8, border: `1px solid ${t.border}`, background: t.searchBg, paddingLeft: 34, paddingRight: 12, fontSize: 13, color: t.text, outline: 'none', fontFamily: "'Inter',sans-serif", boxSizing: 'border-box' }}
                  />
                </div>
              )}
              <DarkToggle dark={dark} onToggle={() => setDark(d => !d)} />
              {activeNav === 'dashboard' && <NewAppButton dark={dark} onClick={() => setShowNewModal(true)} />}
            </div>
          </div>
        </header>

        {activeNav === 'dashboard' && (
          <>
            <div style={{ padding: '14px 28px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {COLUMNS.map(col => {
                const count = filtered.filter(j => j.column === col.id).length
                return (
                  <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: dark ? col.darkBg : col.lightBg, border: `1px solid ${col.accent}33` }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: col.accent }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: dark ? col.darkText : col.lightText }}>{col.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: col.accent }}>{count}</span>
                  </div>
                )
              })}
              <div style={{ marginLeft: 'auto', fontSize: 12, color: t.textSubtle, alignSelf: 'center' }}>
                {filtered.length} total applications
              </div>
            </div>
            {/* Grid Layout Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, alignItems: 'flex-start' }}>
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.id} col={col} jobs={filtered.filter(j => j.column === col.id)}
                  dark={dark} onDragStart={handleDragStart} onDrop={handleDrop}
                  onEdit={setEditingJob} onDelete={setDeletingJob}
                />
              ))}
            </div>
          </>
        )}

        {activeNav === 'analytics' && <AnalyticsView jobs={jobs} dark={dark} />}
        {activeNav === 'resumes'   && <ResumesView dark={dark} session={session} />}
        {activeNav === 'settings'  && <SettingsView dark={dark} onToggleDark={() => setDark(d => !d)} onSignOut={() => supabase.auth.signOut()} initialName={userName} initialEmail={userEmail} jobs={jobs} />}
      </div>

      {showNewModal && (
        <JobModal dark={dark} onClose={() => setShowNewModal(false)} onSave={handleAddJob} />
      )}
      {editingJob && (
        <JobModal
          dark={dark} job={editingJob}
          onClose={() => setEditingJob(null)}
          onSave={handleEditJob}
          onDelete={j => { setEditingJob(null); setDeletingJob(j) }}
        />
      )}
      {deletingJob && (
        <DeleteModal dark={dark} job={deletingJob} onClose={() => setDeletingJob(null)} onConfirm={handleDeleteJob} />
      )}
    </div>
  )
}