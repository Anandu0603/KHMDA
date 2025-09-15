## MEMBER-003 - Store registration data in DB

- **Issue Type**: Story
- **Priority**: High
- **Status**: To Do
- **Story Points**: 5
- **Assignee**: 
- **Reporter**: 
- **Labels**: member,backend
- **Components**: backend, supabase
- **Fix Versions**: v1
- **Links**: Relates MEMBER-001

### Description
Persist registration data and document metadata to the database.

### Acceptance Criteria
- [ ] On submit, save form data to `members` table in Supabase
- [ ] Upload documents to storage; store URLs in DB
- [ ] Initial status set to Draft/Pending Payment until payment completes

### Notes
Follow types in `src/types/database.ts`.

### Impacted Areas
- Services: `src/lib/supabase.ts`
- Types/DB: `src/types/database.ts`
