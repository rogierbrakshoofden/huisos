# HuisOS

Family coordination system - chores, tasks, events, and presence tracking.

## Current Architecture (v4)

**Production App:** `/v4` → `components/v4/`

### Key Features
- Automatic chore rotation
- Task management with subtasks
- Token-based gamification system
- Event calendar
- Presence tracking
- PWA support with offline functionality
- Real-time synchronization via Supabase

### Tech Stack
- Next.js 14 (Pages Router)
- TypeScript
- Tailwind CSS
- Supabase (Database + Realtime)
- Deployed on Vercel

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Structure

```
pages/
  v4.tsx              # Production app entry
  diagnostics.tsx     # System diagnostics
  
components/
  v4/                 # Production components
  ui/                 # shadcn/ui components
  
lib/
  context-v2.tsx      # App state management
  hooks-v2-enhanced.ts # Realtime sync
  hooks/              # Custom hooks
  
types/
  huisos-v2.ts        # TypeScript types
```

## Notes

- Legacy v2/v3 routes and components have been removed
- All production functionality is in v4
- Database schema defined in `supabase/migrations/`

---

**Build:** v1.0.0
