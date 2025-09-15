## Epic: Website Development (Responsive, Secure, SEO-friendly)

Scope:
- Pages: Home, About KMDA, Vision & Mission, Executive Committee / Office Bearers, Membership Information, News & Announcements, Contact Us, up to 3 additional pages.
- Requirements: Responsive, SEO meta, performance, accessibility, security headers.
- Deliverables: Implement pages, navigation, header/footer, SEO tags, sitemap, analytics hooks.

## Epic: Membership Registration Module (Web)

Scope:
- Online form with fields: Name, Contact Details, Firm Name, GSTIN, State, District, Taluk, City, Category (Retailer, Distributor, Stockist, etc.).
- Document uploads: Drug licenses, ID proof, etc.
- Unique KMDA Membership ID generation.
- Digital certificate creation post-registration.
- Optional additional donations during registration and renewal.

## Epic: Demo Payment Flow (No live gateway)

Scope:
- Use an in-app demo payment page (no Razorpay/Stripe in this phase).
- Add PG charges on top of membership cost (demo calculation).
- Send confirmation email on success.
- Mark member status as Pending Approval post "payment".
- Config via .env: BACKEND_URL, RESEND_API_KEY (optional if email needed).

## Epic: Admin Dashboard and Reports

Scope:
- Admin login (no signup).
- View registered members; Approve/Reject applicants.
- On approval: Generate Unique ID (KMDA 1111 format) and certificate with expiry (1-year validity).
- Reports: Registration Summary, Payment Collection Report, District-wise Member List.
- Export: Excel and PDF.
As a user, I want to fill out a registration form with full company and contact details so that I can apply for membership.

Fields: Company Name, Contact Person Name, Mobile, Alternate Phone Number, Email, PIN Code, Office Address (State, District, Taluk, City).

GST ID

Upload Drug License of the company

Include below comments

• Valid Drug License (if applicable)

• Government ID Proof (Aadhar/PAN)

• Files should be in PDF, JPG, or PNG format

• Maximum file size: 10MB per document

 

Tasks:

T1.1: Build registration form UI( Refer  the design in the reference shared)

T1.2: Validate inputs (mobile, email, PIN code).

T1.3: Store data in db.
Description

Goal: Basic app setup + Registration + Payment working

US1.1: Registration form (Company, Mobile, Email, State, District, Taluk, City)

US1.2: Redirect to demo payment page after form submission

US1.3: Auto-add payment gateway charges (demo)

US1.4: Save member with “Pending Approval” after payment

US1.5: Send confirmation email after payment success

Description

As a user, after submitting the form, I want to pay online so that my application is valid.

Tasks:

T1.4: Demo payment flow (no live gateway).

T1.5: Auto-add gateway charges (demo calc).

T1.6: On success → Save member with status = Pending Approval.

US1.3 Confirmation Email


Description

As a user, I want to get a confirmation email after payment so that I know my application is under review.

Tasks:

T1.7: Configure SMTP/resend.com (optional via RESEND_API_KEY)

T1.8: Auto-send email with application details.

Epic 2: Admin Panel


Description

🎯 Goal: Admin can log in and manage pending applications

US2.1: Admin secure login (credentials from backend)

US2.2: Dashboard with filters (Pending, Approved, Rejected, Expired)

US2.3: Approve member → generate unique ID (KMDA 1111)

US2.4: Generate PDF certificate with 1-year validity

US2.5: Send approval email with certificate

US2.6: Reject member → rejection email
US 2.1 - Admin Login


Description

US2.1 – Admin Login

As an admin, I want to log in securely so I can access the dashboard.
 No option to sign up, Credentials to be created from db.

Tasks:

 T2.1: JWT-based login ( TBD)

 T2.2: Backend credential seeding.

 US2.2 – Dashboard


Description

 As an admin, I want to see all members categorized by status (Pending, Approved, Rejected, Expired).

Tasks:
 T2.3: Build dashboard UI, 
T2.4: API for member list with filters.
US2.3 – Approve/Reject


Description

As an admin, I want to approve/reject applications so membership can be confirmed or denied.

Tasks: 
T2.5: Approve flow → generate unique ID (KMDA 1111).
 T2.6: Reject flow → rejection email.
 US2.4 – Certificate Generation


Description

As an admin, I want the membership certificate to be generated automatically so members get proof of membership.

Tasks: 

T2.7: PDF template (KMDA logo, name, Unique ID, validity).

T2.8: Email certificate to member.

T2.9 - Store Certificate for future download(Regeneration is also fine)
Epic 3: Membership Renewals


Description

Goal: Membership lifecycle automation

US3.1: Track expiry dates (1 year)

US3.2: Auto reminder emails 30 days before expiry

US3.3: Renewal via payment link

US3.4: Expired members visible in dashboard with “Renew” option
US3.1 – Expiry Tracking


Description

As a system, I want to track expiry dates so memberships auto-expire after 1 year.
US3.2 – Renewal Reminders


Description

As a user, I want a reminder 30 days before expiry so I can renew on time.
US3.3 – Renewal Flow


Description

As a user, I want to renew by paying again so I can extend validity.
TO be deleted


Description

As an admin, I want to approve renewals and issue new certificates.
US3.5 – Expired Members View


Description

As an admin, I want to view expired members so I can manage renewals.
Epic 4: Donations


Description

🎯 Goal: Allow donations during registration/renewal

US4.1: Donation input in registration

US4.2: Donation input in renewal

US4.3: Store donation data in DB

US4.4: Admin can view donations in reports
US4.1 – Donation at Registration


Description

US4.1 – Donation at Registration

As a user, I want to optionally add a donation amount when registering.
US4.2 – Donation at Renewal


Description

As a user, I want to optionally donate when renewing.
US4.3 – Donation Storage


Description

As a system, I want to store donation amounts for reporting.
US4.4 – Donation Reports


Description

As an admin, I want to see donations in reports.
