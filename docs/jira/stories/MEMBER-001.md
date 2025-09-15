## MEMBER-001 - Registration form UI and fields

- **Issue Type**: Story
- **Priority**: High
- **Status**: To Do
- **Story Points**: 5
- **Assignee**: 
- **Reporter**: 
- **Labels**: member,registration,ui
- **Components**: frontend
- **Fix Versions**: v1
- **Links**: Epic MEMBER

### Description
Build a registration form UI to collect company and contact details per scope.

### Acceptance Criteria
- [ ] Fields present: Company Name, Contact Person, Mobile, Alt Phone, Email, PIN, Address (State, District, Taluk, City), GSTIN, Category
- [ ] Upload inputs: Drug License, ID Proof (PDF/JPG/PNG, max 10MB each)
- [ ] Responsive layout and accessible labels
- [ ] Form lives on `src/pages/MemberRegistration.tsx`

### Notes
Refer to shared design for layout. Use Tailwind CSS.

### Impacted Areas
- Pages: `src/pages/MemberRegistration.tsx`
- Components: `src/components/Toast.tsx`
- Contexts/State: 
- Types/DB: `src/types/database.ts`
- Services: `src/lib/supabase.ts`
