import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, CheckCircle, AlertCircle, FileText, MapPin, User, Loader, X, Check } from 'lucide-react';

interface KYCStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

const kycSteps: KYCStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic personal details and contact information',
    completed: false,
    required: true
  },
  {
    id: 'documents',
    title: 'Identity Documents',
    description: 'Government-issued ID and proof of address',
    completed: false,
    required: true
  },
  {
    id: 'financial',
    title: 'Financial Information',
    description: 'Employment details and source of funds',
    completed: false,
    required: true
  },
  {
    id: 'verification',
    title: 'Identity Verification',
    description: 'Final verification and compliance checks',
    completed: false,
    required: true
  }
];

export default function KYCOnboarding() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    phoneNumber: '',
    email: user?.email || '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    occupation: '',
    employer: '',
    sourceOfFunds: '',
    annualIncome: '',
    idType: 'passport' as 'passport' | 'driver_license' | 'national_id',
    idNumber: '',
    documents: [] as File[]
  });

  const handleInputChange = (field: string, value: string) => {
    setError('');
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as object,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          setError('Only JPG, PNG, and PDF files are allowed');
          return false;
        }
        
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          setError('File size must be less than 10MB');
          return false;
        }
        
        return true;
      });
      
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...newFiles]
      }));
    }
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateStep = () => {
    setError('');
    
    switch (currentStep) {
      case 0: // Personal Information
        if (!formData.firstName.trim()) {
          setError('First name is required');
          return false;
        }
        if (!formData.lastName.trim()) {
          setError('Last name is required');
          return false;
        }
        if (!formData.dateOfBirth) {
          setError('Date of birth is required');
          return false;
        }
        if (!formData.phoneNumber.trim()) {
          setError('Phone number is required');
          return false;
        }
        if (!formData.address.street.trim() || !formData.address.city.trim() || 
            !formData.address.state.trim() || !formData.address.postalCode.trim() || 
            !formData.address.country.trim()) {
          setError('Complete address is required');
          return false;
        }
        return true;
        
      case 1: // Documents
        if (!formData.idNumber.trim()) {
          setError('ID number is required');
          return false;
        }
        if (formData.documents.length < 2) {
          setError('Please upload at least 2 documents (ID and proof of address)');
          return false;
        }
        return true;
        
      case 2: // Financial Information
        if (!formData.occupation.trim()) {
          setError('Occupation is required');
          return false;
        }
        if (!formData.sourceOfFunds) {
          setError('Source of funds is required');
          return false;
        }
        if (!formData.annualIncome) {
          setError('Annual income range is required');
          return false;
        }
        return true;
        
      case 3: // Verification
        return true;
        
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!validateStep()) return;
    
    if (currentStep < kycSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitKYC = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Get client record
      // const { data: clientData, error: clientError } = await supabase
      //   .from('clients')
      //   .select('id')
      //   .eq('user_id', user?.id)
      //   .single();

      // if (clientError) throw clientError;

      // Update client with KYC information
      // const { error: updateError } = await supabase
      //   .from('clients')
      //   .update({
      //     first_name: formData.firstName,
      //     last_name: formData.lastName,
      //     date_of_birth: formData.dateOfBirth,
      //     nationality: formData.nationality,
      //     phone_number: formData.phoneNumber,
      //     id_type: formData.idType,
      //     id_number: formData.idNumber,
      //     occupation: formData.occupation,
      //     source_of_funds: formData.sourceOfFunds,
      //     annual_income_range: formData.annualIncome,
      //     address: formData.address,
      //     kyc_status: 'pending'
      //   })
      //   .eq('id', clientData.id);

      // if (updateError) throw updateError;

      // In a real app, you would upload documents to storage here
      // For demo purposes, we'll just simulate document upload
      for (const doc of formData.documents) {
        // await supabase
        //   .from('documents')
        //   .insert([{
        //     client_id: clientData.id,
        //     msb_id: user?.msbId,
        //     name: doc.name,
        //     type: doc.name.toLowerCase().includes('id') ? 'id_document' : 'proof_of_address',
        //     file_url: `demo://uploaded/${doc.name}`, // Demo URL
        //     file_size: doc.size,
        //     mime_type: doc.type,
        //     status: 'pending'
        //   }]);
      }

      // Create notification for MSB admin
      // await supabase
      //   .from('notifications')
      //   .insert([{
      //     user_id: user?.id, // This would be the MSB admin's user ID in a real app
      //     msb_id: user?.msbId,
      //     type: 'kyc_submitted',
      //     title: 'KYC Application Submitted',
      //     message: `${formData.firstName} ${formData.lastName} has submitted their KYC application for review.`,
      //     data: {
      //       client_id: clientData.id,
      //       client_name: `${formData.firstName} ${formData.lastName}`
      //     },
      //     read: false
      //   }]);

      // setSuccess('KYC application submitted successfully! You will be notified once it has been reviewed.');
      
    } catch (err: any) {
      console.error('KYC submission error:', err);
      setError(err.message || 'Failed to submit KYC application');
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInfoStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="input-field"
            placeholder="John"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="input-field"
            placeholder="Smith"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
          <select
            value={formData.nationality}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select nationality</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="AU">Australia</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className="input-field"
            placeholder="+1 (555) 123-4567"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="input-field"
            placeholder="john.smith@email.com"
            disabled
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Residential Address
        </h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
          <input
            type="text"
            value={formData.address.street}
            onChange={(e) => handleInputChange('address.street', e.target.value)}
            className="input-field"
            placeholder="123 Main Street"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => handleInputChange('address.city', e.target.value)}
              className="input-field"
              placeholder="New York"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State/Province *</label>
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) => handleInputChange('address.state', e.target.value)}
              className="input-field"
              placeholder="NY"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
            <input
              type="text"
              value={formData.address.postalCode}
              onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
              className="input-field"
              placeholder="10001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
            <select
              value={formData.address.country}
              onChange={(e) => handleInputChange('address.country', e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="AU">Australia</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentsStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <h4 className="font-medium text-blue-900">Required Documents</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Government-issued photo ID (passport, driver's license, or national ID)</li>
              <li>• Proof of address (utility bill, bank statement, or lease agreement)</li>
              <li>• Additional documents may be required based on your profile</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Type *</label>
        <select
          value={formData.idType}
          onChange={(e) => handleInputChange('idType', e.target.value)}
          className="input-field"
          required
        >
          <option value="passport">Passport</option>
          <option value="driver_license">Driver's License</option>
          <option value="national_id">National ID Card</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">ID Number *</label>
        <input
          type="text"
          value={formData.idNumber}
          onChange={(e) => handleInputChange('idNumber', e.target.value)}
          className="input-field"
          placeholder="Enter your ID number"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents *</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            id="document-upload"
          />
          <label htmlFor="document-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Click to upload or drag and drop your documents
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: JPG, PNG, PDF (Max 10MB each)
            </p>
          </label>
        </div>
        
        {formData.documents.length > 0 && (
          <div className="mt-4 space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Uploaded Documents:</h5>
            {formData.documents.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{file.name}</span>
                  <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button
                  onClick={() => removeDocument(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderFinancialStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Occupation *</label>
          <input
            type="text"
            value={formData.occupation}
            onChange={(e) => handleInputChange('occupation', e.target.value)}
            className="input-field"
            placeholder="Software Engineer"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employer</label>
          <input
            type="text"
            value={formData.employer}
            onChange={(e) => handleInputChange('employer', e.target.value)}
            className="input-field"
            placeholder="Tech Company Inc."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Source of Funds *</label>
        <select
          value={formData.sourceOfFunds}
          onChange={(e) => handleInputChange('sourceOfFunds', e.target.value)}
          className="input-field"
          required
        >
          <option value="">Select source of funds</option>
          <option value="employment">Employment/Salary</option>
          <option value="business">Business Income</option>
          <option value="investments">Investment Returns</option>
          <option value="inheritance">Inheritance</option>
          <option value="savings">Personal Savings</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income *</label>
        <select
          value={formData.annualIncome}
          onChange={(e) => handleInputChange('annualIncome', e.target.value)}
          className="input-field"
          required
        >
          <option value="">Select income range</option>
          <option value="under-25k">Under $25,000</option>
          <option value="25k-50k">$25,000 - $50,000</option>
          <option value="50k-100k">$50,000 - $100,000</option>
          <option value="100k-250k">$100,000 - $250,000</option>
          <option value="250k-500k">$250,000 - $500,000</option>
          <option value="over-500k">Over $500,000</option>
        </select>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-1" />
          <div>
            <h4 className="font-medium text-yellow-900">Important Notice</h4>
            <p className="text-sm text-yellow-800 mt-1">
              This information is required for compliance with anti-money laundering (AML) regulations. 
              All information provided will be kept strictly confidential and used only for regulatory purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Final Verification</h3>
        <p className="text-gray-600">
          Please review all information before submitting your application
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
            <p><strong>Date of Birth:</strong> {formData.dateOfBirth}</p>
            <p><strong>Email:</strong> {formData.email}</p>
            <p><strong>Phone:</strong> {formData.phoneNumber}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Address</h4>
          <div className="text-sm text-gray-600">
            <p>{formData.address.street}</p>
            <p>{formData.address.city}, {formData.address.state} {formData.address.postalCode}</p>
            <p>{formData.address.country}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
          <div className="text-sm text-gray-600">
            <p><strong>ID Type:</strong> {formData.idType.replace('_', ' ')}</p>
            <p><strong>Documents Uploaded:</strong> {formData.documents.length} files</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Financial Information</h4>
          <div className="text-sm text-gray-600">
            <p><strong>Occupation:</strong> {formData.occupation}</p>
            <p><strong>Source of Funds:</strong> {formData.sourceOfFunds}</p>
            <p><strong>Annual Income:</strong> {formData.annualIncome}</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
          <div>
            <h4 className="font-medium text-green-900">Ready to Submit</h4>
            <p className="text-sm text-green-800 mt-1">
              Your application will be reviewed within 24-48 hours. You'll receive an email notification 
              once your account has been approved and activated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderPersonalInfoStep();
      case 1: return renderDocumentsStep();
      case 2: return renderFinancialStep();
      case 3: return renderVerificationStep();
      default: return renderPersonalInfoStep();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {kycSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${index < kycSteps.length - 1 ? 'flex-1' : ''}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-primary-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 max-w-24">{step.description}</p>
                </div>
              </div>
              {index < kycSteps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded ${
                    index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {kycSteps[currentStep].title}
          </h2>
          <p className="text-gray-600 mt-1">
            {kycSteps[currentStep].description}
          </p>
        </div>

        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 0 || loading}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={currentStep === kycSteps.length - 1 ? submitKYC : nextStep}
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              currentStep === kycSteps.length - 1 ? 'Submit Application' : 'Next Step'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}