# Pitty Work Log

Full-stack work session tracker built with Next.js App Router, Supabase Auth, Supabase Postgres, RLS, and Vercel deployment in mind.

## Environment

Create `.env.local` locally and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

`.env.local` is ignored by git.

## Install And Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Database Setup

Run the SQL migration in `supabase/migrations/0001_initial_schema.sql` against the existing Supabase project named `Pitty's Project`.

With the Supabase CLI, link the project and push:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

Or paste the migration into the Supabase SQL editor and run it once.

After creating Auth users, insert matching profile rows:

```sql
insert into public.profiles (id, role, full_name)
values
  ('worker-auth-user-id', 'worker', 'Pitty'),
  ('client-auth-user-id', 'client', 'Client Name');
```

## Security Notes

The sensitive worker payment value lives only in `public.work_sessions.amount_eur`.

Client users are routed to `/client`, and that route reads only:

```ts
supabase.from("work_sessions_client_view")
```

The `work_sessions_client_view` SQL view exposes only `worker_id`, `work_type`, `start_time`, and `end_time`. It has no money column. Client profiles also have no RLS policy allowing direct reads from `public.work_sessions`, so direct table queries do not reveal worker-only values.

Worker users are routed to `/worker`, where the base table is used for their own rows and totals.

## Deploy To Vercel

1. Push this repository to Git.
2. Import it into Vercel as a Next.js project.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Project Settings.
4. Deploy.

The build command is `npm run build`; Vercel detects the Next.js app automatically.
