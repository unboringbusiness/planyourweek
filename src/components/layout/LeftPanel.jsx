import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Compact dump row — sortable, draggable to day columns
function DumpRow({ item, onRemove, dragHandleProps, isDragOverlay }) {
  const [hovered, setHovered] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'dump', item },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 8px', borderRadius: 6,
          background: hovered ? 'var(--surface)' : 'transparent',
          cursor: 'grab', transition: 'background 0.1s',
          userSelect: 'none',
        }}
      >
        {/* Drag indicator */}
        <div style={{
          width: 3, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#D0CEC9' }} />
          ))}
        </div>

        <span style={{
          flex: 1, fontSize: 13, color: 'var(--text-1)',
          lineHeight: 1.35, wordBreak: 'break-word',
        }}>
          {item.text}
        </span>

        {hovered && !isDragOverlay && (
          <button
            onClick={e => { e.stopPropagation(); onRemove?.(item.id) }}
            style={{
              background: 'none', border: 'none', padding: '0 2px',
              fontSize: 14, color: '#D0CEC9', cursor: 'pointer',
              lineHeight: 1, flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#D0CEC9' }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

const PROJECT_COLORS = ['#3B82F6', '#F08F48', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#06B6D4', '#EC4899']

function ProjectDot({ color }) {
  return (
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
  )
}

export default function LeftPanel({ dump, projects, projectsFull, onAddProject }) {
  const [collapsed, setCollapsed] = useState(false)
  const [addVal, setAddVal] = useState('')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [addingProject, setAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0])

  const activeProjects = projects?.filter(p => !p.archived) ?? []

  const visibleItems = activeProjectId
    ? dump.items.filter(item => item.project_id === activeProjectId)
    : dump.items

  const handleAddDump = async () => {
    const trimmed = addVal.trim()
    if (!trimmed) return
    const result = await dump.addItem(trimmed)
    if (!result?.error) setAddVal('')
  }

  const handleAddProject = async () => {
    const trimmed = newProjectName.trim()
    if (!trimmed) return
    await onAddProject?.({ name: trimmed, color: newProjectColor })
    setNewProjectName('')
    setAddingProject(false)
  }

  const toggleProjectFilter = (id) => {
    setActiveProjectId(prev => prev === id ? null : id)
  }

  return (
    <aside
      data-tour="leftpanel"
      style={{
        width: collapsed ? 36 : 256,
        flexShrink: 0,
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--col-sep)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}
    >
      {/* Collapsed state */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          title="Expand"
          style={{
            margin: '10px auto 0',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontSize: 14, cursor: 'pointer', flexShrink: 0,
          }}
        >
          ›
        </button>
      )}

      {!collapsed && (
        <>
          {/* Brain Dump header */}
          <div style={{
            padding: '10px 12px 8px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--text-2)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  Brain Dump
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 600,
                  background: dump.isFull ? '#FEE2E2' : 'var(--surface)',
                  color: dump.isFull ? 'var(--danger)' : 'var(--text-2)',
                  border: `1px solid ${dump.isFull ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 7, padding: '1px 5px',
                }}>
                  {dump.count}
                </span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse"
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 5, width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', flexShrink: 0,
                }}
              >
                ‹
              </button>
            </div>

            {/* Quick add */}
            <div style={{ display: 'flex', gap: 5 }}>
              <input
                style={{
                  flex: 1, padding: '5px 8px', borderRadius: 7,
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  fontSize: 12, color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
                }}
                placeholder="Capture a thought…"
                value={addVal}
                onChange={e => setAddVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddDump() }}
                maxLength={200}
              />
              <button
                onClick={handleAddDump}
                style={{
                  background: 'var(--accent)', border: 'none', borderRadius: 7,
                  width: 26, height: 26,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 16, flexShrink: 0, cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Dump items list */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '4px 6px',
            display: 'flex', flexDirection: 'column',
          }}>
            {visibleItems.length === 0 ? (
              <div style={{
                padding: '16px 8px', textAlign: 'center',
                color: 'var(--text-2)', fontSize: 12, lineHeight: 1.6,
              }}>
                {activeProjectId ? 'No tasks for this project.' : 'Empty your mind.\nDrag tasks to schedule.'}.
              </div>
            ) : (
              <SortableContext items={visibleItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {visibleItems.map(item => (
                  <DumpRow
                    key={item.id}
                    item={item}
                    onRemove={dump.removeItem}
                  />
                ))}
              </SortableContext>
            )}
          </div>

          {/* Projects section */}
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '8px 10px 10px',
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: 'var(--text-2)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: 6,
            }}>
              Projects
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activeProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => toggleProjectFilter(project.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '5px 7px', borderRadius: 6,
                    background: activeProjectId === project.id
                      ? `color-mix(in srgb, ${project.color} 12%, var(--surface))`
                      : 'transparent',
                    border: activeProjectId === project.id
                      ? `1px solid ${project.color}40`
                      : '1px solid transparent',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    width: '100%',
                  }}
                >
                  <ProjectDot color={project.color} />
                  <span style={{
                    flex: 1, fontSize: 12, color: 'var(--text-1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {project.name}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-2)', flexShrink: 0 }}>
                    {dump.items.filter(i => i.project_id === project.id).length || ''}
                  </span>
                </button>
              ))}
            </div>

            {/* Add project */}
            {!projectsFull && (
              addingProject ? (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 5 }}>
                    {PROJECT_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewProjectColor(c)}
                        style={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: c, border: newProjectColor === c ? '2px solid var(--text-1)' : '2px solid transparent',
                          cursor: 'pointer', padding: 0,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <input
                      autoFocus
                      style={{
                        flex: 1, padding: '4px 7px', borderRadius: 6,
                        border: '1px solid var(--border)', background: 'var(--surface)',
                        fontSize: 12, color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
                      }}
                      placeholder="Project name…"
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddProject()
                        if (e.key === 'Escape') { setAddingProject(false); setNewProjectName('') }
                      }}
                      maxLength={60}
                    />
                    <button
                      onClick={handleAddProject}
                      style={{
                        background: 'var(--accent)', border: 'none', borderRadius: 6,
                        width: 24, height: 24,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 14, cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingProject(true)}
                  style={{
                    marginTop: 4, width: '100%', padding: '4px 7px',
                    border: 'none', background: 'transparent',
                    fontSize: 11, color: 'var(--text-2)', textAlign: 'left',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)' }}
                >
                  + New project
                </button>
              )
            )}
          </div>
        </>
      )}
    </aside>
  )
}
