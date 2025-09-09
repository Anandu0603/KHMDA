export interface Member {
  id: string;
  company_name: string;
  mobile: string;
  email: string;
  address: string;
  state: string;
  district: string;
  taluk: string;
  city: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  member_id: string | null;
  membership_fee: number;
  payment_gateway_charges: number;
  expires_at: string | null;
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
  payment_type: 'registration' | 'renewal';
  payment_gateway: 'stripe' | 'razorpay' | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  created_at: string;
}