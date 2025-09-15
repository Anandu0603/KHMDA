## MEMBER-002 - Validate registration inputs

- **Issue Type**: Story
- **Priority**: High
- **Status**: To Do
- **Story Points**: 3
- **Assignee**: 
- **Reporter**: 
- **Labels**: member,validation
- **Components**: frontend
- **Fix Versions**: v1
- **Links**: Relates MEMBER-001

### Description
Add client-side validation for registration inputs.

### Acceptance Criteria
- [ ] Mobile: 10 digits, numeric
- [ ] Email: valid format
- [ ] PIN: 6 digits
- [ ] Required fields enforced; file type/size validated
- [ ] Disable submit until valid; show inline errors

### Impacted Areas
- Pages: `src/pages/MemberRegistration.tsx`
- Components: `src/components/Toast.tsx`
