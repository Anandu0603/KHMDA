## PAYMENT-001 - Demo payment flow page (no live gateway)

- **Issue Type**: Story
- **Priority**: High
- **Status**: To Do
- **Story Points**: 5
- **Assignee**: 
- **Reporter**: 
- **Labels**: payment,demo
- **Components**: frontend
- **Fix Versions**: v1
- **Links**: Epic PAYMENT

### Description
Implement an in-app demo payment page to simulate payment success/failure.

### Acceptance Criteria
- [ ] Page at `/pay` to review fees and simulate success
- [ ] Demo charges added on top of membership fee
- [ ] On success, navigate to `PaymentSuccess` page; on cancel to `PaymentCancel`
- [ ] Uses env: `VITE_BACKEND_URL`

### Impacted Areas
- Pages: `src/pages/PaymentSuccess.tsx`, `src/pages/PaymentCancel.tsx`
- Routes: `src/App.tsx`
