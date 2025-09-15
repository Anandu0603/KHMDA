## Jira Story Index

This file maps each story to its epic and impacted code areas.

### Epics
- WEBSITE: Website Development
- MEMBER: Membership Registration
- PAYMENT: Demo Payment Flow
- ADMIN: Admin Dashboard & Reports
- RENEW: Membership Renewals
- DONATE: Donations
- EMAIL: Email
- REPORTS: Reports

### Incoming stories

Add entries as stories are added:

| Key | Summary | Epic | File | Impacted Areas |
| --- | --- | --- | --- | --- |
| MEMBER-001 | Registration form UI and fields | MEMBER | docs/jira/stories/MEMBER-001.md | pages: MemberRegistration; components: Toast; types, supabase |
| MEMBER-002 | Validate registration inputs | MEMBER | docs/jira/stories/MEMBER-002.md | pages: MemberRegistration |
| MEMBER-003 | Store registration data in DB | MEMBER | docs/jira/stories/MEMBER-003.md | lib: supabase; types |
| PAYMENT-001 | Demo payment flow page | PAYMENT | docs/jira/stories/PAYMENT-001.md | pages: PaymentSuccess, PaymentCancel; routes |
| PAYMENT-002 | Auto-add payment gateway charges (demo) | PAYMENT | docs/jira/stories/PAYMENT-002.md | pages: PaymentSuccess |
| PAYMENT-003 | Mark member Pending Approval after payment | PAYMENT | docs/jira/stories/PAYMENT-003.md | lib: supabase; pages: PaymentSuccess |
| EMAIL-001 | Confirmation email after payment | EMAIL | docs/jira/stories/EMAIL-001.md | lib: email/supabase |
| ADMIN-001 | Admin secure login | ADMIN | docs/jira/stories/ADMIN-001.md | pages: AdminLogin; contexts: AuthContext |
| ADMIN-002 | Dashboard with status filters | ADMIN | docs/jira/stories/ADMIN-002.md | pages: AdminDashboard |
| ADMIN-003 | Approve/Reject applicants | ADMIN | docs/jira/stories/ADMIN-003.md | lib: supabase; types |
| ADMIN-004 | Generate membership certificate (PDF) | ADMIN | docs/jira/stories/ADMIN-004.md | backend/pdf |
| ADMIN-005 | Send approval email with certificate | ADMIN | docs/jira/stories/ADMIN-005.md | email backend |
| RENEW-001 | Track membership expiry (1 year) | RENEW | docs/jira/stories/RENEW-001.md | lib: supabase; types |
| RENEW-002 | Reminder emails 30 days before expiry | RENEW | docs/jira/stories/RENEW-002.md | email backend |
| RENEW-003 | Renewal via payment link (demo) | RENEW | docs/jira/stories/RENEW-003.md | pages: RenewalPage; lib: supabase |
| DONATE-001 | Donation input during registration | DONATE | docs/jira/stories/DONATE-001.md | pages: MemberRegistration; lib: supabase |
| DONATE-002 | Donation input during renewal | DONATE | docs/jira/stories/DONATE-002.md | pages: RenewalPage; lib: supabase |
| DONATE-003 | Store and report donations | DONATE | docs/jira/stories/DONATE-003.md | pages: ReportsPage; lib: supabase; types |
| WEBSITE-001 | Home Page | WEBSITE | docs/jira/stories/WEBSITE-001.md | pages: HomePage; components: Header |
| WEBSITE-002 | About KMDA Page | WEBSITE | docs/jira/stories/WEBSITE-002.md | pages: HomePage |
| WEBSITE-003 | Vision & Mission Page | WEBSITE | docs/jira/stories/WEBSITE-003.md | pages: HomePage |
| WEBSITE-004 | Executive Committee / Office Bearers Page | WEBSITE | docs/jira/stories/WEBSITE-004.md | pages: HomePage |
| WEBSITE-005 | Membership Information Page | WEBSITE | docs/jira/stories/WEBSITE-005.md | pages: HomePage |
| WEBSITE-006 | News & Announcements Page | WEBSITE | docs/jira/stories/WEBSITE-006.md | pages: HomePage |
| WEBSITE-007 | Contact Us Page | WEBSITE | docs/jira/stories/WEBSITE-007.md | pages: HomePage |

### Code area reference

- Pages: `src/pages/` (e.g., `HomePage.tsx`, `AdminDashboard.tsx`, `MemberRegistration.tsx`, `ReportsPage.tsx`, `RenewalPage.tsx`, `PaymentSuccess.tsx`, `PaymentCancel.tsx`, `HomePage.tsx`)
- Components: `src/components/` (e.g., `Header.tsx`, `Toast.tsx`)
- Contexts: `src/contexts/` (e.g., `AuthContext.tsx`, `ToastContext.tsx`)
- Lib/Services: `src/lib/supabase.ts`
- Types: `src/types/database.ts`
- Routes/Entry: `src/App.tsx`, `src/main.tsx`
- Styles: `src/index.css`, Tailwind config

### Notes
- When adding a story file under `docs/jira/stories/PROJ-123.md`, also add a row to the table above.
- Use the `Impacted Areas` section in each story to keep this index accurate.
