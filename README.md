# planyourweek.co

A focused weekly planner. Plan your week in minutes, not hours.

## What it does

- **This Week** — Up to 20 tasks across Work, Personal, or custom project lists
- **Milestones** — 3 weekly goals at the top ("What will move the needle this week?")
- **Day columns** — Drag tasks from lists into daily slots (Deep Work, Focus, Other)
- **Capture** — Unlimited inbox for ideas and tasks to schedule later
- **Week navigation** — Rolling 7-day view anchored to today, navigate forward/back
- **Timer** — Per-task focus timer with custom h/min input
- **Rituals** — Daily startup (review yesterday, plan today) and shutdown (triage unfinished)
- **End of Week** — Review and reset flow
- **Dark/light mode**
- **Sign in with magic link** — Sync across devices via Supabase

## Tech stack

- React 19 + Vite 8
- @dnd-kit (drag and drop)
- Supabase (auth + data, optional — works offline with localStorage)
- DM Sans font
- CSS custom properties for theming

## Local development

```bash
npm install
npm run dev
```

Create a `.env.local` with your Supabase credentials:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Without these, the app runs fully in guest mode using localStorage.

## Deploy

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or any static host. A `vercel.json` is included for SPA routing.
