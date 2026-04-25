import { useState, useEffect, useRef } from 'react'

const STEPS = [
  {
    id: 'thisweek',
    title: 'This Week — your closed list',
    body: 'Add up to 15 tasks here. This is your commitment for the week. Drag any task to a day column to schedule it.',
    target: '[data-tour="thisweek"]',
    placement: 'right',
  },
  {
    id: 'dump',
    title: 'Brain Dump — everything else',
    body: 'Capture anything here without pressure. No limit. Use it as your Someday/Maybe list too.',
    target: '[data-tour="dump-btn"]',
    placement: 'bottom',
  },
  {
    id: 'daycolumn',
    title: 'Day columns',
    body: 'Each day has Deep Work, Focus, and Others slots. Hard limits keep the day realistic. Drag tasks in or type directly.',
    target: '[data-tour="day-today"]',
    placement: 'bottom',
  },
  {
    id: 'startup',
    title: 'Daily startup ritual',
    body: 'Each morning, click ☀ Day to review yesterday, plan today, and check capacity. Takes 2 minutes.',
    target: '[data-tour="startup-btn"]',
    placement: 'bottom',
  },
  {
    id: 'shutdown',
    title: 'Daily shutdown ritual',
    body: 'Each evening, click 🌙 Close to triage unfinished work and write one reflection sentence.',
    target: '[data-tour="shutdown-btn"]',
    placement: 'bottom',
  },
]

function getRect(selector) {
  const el = document.querySelector(selector)
  if (!el) return null
  return el.getBoundingClientRect()
}

function Spotlight({ rect }) {
  if (!rect) return null
  const pad = 8
  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 599 }}
    >
      <defs>
        <mask id="spotlight-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect
            x={rect.left - pad}
            y={rect.top - pad}
            width={rect.width + pad * 2}
            height={rect.height + pad * 2}
            rx={10}
            fill="black"
          />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#spotlight-mask)" />
      <rect
        x={rect.left - pad}
        y={rect.top - pad}
        width={rect.width + pad * 2}
        height={rect.height + pad * 2}
        rx={10}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
      />
    </svg>
  )
}

function TooltipCard({ step, rect, onNext, onSkip, isLast }) {
  const PAD = 16
  let style = {
    position: 'fixed', zIndex: 600,
    background: 'var(--surface)', borderRadius: 14,
    padding: '18px 20px', width: 300,
    boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
    border: '1px solid var(--border)',
  }

  if (rect) {
    if (step.placement === 'right') {
      style.left = rect.right + PAD
      style.top = rect.top
    } else if (step.placement === 'bottom') {
      style.top = rect.bottom + PAD
      style.left = Math.max(PAD, Math.min(rect.left, window.innerWidth - 300 - PAD))
    } else {
      style.top = rect.bottom + PAD
      style.left = PAD
    }
    // Clamp to viewport
    if (style.left + 300 > window.innerWidth - PAD) style.left = window.innerWidth - 300 - PAD
    if (style.top + 200 > window.innerHeight - PAD) style.top = rect.top - 200 - PAD
  } else {
    // Centered fallback
    style.top = '50%'
    style.left = '50%'
    style.transform = 'translate(-50%, -50%)'
  }

  return (
    <div style={style}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>{step.title}</div>
      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, margin: 0, marginBottom: 16 }}>{step.body}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onSkip}
          style={{
            padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-2)', fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Skip tour
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1, padding: '7px 12px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {isLast ? 'Done' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

export default function Onboarding({ onClose }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState(null)

  const step = STEPS[stepIdx]

  useEffect(() => {
    const r = getRect(step.target)
    setRect(r)
  }, [stepIdx, step.target])

  const handleNext = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(i => i + 1)
    } else {
      localStorage.setItem('pyw_onboarded', '1')
      onClose()
    }
  }

  const handleSkip = () => {
    localStorage.setItem('pyw_onboarded', '1')
    onClose()
  }

  return (
    <>
      {/* Overlay — clickable to skip */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 598, cursor: 'pointer' }}
        onClick={handleSkip}
      />
      <Spotlight rect={rect} />
      <TooltipCard
        step={step}
        rect={rect}
        onNext={handleNext}
        onSkip={handleSkip}
        isLast={stepIdx === STEPS.length - 1}
      />
      {/* Step counter */}
      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 5, zIndex: 600,
      }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i === stepIdx ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
          }} />
        ))}
      </div>
    </>
  )
}
