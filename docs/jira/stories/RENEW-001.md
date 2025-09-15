## RENEW-001 - Track membership expiry (1 year)

- **Issue Type**: Story
- **Priority**: High
- **Status**: To Do
- **Story Points**: 3
- **Assignee**: 
- **Reporter**: 
- **Labels**: renewals
- **Components**: backend
- **Fix Versions**: v1
- **Links**: Epic RENEWALS

### Description
Track membership start and expiry dates; auto-mark expired after 1 year.

### Acceptance Criteria
- [ ] Store `valid_from` and `valid_to` per member
- [ ] Nightly job or on-access check marks expired

### Impacted Areas
- Services: `src/lib/supabase.ts`
- Types/DB: `src/types/database.ts`
