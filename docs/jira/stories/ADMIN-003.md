## ADMIN-003 - Approve/Reject applicants

- **Issue Type**: Story
- **Priority**: High
- **Status**: To Do
- **Story Points**: 5
- **Assignee**: 
- **Reporter**: 
- **Labels**: admin,workflow
- **Components**: backend
- **Fix Versions**: v1
- **Links**: Relates ADMIN-002

### Description
Approve or reject applications, updating status and notes.

### Acceptance Criteria
- [ ] Approve sets status=Approved and assigns unique ID (KMDA 1111 format)
- [ ] Reject sets status=Rejected with reason
- [ ] Actions auditable

### Impacted Areas
- Services: `src/lib/supabase.ts`
- Types/DB: `src/types/database.ts`
