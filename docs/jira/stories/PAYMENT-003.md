## PAYMENT-003 - Mark member Pending Approval after payment

- **Issue Type**: Story
- **Priority**: High
- **Status**: To Do
- **Story Points**: 2
- **Assignee**: 
- **Reporter**: 
- **Labels**: payment,status
- **Components**: backend
- **Fix Versions**: v1
- **Links**: Relates PAYMENT-001, MEMBER-003

### Description
On demo payment success, update member record to status = Pending Approval.

### Acceptance Criteria
- [ ] Payment success triggers status update
- [ ] Redirect to `PaymentSuccess` after update
- [ ] Error path shows toast and remains on payment page

### Impacted Areas
- Services: `src/lib/supabase.ts`
- Pages: `src/pages/PaymentSuccess.tsx`
