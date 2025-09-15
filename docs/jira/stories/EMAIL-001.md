## EMAIL-001 - Confirmation email after payment (optional via Resend)

- **Issue Type**: Story
- **Priority**: Medium
- **Status**: To Do
- **Story Points**: 3
- **Assignee**: 
- **Reporter**: 
- **Labels**: email
- **Components**: backend
- **Fix Versions**: v1
- **Links**: Relates PAYMENT-001

### Description
Send an email to the applicant after payment success indicating the application is under review.

### Acceptance Criteria
- [ ] Email template with application summary
- [ ] Uses `RESEND_API_KEY` if provided; otherwise no-op
- [ ] Logged events for success/failure

### Impacted Areas
- Services: `src/lib/supabase.ts`
