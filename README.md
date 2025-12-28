# HuisOS

A household management system for the family. Track chores, tasks, events, and presence across devices.

## Features

- 🏠 **Chores**: Rotating household tasks with automatic assignment
- ✅ **Tasks**: One-off to-dos with assignees and due dates
- 📅 **Events**: Family calendar with reminders
- 👥 **Presence**: Track who's home (morning/afternoon/evening)
- 🎮 **Tokens**: Gamification system for Quinten
- 🔔 **Notifications**: Push notifications for daily overview and reminders

## Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A Vercel account (for deployment)

### 1. Clone the repository

```bash
git clone https://github.com/rogierbrakshoofden/huisos.git
cd huisos
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Seed the initial data from `supabase/seed.sql`
4. Enable real-time for all tables in the Supabase dashboard

### 4. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then update with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings under API.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add your environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

Vercel will automatically deploy on every push to the main branch.

## Project Structure

```
huisos/
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── ...
├── lib/               # Utility functions and configs
│   ├── supabase.ts    # Supabase client
│   └── utils.ts       # Helper functions
├── pages/             # Next.js pages
│   ├── _app.tsx       # App wrapper
│   └── index.tsx      # Dashboard
├── styles/            # Global styles
├── types/             # TypeScript types
└── supabase/          # Database schema and seeds
```

## Family Members

| Initial | Name    | Color  | Hex       |
| ------- | ------- | ------ | --------- |
| R       | Rogier  | Purple | `#8B5CF6` |
| A       | Anne    | Green  | `#22C55E` |
| I       | Isis    | Orange | `#F97316` |
| E       | Elin    | Yellow | `#FACC15` |
| Q       | Quinten | Blue   | `#3B82F6` |

## Development Roadmap

### Phase 1: Core (MVP) - In Progress
- [x] Supabase setup + schema
- [x] Family members seeded
- [x] Next.js project with shadcn/ui
- [x] Chores list + rotation
- [x] Dashboard view
- [x] Complete chore flow (with confetti)
- [ ] Basic mobile responsive

### Phase 2: Tasks & Events
- [ ] Tasks CRUD
- [ ] Events CRUD
- [ ] Calendar week view
- [ ] Quick add modal

### Phase 3: Tokens & Delegation
- [ ] Token display (Quinten)
- [ ] Rewards catalog + spending
- [ ] Chore delegation flow

### Phase 4: Notifications
- [ ] Web Push setup
- [ ] Morning overview (07:30)
- [ ] Incomplete nudge (17:15)
- [ ] Event reminders

### Phase 5: Presence
- [ ] Presence UI
- [ ] Self-toggle interface
- [ ] Presence-aware rotation

### Phase 6: Polish
- [ ] Offline support
- [ ] Animations
- [ ] Linked chores UI
- [ ] Edge cases

## Contributing

This is a personal family project, but feel free to fork it and adapt it for your own household!

## License

MIT
