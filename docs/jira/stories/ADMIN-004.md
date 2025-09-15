## ADMIN-004 - Generate membership certificate (PDF)

- **Issue Type**: Story
- **Priority**: High
- **Status**: To Do
- **Story Points**: 5
- **Assignee**: 
- **Reporter**: 
- **Labels**: admin,certificate
- **Components**: backend
- **Fix Versions**: v1
- **Links**: Relates ADMIN-003

### Description
Generate a PDF membership certificate with KMDA logo, member name, unique ID, and validity date (1-year).

### Acceptance Criteria
- [ ] PDF template rendered with dynamic data
- [ ] File stored (or regenerable) and downloadable
- [ ] Linked from admin view and email attachment

### Impacted Areas
- Services: backend/PDF gen
- Types/DB: `src/types/database.ts`
