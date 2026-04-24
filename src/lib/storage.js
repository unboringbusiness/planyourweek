// localStorage fallback layer.
// Every function returns { data, error } to mirror Supabase response shapes,
// so hooks can swap between local and remote storage transparently.

const KEYS = {
  DUMP: "pyw_dump",
  PROJECTS: "pyw_projects",
  WEEK: "pyw_week",
  TASKS: "pyw_tasks",
};

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function uuid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

// ─── Dump Items ───────────────────────────────────────────────────────────────

export const dumpStorage = {
  getAll() {
    try {
      const items = read(KEYS.DUMP) ?? [];
      return { data: items, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  add(content, category = null) {
    try {
      const items = read(KEYS.DUMP) ?? [];
      const item = {
        id: uuid(),
        content,
        category,
        is_placed: false,
        created_at: now(),
      };
      items.push(item);
      write(KEYS.DUMP, items);
      return { data: item, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  update(id, changes) {
    try {
      const items = read(KEYS.DUMP) ?? [];
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return { data: null, error: new Error("Item not found") };
      items[index] = { ...items[index], ...changes };
      write(KEYS.DUMP, items);
      return { data: items[index], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  remove(id) {
    try {
      const items = read(KEYS.DUMP) ?? [];
      const filtered = items.filter((i) => i.id !== id);
      write(KEYS.DUMP, filtered);
      return { data: { id }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectStorage = {
  getAll() {
    try {
      const projects = read(KEYS.PROJECTS) ?? [];
      return { data: projects, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  add(name, outcome, nextAction = null) {
    try {
      const projects = read(KEYS.PROJECTS) ?? [];
      const project = {
        id: uuid(),
        name,
        outcome,
        next_action: nextAction,
        status: "active",
        sort_order: projects.length,
        created_at: now(),
      };
      projects.push(project);
      write(KEYS.PROJECTS, projects);
      return { data: project, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  update(id, changes) {
    try {
      const projects = read(KEYS.PROJECTS) ?? [];
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) return { data: null, error: new Error("Project not found") };
      projects[index] = { ...projects[index], ...changes };
      write(KEYS.PROJECTS, projects);
      return { data: projects[index], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  remove(id) {
    try {
      const projects = read(KEYS.PROJECTS) ?? [];
      const filtered = projects.filter((p) => p.id !== id);
      write(KEYS.PROJECTS, filtered);
      return { data: { id }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  reorder(orderedIds) {
    try {
      const projects = read(KEYS.PROJECTS) ?? [];
      const reordered = orderedIds
        .map((id, index) => {
          const project = projects.find((p) => p.id === id);
          return project ? { ...project, sort_order: index } : null;
        })
        .filter(Boolean);
      write(KEYS.PROJECTS, reordered);
      return { data: reordered, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// ─── Weekly Plan ──────────────────────────────────────────────────────────────

export const weekStorage = {
  get(weekStart) {
    try {
      const plans = read(KEYS.WEEK) ?? [];
      const plan = plans.find((p) => p.week_start === weekStart) ?? null;
      return { data: plan, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  upsert(weekStart, fields) {
    try {
      const plans = read(KEYS.WEEK) ?? [];
      const index = plans.findIndex((p) => p.week_start === weekStart);
      if (index === -1) {
        const plan = {
          id: uuid(),
          week_start: weekStart,
          mit_1: null,
          mit_2: null,
          mit_3: null,
          mit_1_project_id: null,
          mit_2_project_id: null,
          mit_3_project_id: null,
          created_at: now(),
          ...fields,
        };
        plans.push(plan);
        write(KEYS.WEEK, plans);
        return { data: plan, error: null };
      }
      plans[index] = { ...plans[index], ...fields };
      write(KEYS.WEEK, plans);
      return { data: plans[index], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const taskStorage = {
  getByWeek(weekStart) {
    try {
      const tasks = read(KEYS.TASKS) ?? [];
      const filtered = tasks.filter((t) => t.week_start === weekStart);
      return { data: filtered, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  add(weekStart, fields) {
    try {
      const tasks = read(KEYS.TASKS) ?? [];
      const task = {
        id: uuid(),
        week_start: weekStart,
        project_id: null,
        dump_item_id: null,
        duration_minutes: 30,
        mit_link: null,
        is_complete: false,
        sort_order: tasks.filter((t) => t.week_start === weekStart && t.day_of_week === fields.day_of_week).length,
        created_at: now(),
        ...fields,
      };
      tasks.push(task);
      write(KEYS.TASKS, tasks);
      return { data: task, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  update(id, changes) {
    try {
      const tasks = read(KEYS.TASKS) ?? [];
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) return { data: null, error: new Error("Task not found") };
      tasks[index] = { ...tasks[index], ...changes };
      write(KEYS.TASKS, tasks);
      return { data: tasks[index], error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  remove(id) {
    try {
      const tasks = read(KEYS.TASKS) ?? [];
      const filtered = tasks.filter((t) => t.id !== id);
      write(KEYS.TASKS, filtered);
      return { data: { id }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  reorder(dayTasks) {
    // dayTasks: [{ id, sort_order }]
    try {
      const tasks = read(KEYS.TASKS) ?? [];
      dayTasks.forEach(({ id, sort_order }) => {
        const index = tasks.findIndex((t) => t.id === id);
        if (index !== -1) tasks[index] = { ...tasks[index], sort_order };
      });
      write(KEYS.TASKS, tasks);
      return { data: tasks, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
