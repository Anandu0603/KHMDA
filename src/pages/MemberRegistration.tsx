import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface FormData {
  companyName: string;
  contactPerson: string;
  mobile: string;
  alternatePhone: string;
  email: string;
  pinCode: string;
  address: string;
  state: string;
  district: string;
  taluk: string;
  city: string;
  gstin: string;
  category: string;
  donationAmount: number;
  drugLicense: File | null;
  idProof: File | null;
}

interface FormErrors {
  [key: string]: string;
}

const MEMBERSHIP_FEE = 500;

export default function MemberRegistration() {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactPerson: '',
    mobile: '',
    alternatePhone: '',
    email: '',
    pinCode: '',
    address: '',
    state: 'Kerala',
    district: '',
    taluk: '',
    city: '',
    gstin: '',
    category: '',
    donationAmount: 0,
    drugLicense: null,
    idProof: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const paymentGatewayCharges = 0.02 * (MEMBERSHIP_FEE + formData.donationAmount);
  const totalAmount = MEMBERSHIP_FEE + paymentGatewayCharges + formData.donationAmount;

  const keraladDistricts = [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam',
    'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta',
    'Thiruvananthapuram', 'Thrissur', 'Wayanad'
  ];

  const memberCategories = [
    'Retailer', 'Distributor', 'Stockist', 'Wholesaler', 'Manufacturer', 'Other'
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = 'Mobile number must be 10 digits';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!/^\d{6}$/.test(formData.pinCode)) newErrors.pinCode = 'PIN code must be 6 digits';
    if (!formData.companyName) newErrors.companyName = 'Company name is required';
    if (!formData.contactPerson) newErrors.contactPerson = 'Contact person is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.district) newErrors.district = 'District is required';
    if (!formData.taluk) newErrors.taluk = 'Taluk is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.drugLicense) newErrors.drugLicense = 'Drug License is required';
    if (!formData.idProof) newErrors.idProof = 'ID Proof is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'drugLicense' | 'idProof') => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [field]: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    
    // Check for configuration issues first
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
      const configError = 'Supabase configuration error: Please update your .env file with real Supabase credentials. See SUPABASE_SETUP_GUIDE.md for instructions.';
      addToast(configError, 'error');
      setSubmissionError(configError);
      return;
    }
    
    if (!supabaseKey || supabaseKey.includes('your-anon-key')) {
      const configError = 'Supabase API key missing: Please add your real anon key to the .env file. See SUPABASE_SETUP_GUIDE.md for instructions.';
      addToast(configError, 'error');
      setSubmissionError(configError);
      return;
    }
    
    if (!validateForm()) {
      addToast('Please fix the errors in the form', 'error');
      return;
    }
    
    setLoading(true);

    try {
      const uploadFile = async (file: File, userEmail: string): Promise<string> => {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const fileName = `${timestamp}.${fileExt}`;
        const filePath = `${userEmail.replace(/[@.]/g, '_')}/${fileName}`;

        try {
          // Validate file before upload
          if (!file || file.size === 0) {
            throw new Error(`Invalid file: ${file.name}`);
          }

          if (file.size > 10485760) { // 10MB limit
            throw new Error(`File too large: ${file.name}. Maximum size is 10MB`);
          }

          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
          if (!allowedTypes.includes(file.type)) {
            throw new Error(`Invalid file type: ${file.type}. Allowed types: JPEG, PNG, PDF`);
          }

          console.log(`Uploading file: ${file.name} (${file.type}, ${file.size} bytes) to path: ${filePath}`);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('member-documents')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error details:', uploadError);
            if (uploadError.message.includes('already exists')) {
              // Try with a different timestamp
              const newFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
              const newFilePath = `${userEmail.replace(/[@.]/g, '_')}/${newFileName}`;
              
              const { data: retryData, error: retryError } = await supabase.storage
                .from('member-documents')
                .upload(newFilePath, file, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (retryError) {
                throw new Error(`Upload failed after retry for ${file.name}: ${retryError.message}`);
              }
              
              const { data: { publicUrl } } = supabase.storage
                .from('member-documents')
                .getPublicUrl(newFilePath);
                
              return publicUrl;
            } else {
              throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
            }
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('member-documents')
            .getPublicUrl(filePath);
            
          console.log(`File uploaded successfully: ${publicUrl}`);
          return publicUrl;
          
        } catch (error: any) {
          console.error('Upload error:', error);
          throw new Error(`File upload failed: ${error.message || 'Storage service unavailable'}`);
        }
      };

      let drugLicenseUrl = '';
      if (formData.drugLicense) {
        addToast('Uploading Drug License...', 'info');
        drugLicenseUrl = await uploadFile(formData.drugLicense, formData.email);
      }

      let idProofUrl = '';
      if (formData.idProof) {
        addToast('Uploading ID Proof...', 'info');
        idProofUrl = await uploadFile(formData.idProof, formData.email);
      }
      
      addToast('Submitting registration...', 'info');

      console.log('Inserting member data:', JSON.stringify({
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        mobile: formData.mobile,
        alternate_phone: formData.alternatePhone || null,
        email: formData.email,
        pin_code: formData.pinCode,
        address: formData.address,
        state: formData.state,
        district: formData.district,
        taluk: formData.taluk,
        city: formData.city,
        gstin: formData.gstin || null,
        category: formData.category,
        drug_license_url: drugLicenseUrl || null,
        id_proof_url: idProofUrl || null,
        status: 'pending',
      }, null, 2));

      const memberData: any = {
        company_name: formData.companyName,
        contact_person: formData.contactPerson,
        mobile: formData.mobile,
        alternate_phone: formData.alternatePhone || null,
        email: formData.email,
        pin_code: formData.pinCode,
        address: formData.address,
        state: formData.state,
        district: formData.district,
        taluk: formData.taluk,
        city: formData.city,
        gstin: formData.gstin || null,
        category: formData.category,
        drug_license_url: drugLicenseUrl || null,
        id_proof_url: idProofUrl || null,
        status: 'pending',
        // joined_at, created_at, updated_at are auto-generated by database
      };

      console.log('Executing members insert with data:', JSON.stringify(memberData, null, 2));
      console.log('Supabase client config - URL:', supabaseUrl, 'Key length:', supabaseKey?.length);
      
      const { data: member, error: memberError } = await supabase.from('members').insert(memberData).select().single();
      
      if (memberError) {
        console.error('Full memberError object:', JSON.stringify(memberError, null, 2));
        console.error('Member error details:', {
          message: memberError.message,
          code: memberError.code,
          details: memberError.details,
          hint: memberError.hint
        });
        throw new Error(`Failed to create member record: ${memberError.message}${memberError.details ? ` - ${memberError.details}` : ''}`);
      }

      const paymentDataInsert = {
        member_id: member.id,
        amount: totalAmount,
        membership_fee: MEMBERSHIP_FEE,
        gateway_charges: paymentGatewayCharges,
        donation_amount: formData.donationAmount,
        status: 'pending',
        payment_type: 'registration',
      };

      const { error: paymentError } = await supabase.from('payments').insert(paymentDataInsert);
      if (paymentError) {
        console.warn('Payment record creation failed, but member was created');
      }

      const paymentData = { 
        memberId: member.id, amount: totalAmount, membershipFee: MEMBERSHIP_FEE,
        gatewayCharges: paymentGatewayCharges, donationAmount: formData.donationAmount,
        companyName: formData.companyName, contactPerson: formData.contactPerson,
        email: formData.email, mobile: formData.mobile,
      };
      
      sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
      addToast('Registration submitted successfully! Redirecting to payment...', 'success');
      navigate('/payment/razorpay', { state: paymentData, replace: false });

    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = `Registration failed: ${error.message}`;
      
      if (error.code === '23505') {
        errorMessage = 'This email address is already registered. Please use a different email.';
        setErrors(prev => ({ ...prev, email: errorMessage }));
      } else if (error.message && error.message.includes('security policy')) {
        errorMessage = `A security policy is blocking the registration. Please contact support. (Error: ${error.message})`;
      } else if (error.message && error.message.includes('signature verification failed')) {
        errorMessage = 'File upload failed due to security settings. Please try again or contact support if the issue persists.';
      } else if (error.message && error.message.includes('File upload failed')) {
        errorMessage = error.message; // Keep the detailed file upload error message
      } else if (error.message && error.message.includes('Invalid file')) {
        errorMessage = error.message; // Keep the detailed file validation error message
      }
      
      addToast(errorMessage, 'error');
      setSubmissionError(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Join KMDA</h1>
            <p className="text-sm sm:text-base text-gray-600">Register as a member of Kerala Medical Distributors Association</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-emerald-700" />
                Company Information
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input type="text" name="companyName" required value={formData.companyName} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm sm:text-base ${errors.companyName ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.companyName && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.companyName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Name *</label>
                <input type="text" name="contactPerson" required value={formData.contactPerson} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm sm:text-base ${errors.contactPerson ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.contactPerson && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.contactPerson}</p>}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center"><Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-emerald-700" />Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${errors.mobile ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone Number</label>
                  <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                  <input type="text" name="pinCode" required value={formData.pinCode} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${errors.pinCode ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.pinCode && <p className="text-red-500 text-sm mt-1">{errors.pinCode}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center"><MapPin className="h-5 w-5 mr-2 text-emerald-700" />Office Address</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Address *</label>
                <textarea name="address" required rows={3} value={formData.address} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${errors.address ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input type="text" name="state" value={formData.state} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                  <select name="district" required value={formData.district} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${errors.district ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Select District</option>
                    {keraladDistricts.map(district => <option key={district} value={district}>{district}</option>)}
                  </select>
                  {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taluk *</label>
                  <input type="text" name="taluk" required value={formData.taluk} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${errors.taluk ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.taluk && <p className="text-red-500 text-sm mt-1">{errors.taluk}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input type="text" name="city" required value={formData.city} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${errors.city ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center"><Building2 className="h-5 w-5 mr-2 text-emerald-700" />Business Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                  <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="15-character GSTIN (optional)" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Category *</label>
                  <select name="category" required value={formData.category} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${errors.category ? 'border-red-500' : 'border-gray-300'}`}>
                    <option value="">Select Category</option>
                    {memberCategories.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center"><Building2 className="h-5 w-5 mr-2 text-emerald-700" />Required Documents</h2>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                <h3 className="font-semibold text-blue-900 text-sm mb-2">Document Requirements:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Valid Drug License (if applicable)</li>
                  <li>• Government ID Proof (Aadhar/PAN)</li>
                  <li>• Files should be in PDF, JPG, or PNG format</li>
                  <li>• Maximum file size: 10MB per document</li>
                </ul>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drug License *</label>
                  <input type="file" name="drugLicense" required onChange={(e) => handleFileChange(e, 'drugLicense')} accept=".pdf,.jpg,.jpeg,.png" className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 ${errors.drugLicense ? 'border-red-500 rounded-lg' : ''}`} />
                  {errors.drugLicense && <p className="text-red-500 text-sm mt-1">{errors.drugLicense}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof (Aadhar/PAN) *</label>
                  <input type="file" name="idProof" required onChange={(e) => handleFileChange(e, 'idProof')} accept=".pdf,.jpg,.jpeg,.png" className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 ${errors.idProof ? 'border-red-500 rounded-lg' : ''}`} />
                  {errors.idProof && <p className="text-red-500 text-sm mt-1">{errors.idProof}</p>}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Support KMDA (Optional)</h3>
              <p className="text-gray-600 mb-4">Your donation helps us improve services for all members</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donation Amount (₹)</label>
                <input type="number" name="donationAmount" min="0" value={formData.donationAmount || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" />
              </div>
            </div>

            {submissionError && (
              <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg p-4 my-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Registration Failed</h3>
                    <div className="mt-2 text-sm">
                      <p>{submissionError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Membership Fee</span><span>₹{MEMBERSHIP_FEE.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Payment Gateway Charges</span><span>₹{paymentGatewayCharges.toFixed(2)}</span></div>
                {formData.donationAmount > 0 && <div className="flex justify-between text-amber-700 font-medium"><span>Donation</span><span>₹{formData.donationAmount.toLocaleString()}</span></div>}
                <hr className="border-emerald-200" />
                <div className="flex justify-between font-semibold text-lg"><span>Total Amount</span><span>₹{totalAmount.toLocaleString()}</span></div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold text-lg transition-colors duration-300">
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
