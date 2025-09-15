## ADMIN-001 - Admin secure login (no signup)

- **Issue Type**: Story
- **Priority**: High
- **Status**: To Do
- **Story Points**: 5
- **Assignee**: 
- **Reporter**: 
- **Labels**: admin,auth
- **Components**: frontend,backend
- **Fix Versions**: v1
- **Links**: Epic ADMIN

### Description
Implement admin login using credentials provisioned in the backend.

### Acceptance Criteria
- [ ] Login page at `/admin`
- [ ] JWT/session handled in `src/contexts/AuthContext.tsx`
- [ ] No signup; credentials seeded server-side

### Impacted Areas
- Pages: `src/pages/AdminLogin.tsx`
- Contexts: `src/contexts/AuthContext.tsx`
