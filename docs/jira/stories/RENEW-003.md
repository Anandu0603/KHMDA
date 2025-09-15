## RENEW-003 - Renewal via payment link (demo payment)

- **Issue Type**: Story
- **Priority**: High
- **Status**: To Do
- **Story Points**: 5
- **Assignee**: 
- **Reporter**: 
- **Labels**: renewals,payment
- **Components**: frontend
- **Fix Versions**: v1
- **Links**: Relates PAYMENT-001

### Description
Provide a renewal flow that leads to the demo payment page and updates validity upon success.

### Acceptance Criteria
- [ ] Renewal link lands on payment with prefilled member
- [ ] On success, extend validity 1 year from current `valid_to`

### Impacted Areas
- Pages: `src/pages/RenewalPage.tsx`
- Services: `src/lib/supabase.ts`
