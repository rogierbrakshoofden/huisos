# Cleanup Status - Jan 2, 2026

## ✅ Completed (Phases 1-2)

### Phase 1: Legacy Routes Deleted
- ✅ `pages/v2.tsx` - Full 25KB standalone v2 app
- ✅ `pages/v3.tsx` - Thin wrapper to v3 architecture

### Phase 2: Documentation Cleanup
- ✅ All PHASE-*.md files removed from root
- ✅ `docs/` directory removed
- ✅ New `README.md` created with v4 architecture

## ⏳ In Progress (Phase 3)

### Legacy Components to Remove
The following v2/v3 components in `components/` are unused by v4 and should be deleted:

**Files:**
```
components/NotificationButton.tsx
components/add-button.tsx
components/add-modal.tsx
components/assignee-circles.tsx
components/bottom-nav.tsx
components/diagnostics-footer.tsx
components/event-modal.tsx
components/family-member-circle.tsx
components/my-rewards-tab.tsx
components/presence-indicator.tsx
components/reward-store-modal.tsx
components/stats-tab.tsx
components/subtask-progress-pie.tsx
components/task-list-item.tsx
components/task-modal.tsx
components/token-widget.tsx
components/user-switcher.tsx
components/.gitkeep
```

**Directory:**
```
components/tabs/
```

### Keep These:
```
components/ui/          # shadcn/ui components (shared)
components/v4/          # Production v4 components
```

## 🔜 TODO (Phase 4)

### Library Cleanup
Review and confirm these `lib/` files are still needed by v4:
- `lib/context-v2.tsx` ✓ (used by v4)
- `lib/hooks-v2-enhanced.ts` ✓ (used by v4)  
- `lib/hooks-v2.ts` ❓ (check if used)
- `lib/hooks/` ✓ (used by v4)
- `lib/supabase.ts` ✓ (core)
- `lib/utils.ts` ✓ (core)
- `lib/toast.tsx` ✓ (used by v4)
- `lib/notification-service.ts` ✓ (PWA)

## Manual Cleanup Commands

To finish Phase 3 locally:
```bash
# Delete legacy component files
rm components/NotificationButton.tsx
rm components/add-button.tsx
rm components/add-modal.tsx
rm components/assignee-circles.tsx
rm components/bottom-nav.tsx
rm components/diagnostics-footer.tsx
rm components/event-modal.tsx
rm components/family-member-circle.tsx
rm components/my-rewards-tab.tsx
rm components/presence-indicator.tsx
rm components/reward-store-modal.tsx
rm components/stats-tab.tsx
rm components/subtask-progress-pie.tsx
rm components/task-list-item.tsx
rm components/task-modal.tsx
rm components/token-widget.tsx
rm components/user-switcher.tsx
rm components/.gitkeep
rm -rf components/tabs/

# Commit
git add -A
git commit -m "cleanup: Remove all legacy v2/v3 components"
git push
```

## Branch Cleanup

```bash
git push origin --delete feature/huisos-v2
```

## Final Structure

After completion, the repo should look like:
```
components/
  ui/           # shadcn components
  v4/           # All production components
lib/            # State & hooks  
pages/
  v4.tsx        # Production entry
  diagnostics.tsx
  pwa.tsx
  pwa-diagnostics.tsx
  index.tsx     # Redirects to /v4
types/
supabase/
public/
```

## Notes
- Stopped mid-cleanup to avoid hitting Vercel's 50 commit/day limit
- All critical routes and docs are cleaned up
- Component cleanup is straightforward - just delete the listed files
- No functional impact - v4 is completely independent
