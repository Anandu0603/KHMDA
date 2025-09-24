export interface Member {
  id: string;
  company_name: string;
  contact_person: string;
  mobile: string;
  alternate_phone: string | null;
  email: string;
  pin_code: string;
  address: string;
  state: string;
  district: string;
  taluk: string;
  city: string;
  gstin: string | null;
  category: string;
  drug_license_url: string | null;
  id_proof_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  joined_at: string | null;
  membership_id: string | null;
  expiry_date: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  membership_fee: number;
  gateway_charges: number;
  donation_amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_type: 'registration' | 'renewal' | 'donation';
  payment_gateway: 'razorpay' | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string; // Foreign key to auth.users.id
  created_at: string;
}

export interface Certificate {
  id: string;
  member_id: string;
  certificate_number: string;
  pdf_url: string;
  valid_until: string;
  generated_at: string;
  created_at: string;
}

export interface Donation {
  id: string;
  donor_name: string | null;
  phone: string | null;
  email: string | null;
  amount: number;
  remarks: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithMember extends Payment {
  member: {
    company_name: string;
    contact_person: string;
    email: string;
  } | null;
}
