import { useState } from 'react'
import { LIMITS } from '../../lib/limits'

const SECTION_CONFIG = {
  deep_work: {
    label: 'Deep Work',
    max: LIMITS.DAILY_DEEP_WORK,
    borderColor: '#3B82F6',
    bg: '#EFF6FF',
    badgeBg: '#DBEAFE',
    badgeColor: '#1D4ED8',
  },
  scheduled: {
    label: 'Scheduled',
    max: LIMITS.DAILY_SCHEDULED,
    borderColor: '#F08F48',
    bg: '#FFF7ED',
    badgeBg: '#FED7AA',
    badgeColor: '#C2410C',
  },
  admin: {
    label: 'Admin',
    max: LIMITS.DAILY_ADMIN,
    borderColor: '#DBEAFE',
    bg: '#F8FAFC',
    badgeBg: '#E2E8F0',
    badgeColor: '#475569',
  },
}

const S = {
  column: {
    flex: 1,
    borderRadius: 16,
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minWidth: 0,
    border: '1px solid #E5E0D8',
    background: '#FDFAF7',
    transition: 'border-color 0.15s',
  },
  columnToday: {
    border: '1.5px solid #93C5FD',
    background: '#F0F7FF',
  },
  dayHeader: {
    textAlign: 'center',
    paddingBottom: 6,
    borderBottom: '1px solid #E5E0D8',
    cursor: 'pointer',
  },
  dayName: {
    fontSize: 10,
    fontWeight: 600,
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  dayNum: {
    fontSize: 22,
    fontWeight: 700,
    color: '#133950',
    lineHeight: 1.1,
  },
  dayNumToday: {
    color: '#3B82F6',
  },
  section: {
    borderRadius: 10,
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    padding: '0 2px',
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#9CA3AF',
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 8,
    padding: '1px 5px',
  },
  slotCard: {
    borderRadius: 8,
    padding: '5px 7px',
    fontSize: 12,
    color: '#133950',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 4,
    lineHeight: 1.35,
    borderLeft: '2px solid transparent',
    background: '#fff',
    border: '1px solid #E5E0D8',
    wordBreak: 'break-word',
  },
  slotText: {
    flex: 1,
    minWidth: 0,
  },
  removeSlotBtn: {
    background: 'none',
    border: 'none',
    color: '#C5BCB2',
    fontSize: 13,
    lineHeight: 1,
    padding: 0,
    flexShrink: 0,
    cursor: 'pointer',
  },
  addPlaceholder: {
    borderRadius: 8,
    padding: '5px 7px',
    fontSize: 12,
    color: '#9CA3AF',
    border: '1.5px dashed #D1C8BF',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'border-color 0.15s, color 0.15s',
  },
  addInput: {
    borderRadius: 8,
    padding: '5px 7px',
    fontSize: 12,
    color: '#133950',
    border: '1.5px solid #3B82F6',
    background: '#fff',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit',
  },
}

function SlotSection({ type, slots, onAdd, onRemove, dayKey }) {
  const config = SECTION_CONFIG[type]
  const [adding, setAdding] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const isFull = slots.length >= config.max

  const handleAddConfirm = async () => {
    if (!inputVal.trim()) { setAdding(false); return }
    await onAdd(dayKey, type, inputVal)
    setInputVal('')
    setAdding(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAddConfirm()
    if (e.key === 'Escape') { setAdding(false); setInputVal('') }
  }

  return (
    <div style={{ ...S.section, background: config.bg }}>
      <div style={S.sectionHeader}>
        <span style={{ ...S.sectionLabel, color: config.borderColor }}>{config.label}</span>
        <span style={{ ...S.badge, background: config.badgeBg, color: config.badgeColor }}>
          {slots.length}/{config.max}
        </span>
      </div>

      {slots.map(slot => (
        <div
          key={slot.id}
          style={{ ...S.slotCard, borderLeftColor: config.borderColor }}
        >
          <span style={S.slotText}>{slot.text}</span>
          <button
            style={S.removeSlotBtn}
            onClick={() => onRemove(dayKey, slot.id)}
            title="Remove"
          >
            ×
          </button>
        </div>
      ))}

      {adding ? (
        <input
          style={S.addInput}
          autoFocus
          placeholder={`Add ${config.label.toLowerCase()}…`}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAddConfirm}
          maxLength={200}
        />
      ) : (
        !isFull && (
          <button
            style={S.addPlaceholder}
            onClick={() => setAdding(true)}
          >
            + add
          </button>
        )
      )}
    </div>
  )
}

export default function DayColumn({ dayKey, dayDate, slots, onAddSlot, onRemoveSlot, isToday, onDayView }) {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayIdx = dayDate ? dayDate.getDay() : 0
  // Convert JS day (0=Sun) to display (0=Mon)
  const displayIdx = dayIdx === 0 ? 6 : dayIdx - 1
  const dayName = dayNames[displayIdx] ?? dayKey?.slice(0, 3).toUpperCase()
  const dayNum = dayDate ? dayDate.getDate() : ''

  return (
    <div style={{ ...S.column, ...(isToday ? S.columnToday : {}) }}>
      <div style={S.dayHeader} onClick={onDayView} title="Switch to day view">
        <div style={S.dayName}>{dayName}</div>
        <div style={{ ...S.dayNum, ...(isToday ? S.dayNumToday : {}) }}>{dayNum}</div>
      </div>

      <SlotSection
        type="deep_work"
        slots={slots?.deep_work ?? []}
        dayKey={dayKey}
        onAdd={onAddSlot}
        onRemove={onRemoveSlot}
      />
      <SlotSection
        type="scheduled"
        slots={slots?.scheduled ?? []}
        dayKey={dayKey}
        onAdd={onAddSlot}
        onRemove={onRemoveSlot}
      />
      <SlotSection
        type="admin"
        slots={slots?.admin ?? []}
        dayKey={dayKey}
        onAdd={onAddSlot}
        onRemove={onRemoveSlot}
      />
    </div>
  )
}
