create table dump_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  category text,
  is_placed boolean default false,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  outcome text not null,
  next_action text,
  status text default 'active',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  mit_1 text,
  mit_2 text,
  mit_3 text,
  mit_1_project_id uuid references projects(id),
  mit_2_project_id uuid references projects(id),
  mit_3_project_id uuid references projects(id),
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  weekly_plan_id uuid references weekly_plans(id) on delete cascade,
  project_id uuid references projects(id),
  dump_item_id uuid references dump_items(id),
  content text not null,
  task_type text not null,
  day_of_week int not null,
  duration_minutes int default 30,
  mit_link text,
  is_complete boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table weekly_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  neglected_projects jsonb,
  reflection text,
  completed_at timestamptz default now()
);

alter table dump_items enable row level security;
alter table projects enable row level security;
alter table weekly_plans enable row level security;
alter table tasks enable row level security;
alter table weekly_resets enable row level security;

create policy "Users own their dump items" on dump_items for all using (auth.uid() = user_id);
create policy "Users own their projects" on projects for all using (auth.uid() = user_id);
create policy "Users own their weekly plans" on weekly_plans for all using (auth.uid() = user_id);
create policy "Users own their tasks" on tasks for all using (auth.uid() = user_id);
create policy "Users own their resets" on weekly_resets for all using (auth.uid() = user_id);
