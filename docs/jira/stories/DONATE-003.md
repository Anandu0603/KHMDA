## DONATE-003 - Store and report donations

- **Issue Type**: Story
- **Priority**: Medium
- **Status**: To Do
- **Story Points**: 3
- **Assignee**: 
- **Reporter**: 
- **Labels**: donation,reporting
- **Components**: backend
- **Fix Versions**: v1
- **Links**: Relates DONATE-001, DONATE-002

### Description
Persist donation amounts and expose them in admin reports.

### Acceptance Criteria
- [ ] Donation amount stored with member/payment
- [ ] Admin reports show donation totals and per-member

### Impacted Areas
- Pages: `src/pages/ReportsPage.tsx`
- Services: `src/lib/supabase.ts`
- Types/DB: `src/types/database.ts`
