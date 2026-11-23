import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Eye, 
  Edit, 
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle,
  Mail,
  Download,
  X,
  Check,
  User,
  Key,
  Copy
} from 'lucide-react';
import { useClients, useClientManagement, resetClientWallet } from '../../hooks/useDatabase';
import FileInput from '../common/FileInput';
import { useCountries, useStates, fetchStatesWithFullCode } from '../../hooks/useCountries';

export default function ClientManagement() {
  const { clients, loading, error, refetch, updateClientStatus, updateClientKycStatus, updateClientRiskLevel } = useClients();
  const { createClient, loading: creatingClient, uploadClientDocument, uploading } = useClientManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showWalletResetModal, setShowWalletResetModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [walletResetReason, setWalletResetReason] = useState('');
  const [resettingWallet, setResettingWallet] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const {countries, loading: countriesLoading } = useCountries();
  const [form, setForm] = useState({ country: "", state: "" });
  const [country, setCountry] = useState('');
  
  // State for tracking states for different owner countries
  const [ownerStatesMap, setOwnerStatesMap] = useState<{[key: string]: Array<{state_code: string, name: string}>}>({});
  const [ownerStatesLoading, setOwnerStatesLoading] = useState<{[key: string]: boolean}>({});
  



  // BlindPay KYC Field Mapping Reference:
  // | BlindPay Field                | newClientData Property         |
  // |-------------------------------|-------------------------------|
  // | type                          | clientType                    |
  // | kyc_type                      | kycType                       |
  // | email                         | email                         |
  // | tax_id                        | taxId                         |
  // | address_line_1                | address1                      |
  // | address_line_2                | address2                      |
  // | city                          | city                          |
  // | state_province_region         | state                         |
  // | country                       | country                       |
  // | postal_code                   | postalCode                    |
  // | proof_of_address_doc_type     | proofOfAddressType            |
  // | proof_of_address_doc_file     | proofOfAddressDocFile         |
  // | tos_id                        | tosId                         |
  // | legal_name                    | legalName                     |
  // | alternate_name                | doingBusinessAs               |
  // | formation_date                | formationDate                 |
  // | website                       | website                       |
  // | owners                        | owners                        |
  // | incorporation_doc_file        | incorporationDocFile          |
  // | proof_of_ownership_doc_file   | proofOfOwnershipDocFile       |
  // | first_name                    | firstName                     |
  // | last_name                     | lastName                      |
  // | date_of_birth                 | dateOfBirth                   |
  // | id_doc_country                | idDocCountry                  |
  // | id_doc_type                   | idDocType                     |
  // | id_doc_front_file             | idDocFrontFile                |
  // | id_doc_back_file              | idDocBackFile                 |
  const [newClientData, setNewClientData] = useState({
    clientType: 'individual',
    kycType: 'standard',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    nationality: '',
    country: '',
    occupation: '',
    sourceOfFunds: '',
    annualIncomeRange: '',
    taxId: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    proofOfAddressType: '',
    proofOfAddressDocFile: '',
    tosId: '', // keep for backend compatibility, but not required in UI
    ipAddress: '',
    imageUrl: '',
    // Business fields
    legalName: '',
    doingBusinessAs: '',
    formationDate: '',
    website: '',
    owners: [] as any[],
    incorporationDocFile: '',
    proofOfOwnershipDocFile: '',
    // Individual fields
    idDocCountry: '',
    idDocType: '',
    idDocFrontFile: '',
    idDocBackFile: '',
    sourceOfFundsDocType: '',
    sourceOfFundsDocFile: '',
    individualHoldingDocFrontFile: '',
    purposeOfTransactions: '',
    purposeOfTransactionsExplanation: '',
    externalId: '',
  });

   // Hook for states based on selected country
  const { states, loading: statesLoading } = useStates(
    country || null
  );
  console.log(countries);
  console.log(states);
  
  const [agreedToTos, setAgreedToTos] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // API error state
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Owner management state
  const [owners, setOwners] = useState([{
    id: 1,
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    ownershipPercentage: 100,
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    role: 'beneficial_owner',
    taxId: '',
    idDocCountry: '',
    idDocType: '',
    idDocFrontFile: '',
  }]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'requires_documents': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // newClientData: { country: string; countryName: string; state: string }
  const handleCountrySelection = (iso2: string) => {
    const country = countries.find(c => c.Iso2 === iso2);
    if (!country) return;
    setNewClientData(prev => ({
      ...prev,
      country: iso2,          // ISO2
      countryName : setCountry(country.name), // keep the human name separately
      state: "",              // reset
    }));
  };
  
  const handleStatusChange = async (clientId: string, isActive: boolean) => {
    try {
      await updateClientStatus(clientId, isActive);
      showSuccessMessage(`Client ${isActive ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (error) {
      console.error('Failed to update client status:', error);
    }
  };

  const handleKycStatusChange = async (clientId: string, kycStatus: string) => {
    try {
      await updateClientKycStatus(clientId, kycStatus);
      showSuccessMessage(`KYC status updated to ${kycStatus}`);
      setShowKycModal(false);
      refetch();
    } catch (error) {
      console.error('Failed to update KYC status:', error);
    }
  };

  const handleRiskLevelChange = async (clientId: string, riskLevel: string) => {
    try {
      await updateClientRiskLevel(clientId, riskLevel);
      showSuccessMessage(`Risk level updated to ${riskLevel}`);
      refetch();
    } catch (error) {
      console.error('Failed to update risk level:', error);
    }
  };

  const handleWalletReset = async () => {
    if (!selectedClient) return;
    
    setResettingWallet(true);
    try {
      await resetClientWallet({
        client_id: selectedClient.id,
        reason: walletResetReason || 'Customer support request',
        support_agent_id: 'msb_admin'
      });
      
      showSuccessMessage(`Wallet reset successfully for ${selectedClient.users?.email || selectedClient.first_name}`);
      setShowWalletResetModal(false);
      setShowDetailsModal(false);
      setWalletResetReason('');
      refetch(); // Refresh client list to show updated wallet status
    } catch (error: any) {
      console.error('Error resetting wallet:', error);
      showSuccessMessage(`Error resetting wallet: ${error.message}`);
    } finally {
      setResettingWallet(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateWebsite = (website: string) => {
    if (!website) return true; // Optional field
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(website);
  };

  const validateTaxId = (taxId: string) => {
    return taxId.length >= 9; // Basic validation
  };

  const validatePostalCode = (postalCode: string) => {
    return postalCode.length >= 3; // Basic validation
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleCreateClient = async () => {
    setShowValidationError(false);
    setValidationErrors({});
    setApiError(null); // Clear any previous API errors
    let hasError = false;
    const errors: {[key: string]: string} = {};

    // Basic required fields validation
    if (!newClientData.firstName?.trim()) {
      errors.firstName = 'First name is required';
      hasError = true;
    } else if (newClientData.firstName.trim().length > 50) {
      errors.firstName = 'First name must be 50 characters or less';
      hasError = true;
    }

    if (!newClientData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
      hasError = true;
    } else if (newClientData.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be 50 characters or less';
      hasError = true;
    }

    if (!newClientData.email?.trim()) {
      errors.email = 'Email is required';
      hasError = true;
    } else if (!validateEmail(newClientData.email)) {
      errors.email = 'Please enter a valid email address';
      hasError = true;
    } else if (newClientData.email.trim().length > 254) {
      errors.email = 'Email must be 254 characters or less';
      hasError = true;
    }

    if (!newClientData.password?.trim()) {
      errors.password = 'Password is required';
      hasError = true;
    } else if (!validatePassword(newClientData.password)) {
      errors.password = 'Password must be at least 8 characters long';
      hasError = true;
    }

    if (!newClientData.country) {
      errors.country = 'Country is required';
      hasError = true;
    }

    if (!newClientData.taxId?.trim()) {
      errors.taxId = 'Tax ID is required';
      hasError = true;
    } else if (!validateTaxId(newClientData.taxId)) {
      errors.taxId = 'Tax ID must be at least 9 characters long';
      hasError = true;
    } else if (newClientData.taxId.trim().length > 100) {
      errors.taxId = 'Tax ID must be 100 characters or less';
      hasError = true;
    }

    if (!newClientData.address1?.trim()) {
      errors.address1 = 'Address is required';
      hasError = true;
    } else if (newClientData.address1.trim().length > 255) {
      errors.address1 = 'Address must be 255 characters or less';
      hasError = true;
    }

    if (newClientData.address2?.trim() && newClientData.address2.trim().length > 255) {
      errors.address2 = 'Address line 2 must be 255 characters or less';
      hasError = true;
    }

    if (!newClientData.city?.trim()) {
      errors.city = 'City is required';
      hasError = true;
    } else if (newClientData.city.trim().length > 100) {
      errors.city = 'City must be 100 characters or less';
      hasError = true;
    }

    if (newClientData.state?.trim() && newClientData.state.trim().length > 100) {
      errors.state = 'State must be 100 characters or less';
      hasError = true;
    }

    if (!newClientData.state?.trim()) {
      errors.state = 'State is required';
      hasError = true;
    }

    if (!newClientData.state?.trim()) {
      errors.state = 'State is required';
      hasError = true;
    }

    if (!newClientData.postalCode?.trim()) {
      errors.postalCode = 'Postal code is required';
      hasError = true;
    } else if (!validatePostalCode(newClientData.postalCode)) {
      errors.postalCode = 'Postal code must be at least 3 characters long';
      hasError = true;
    } else if (newClientData.postalCode.trim().length > 20) {
      errors.postalCode = 'Postal code must be 20 characters or less';
      hasError = true;
    }

    if (!newClientData.proofOfAddressType) {
      errors.proofOfAddressType = 'Proof of address type is required';
      hasError = true;
    }

    if (!newClientData.proofOfAddressDocFile?.trim()) {
      errors.proofOfAddressDocFile = 'Proof of address document is required';
      hasError = true;
    }

    if (newClientData.phoneNumber && !validatePhoneNumber(newClientData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
      hasError = true;
    } else if (newClientData.phoneNumber && newClientData.phoneNumber.trim().length > 20) {
      errors.phoneNumber = 'Phone number must be 20 characters or less';
      hasError = true;
    }

    // Individual-specific validation
    if (newClientData.clientType === 'individual') {
      if (!newClientData.dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required for individual clients';
        hasError = true;
      }

      if (!newClientData.idDocCountry) {
        errors.idDocCountry = 'ID document country is required';
        hasError = true;
      }

      if (!newClientData.idDocType) {
        errors.idDocType = 'ID document type is required';
        hasError = true;
      }

      if (!newClientData.idDocFrontFile?.trim()) {
        errors.idDocFrontFile = 'ID document front file is required';
        hasError = true;
      }

      if (!newClientData.sourceOfFundsDocType) {
        errors.sourceOfFundsDocType = 'Source of funds document type is required';
        hasError = true;
      }

      if (!newClientData.sourceOfFundsDocFile?.trim()) {
        errors.sourceOfFundsDocFile = 'Source of funds document file is required';
        hasError = true;
      }

      if (!newClientData.purposeOfTransactions) {
        errors.purposeOfTransactions = 'Purpose of transactions is required';
        hasError = true;
      }
    }

    // Business-specific validation
    if (newClientData.clientType === 'business') {
      if (!newClientData.legalName?.trim()) {
        errors.legalName = 'Legal name is required';
        hasError = true;
      } else if (newClientData.legalName.trim().length > 200) {
        errors.legalName = 'Legal name must be 200 characters or less';
        hasError = true;
      }

      if (newClientData.doingBusinessAs?.trim() && newClientData.doingBusinessAs.trim().length > 200) {
        errors.doingBusinessAs = 'Alternate name must be 200 characters or less';
        hasError = true;
      }

      if (!newClientData.formationDate) {
        errors.formationDate = 'Formation date is required';
        hasError = true;
      }

      if (!newClientData.website?.trim()) {
        errors.website = 'Website is required';
        hasError = true;
      } else if (!validateWebsite(newClientData.website)) {
        errors.website = 'Please enter a valid website URL (must start with http:// or https://)';
        hasError = true;
      } else if (newClientData.website.trim().length > 255) {
        errors.website = 'Website must be 255 characters or less';
        hasError = true;
      }

      if (!newClientData.incorporationDocFile?.trim()) {
        errors.incorporationDocFile = 'Incorporation document is required';
        hasError = true;
      }

      if (!newClientData.proofOfOwnershipDocFile?.trim()) {
        errors.proofOfOwnershipDocFile = 'Proof of ownership document is required';
        hasError = true;
      }

      // Validate owners
      if (owners.length === 0) {
        errors.owners = 'At least one owner is required';
        hasError = true;
      } else {
        owners.forEach((owner, index) => {
          if (!owner.firstName?.trim()) {
            errors[`owner${index}FirstName`] = `Owner ${index + 1} first name is required`;
            hasError = true;
          } else if (owner.firstName.trim().length > 50) {
            errors[`owner${index}FirstName`] = `Owner ${index + 1} first name must be 50 characters or less`;
            hasError = true;
          }
          if (!owner.lastName?.trim()) {
            errors[`owner${index}LastName`] = `Owner ${index + 1} last name is required`;
            hasError = true;
          } else if (owner.lastName.trim().length > 50) {
            errors[`owner${index}LastName`] = `Owner ${index + 1} last name must be 50 characters or less`;
            hasError = true;
          }
          if (!owner.dateOfBirth) {
            errors[`owner${index}DateOfBirth`] = `Owner ${index + 1} date of birth is required`;
            hasError = true;
          }
          if (!owner.taxId?.trim()) {
            errors[`owner${index}TaxId`] = `Owner ${index + 1} tax ID is required`;
            hasError = true;
          } else if (owner.taxId.trim().length > 100) {
            errors[`owner${index}TaxId`] = `Owner ${index + 1} tax ID must be 100 characters or less`;
            hasError = true;
          }
          if (!owner.address1?.trim()) {
            errors[`owner${index}Address1`] = `Owner ${index + 1} address is required`;
            hasError = true;
          } else if (owner.address1.trim().length > 255) {
            errors[`owner${index}Address1`] = `Owner ${index + 1} address must be 255 characters or less`;
            hasError = true;
          }
          if (!owner.city?.trim()) {
            errors[`owner${index}City`] = `Owner ${index + 1} city is required`;
            hasError = true;
          } else if (owner.city.trim().length > 100) {
            errors[`owner${index}City`] = `Owner ${index + 1} city must be 100 characters or less`;
            hasError = true;
          }

          if (owner.address2?.trim() && owner.address2.trim().length > 255) {
            errors[`owner${index}Address2`] = `Owner ${index + 1} address line 2 must be 255 characters or less`;
            hasError = true;
          }
          if (!owner.state?.trim()) {
            errors[`owner${index}State`] = `Owner ${index + 1} state is required`;
            hasError = true;
          } else if (owner.state.trim().length > 100) {
            errors[`owner${index}State`] = `Owner ${index + 1} state must be 100 characters or less`;
            hasError = true;
          }
          if (!owner.country) {
            errors[`owner${index}Country`] = `Owner ${index + 1} country is required`;
            hasError = true;
          }
          if (!owner.postalCode?.trim()) {
            errors[`owner${index}PostalCode`] = `Owner ${index + 1} postal code is required`;
            hasError = true;
          } else if (owner.postalCode.trim().length > 20) {
            errors[`owner${index}PostalCode`] = `Owner ${index + 1} postal code must be 20 characters or less`;
            hasError = true;
          }
          if (!owner.idDocCountry) {
            errors[`owner${index}IdDocCountry`] = `Owner ${index + 1} ID document country is required`;
            hasError = true;
          }
          if (!owner.idDocType) {
            errors[`owner${index}IdDocType`] = `Owner ${index + 1} ID document type is required`;
            hasError = true;
          }
          if (!owner.idDocFrontFile?.trim()) {
            errors[`owner${index}IdDocFrontFile`] = `Owner ${index + 1} ID document front file is required`;
            hasError = true;
          }
        });
      }
    }

    if (!agreedToTos) {
      errors.tosAgreement = 'You must agree to the Terms of Service';
      hasError = true;
    }

    if (hasError) {
      setValidationErrors(errors);
      setShowValidationError(true);
      return;
    }

    try {
      // Prepare client data with owners for business clients
      const clientData = { ...newClientData } as any;
      if (newClientData.clientType === 'business') {
        // Format owners data for BlindPay API
        const formattedOwners = owners.map(owner => ({
          first_name: owner.firstName,
          last_name: owner.lastName,
          date_of_birth: owner.dateOfBirth ? new Date(owner.dateOfBirth).toISOString() : '',
          ownership_percentage: owner.ownershipPercentage,
          address_line_1: owner.address1,
          city: owner.city,
          state_province_region: owner.state,
          country: owner.country,
          postal_code: owner.postalCode,
          role: owner.role,
          tax_id: owner.taxId,
          id_doc_country: owner.idDocCountry,
          id_doc_type: owner.idDocType,
          id_doc_front_file: owner.idDocFrontFile,
        }));
        clientData.owners = formattedOwners;
        
        // Map business document fields to backend expected names
        clientData.incorporation_doc_file = newClientData.incorporationDocFile;
        clientData.proof_of_ownership_doc_file = newClientData.proofOfOwnershipDocFile;
        
        // Format website URL to include protocol if missing
        if (newClientData.website && !newClientData.website.startsWith('http://') && !newClientData.website.startsWith('https://')) {
          clientData.website = `https://${newClientData.website}`;
        }
      }

      // Use the createClient hook to create a new client
      const result = await createClient(clientData);
      console.log('Create client result:', result); // Debug log
      
      if (result.success) {
        showSuccessMessage(`Client ${newClientData.firstName} ${newClientData.lastName} created successfully. Temporary password: ${result.tempPassword}`);
        setShowCreateModal(false);
        setNewClientData({
          clientType: 'individual',
          kycType: 'standard',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phoneNumber: '',
          dateOfBirth: '',
          nationality: '',
          country: '',
          occupation: '',
          sourceOfFunds: '',
          annualIncomeRange: '',
          taxId: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          postalCode: '',
          proofOfAddressType: '',
          proofOfAddressDocFile: '',
          tosId: '',
          ipAddress: '',
          imageUrl: '',
          // Business fields
          legalName: '',
          doingBusinessAs: '',
          formationDate: '',
          website: '',
          owners: [],
          incorporationDocFile: '',
          proofOfOwnershipDocFile: '',
          // Individual fields
          idDocCountry: '',
          idDocType: '',
          idDocFrontFile: '',
          idDocBackFile: '',
          sourceOfFundsDocType: '',
          sourceOfFundsDocFile: '',
          individualHoldingDocFrontFile: '',
          purposeOfTransactions: '',
          purposeOfTransactionsExplanation: '',
          externalId: '',
        });
        setValidationErrors({});
        setShowValidationError(false);
        setApiError(null);
        // Reset owners
        setOwners([{
          id: 1,
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          ownershipPercentage: 100,
          address1: '',
          address2: '',
          city: '',
          state: '',
          country: '',
          postalCode: '',
          role: 'beneficial_owner',
          taxId: '',
          idDocCountry: '',
          idDocType: '',
          idDocFrontFile: '',
        }]);
        refetch();
      } else {
        // Handle API error response
        setApiError('Failed to create client. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to create client:', error);
      
      // The error is now thrown from the createClient function with the proper message
      // Just use the error message directly
      setApiError(error.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewClientData(prev => ({ ...prev, password }));
  };

  // Owner management functions
  const addOwner = () => {
    const newOwner = {
      id: Date.now(),
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      ownershipPercentage: 0,
      address1: '',
      address2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      role: 'beneficial_owner',
      taxId: '',
      idDocCountry: '',
      idDocType: '',
      idDocFrontFile: '',
    };
    setOwners([...owners, newOwner]);
  };

  const removeOwner = (ownerId: number) => {
    if (owners.length > 1) {
      setOwners(owners.filter(owner => owner.id !== ownerId));
    }
  };

  const updateOwner = (ownerId: number, field: string, value: any) => {
    setOwners(owners.map(owner => 
      owner.id === ownerId ? { ...owner, [field]: value } : owner
    ));
    
    // If country is being updated, fetch states for that country
    if (field === 'country') {
      const owner = owners.find(o => o.id === ownerId);
      if (owner && value) {
        setOwnerStatesLoading(prev => ({ ...prev, [ownerId]: true }));
        
        // Fetch states for the new country
        const fetchStates = async () => {
          try {
            // Find the country name from the ISO2 code
            const countryObj = countries.find(c => c.Iso2 === value);
            if (countryObj) {
              // Use the same API function that the useStates hook uses
              const countryStates = await fetchStatesWithFullCode(countryObj.name);
              setOwnerStatesMap(prev => ({ ...prev, [ownerId]: countryStates }));
            } else {
              setOwnerStatesMap(prev => ({ ...prev, [ownerId]: [] }));
            }
          } catch (error) {
            console.error('Failed to fetch states for country:', value, error);
            setOwnerStatesMap(prev => ({ ...prev, [ownerId]: [] }));
          } finally {
            setOwnerStatesLoading(prev => ({ ...prev, [ownerId]: false }));
          }
        };
        
        fetchStates();
        
        // Reset state when country changes
        setOwners(prev => prev.map(o => 
          o.id === ownerId ? { ...o, state: '' } : o
        ));
      }
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Status', 'KYC Status', 'Risk Level', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredClients.map(client => [
        `"${client.first_name} ${client.last_name}"`,
        `"${client.users?.email}"`,
        `"${client.users?.is_active ? 'Active' : 'Inactive'}"`,
        `"${client.kyc_status}"`,
        `"${client.risk_level}"`,
        `"${new Date(client.created_at).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showSuccessMessage(`Exported ${filteredClients.length} clients`);
  };

  const filteredClients = clients.filter(client => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const email = client.users?.email.toLowerCase() || '';
    
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                         email.includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && client.users?.is_active) ||
                         (statusFilter === 'inactive' && !client.users?.is_active);
    
    const matchesKyc = kycFilter === 'all' || client.kyc_status === kycFilter;
    
    return matchesSearch && matchesStatus && matchesKyc;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading clients: {error}</p>
      </div>
    );
  }

  const idDocTypeOptions = [
    { value: 'PASSPORT', label: 'Passport' },
    { value: 'ID_CARD', label: 'ID Card' },
    { value: 'DRIVERS', label: 'Driver\'s License' },
  ];

  const proofOfAddressTypeOptions = [
    { value: 'UTILITY_BILL', label: 'Utility Bill' },
    { value: 'BANK_STATEMENT', label: 'Bank Statement' },
    { value: 'RENTAL_AGREEMENT', label: 'Rental Agreement' },
    { value: 'TAX_DOCUMENT', label: 'Tax Document' },
    { value: 'GOVERNMENT_CORRESPONDENCE', label: 'Government Correspondence' },
  ];

  const sourceOfFundsDocTypeOptions = [
    { value: 'business_income', label: 'Business Income' },
    { value: 'gambling_proceeds', label: 'Gambling Proceeds' },
    { value: 'gifts', label: 'Gifts' },
    { value: 'government_benefits', label: 'Government Benefits' },
    { value: 'inheritance', label: 'Inheritance' },
    { value: 'investment_loans', label: 'Investment Loans' },
    { value: 'pension_retirement', label: 'Pension/Retirement' },
    { value: 'salary', label: 'Salary' },
    { value: 'sale_of_assets_real_estate', label: 'Sale of Assets/Real Estate' },
    { value: 'savings', label: 'Savings' },
    { value: 'esops', label: 'ESOPs' },
    { value: 'investment_proceeds', label: 'Investment Proceeds' },
    { value: 'someone_else_funds', label: 'Someone Else\'s Funds' },
  ];

  const purposeOfTransactionsOptions = [
    { value: 'business_transactions', label: 'Business Transactions' },
    { value: 'charitable_donations', label: 'Charitable Donations' },
    { value: 'investment_purposes', label: 'Investment Purposes' },
    { value: 'payments_to_friends_or_family_abroad', label: 'Payments to Friends or Family Abroad' },
    { value: 'personal_or_living_expenses', label: 'Personal or Living Expenses' },
    { value: 'protect_wealth', label: 'Protect Wealth' },
    { value: 'purchase_good_and_services', label: 'Purchase Goods and Services' },
    { value: 'receive_payment_for_freelancing', label: 'Receive Payment for Freelancing' },
    { value: 'receive_salary', label: 'Receive Salary' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* API Error Message */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-sm text-red-800">{apiError}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your clients</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExport}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.filter(c => c.users?.is_active).length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending KYC</p>
              <p className="text-2xl font-bold text-gray-900">{clients.filter(c => c.kyc_status === 'pending' || c.kyc_status === 'requires_documents').length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.filter(c => c.risk_level === 'high').length}</p>
            </div>
            <Shield className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">KYC Status</label>
                <select
                  value={kycFilter}
                  onChange={(e) => setKycFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All KYC Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="requires_documents">Requires Documents</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setKycFilter('all');
                    setSearchTerm('');
                  }}
                  className="btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KYC Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th> */}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{client.first_name} {client.last_name}</div>
                        <div className="text-sm text-gray-500">{client.occupation || 'Not specified'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.users?.email || 'No email'}</div>
                    <div className="text-sm text-gray-500">{client.phone_number || 'No phone'}</div>
                  </td>
                  {/* <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.users?.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.users?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td> */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getKycStatusColor(client.kyc_status)}`}>
                      {client.kyc_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(client.risk_level)}`}>
                      {client.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(client as any).wallet_address ? (
                      <div>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Connected
                        </span>
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          {(client as any).wallet_address.slice(0, 6)}...{(client as any).wallet_address.slice(-4)}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Not Connected
                      </span>
                    )}
                  </td>
                  {/* <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {client.users?.last_login ? `Last login: ${new Date(client.users.last_login).toLocaleDateString()}` : 'Never logged in'}
                    </div>
                  </td> */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* {client.users?.is_active ? (
                        <button
                          onClick={() => handleStatusChange(client.id, false)}
                          className="text-red-600 hover:text-red-800"
                          title="Deactivate Client"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(client.id, true)}
                          className="text-green-600 hover:text-green-800"
                          title="Activate Client"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      )} */}
                      {/* <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowDetailsModal(true);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button> */}
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                          {/* <button
                            onClick={() => {
                              setSelectedClient(client);
                              setShowKycModal(true);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <CheckCircle className="w-4 h-4 inline mr-2" />
                            Update KYC Status
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setShowPasswordModal(true);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Key className="w-4 h-4 inline mr-2" />
                            Reset Password
                          </button>
                          <button
                            onClick={() => {
                              // Send welcome email
                              showSuccessMessage(`Welcome email sent to ${client.users?.email}`);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Mail className="w-4 h-4 inline mr-2" />
                            Send Welcome Email
                          </button>
                          <button
                            onClick={() => {
                              // Update risk level
                              const newLevel = client.risk_level === 'low' ? 'medium' : 
                                              client.risk_level === 'medium' ? 'high' : 'low';
                              handleRiskLevelChange(client.id, newLevel);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Shield className="w-4 h-4 inline mr-2" />
                            Change Risk Level
                          </button> */}
                          {(client as any).wallet_address && (
                            <button
                              onClick={() => {
                                setSelectedClient(client);
                                setShowWalletResetModal(true);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Key className="w-4 h-4 inline mr-2" />
                              Reset Wallet
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setApiError(null);
                    setValidationErrors({});
                    setShowValidationError(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* API Error in Modal */}
                {apiError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <XCircle className="w-5 h-5 text-red-600 mr-3" />
                      <p className="text-sm text-red-800">{apiError}</p>
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Type *
                      </label>
                      <select
                        value={newClientData.clientType}
                        onChange={e => setNewClientData(prev => ({ ...prev, clientType: e.target.value }))}
                        className="input-field"
                        required
                      >
                        <option value="individual">Individual</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={newClientData.firstName}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, firstName: e.target.value }))}
                        className={`input-field ${validationErrors.firstName ? 'border-red-500' : ''}`}
                        placeholder="John"
                        maxLength={50}
                        required
                      />
                      {validationErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={newClientData.lastName}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, lastName: e.target.value }))}
                        className={`input-field ${validationErrors.lastName ? 'border-red-500' : ''}`}
                        placeholder="Smith"
                        maxLength={50}
                        required
                      />
                      {validationErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={newClientData.email}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                        className={`input-field ${validationErrors.email ? 'border-red-500' : ''}`}
                        placeholder="john.smith@example.com"
                        maxLength={254}
                        required
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newClientData.phoneNumber}
                        onChange={(e) => setNewClientData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className={`input-field ${validationErrors.phoneNumber ? 'border-red-500' : ''}`}
                        placeholder="+1 (555) 123-4567"
                        maxLength={20}
                      />
                      {validationErrors.phoneNumber && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>
                      )}
                    </div>
                    {/* Date of Birth Picker for Individual */}
                    {newClientData.clientType === 'individual' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${validationErrors.dateOfBirth ? 'border-red-500' : ''}`}
                          value={newClientData.dateOfBirth || ''}
                          onChange={e => setNewClientData({ ...newClientData, dateOfBirth: e.target.value })}
                          required
                        />
                        {validationErrors.dateOfBirth && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Credentials */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Account Credentials</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temporary Password *
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newClientData.password}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, password: e.target.value }))}
                          className={`input-field flex-1 ${validationErrors.password ? 'border-red-500' : ''}`}
                          placeholder="Temporary password"
                          required
                        />
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="btn-secondary px-3"
                          title="Generate Password"
                        >
                          Generate
                        </button>
                      </div>
                      {validationErrors.password && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        The client will be prompted to change this password on first login.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Common fields */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                      <select
                        value={form.country}
                        onChange={e => {
                          const iso = e.target.value;
                          setForm(prev => ({ ...prev, country: iso, state: "" }));
                          handleCountrySelection(iso);
                        }}
                        className={`input-field ${validationErrors.country ? "border-red-500" : ""}`}
                        required
                      >
                        <option value="">Select country...</option>
                        {countriesLoading
                          ? <option disabled>Loading...</option>
                          : countries.map(opt => (
                              <option key={opt.Iso2} value={opt.Iso2}>
                                {opt.name}
                              </option>
                            ))
                        }
                      </select>
                      {validationErrors.country && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.country}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID *</label>
                      <input 
                        type="text" 
                        value={newClientData.taxId} 
                        onChange={e => setNewClientData(prev => ({ ...prev, taxId: e.target.value }))} 
                        className={`input-field ${validationErrors.taxId ? 'border-red-500' : ''}`} 
                        maxLength={100}
                        required 
                      />
                      {validationErrors.taxId && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.taxId}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                      <input 
                        type="text" 
                        value={newClientData.address1} 
                        onChange={e => setNewClientData(prev => ({ ...prev, address1: e.target.value }))} 
                        className={`input-field ${validationErrors.address1 ? 'border-red-500' : ''}`} 
                        maxLength={255}
                        required 
                      />
                      {validationErrors.address1 && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.address1}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                      <input 
                        type="text" 
                        value={newClientData.address2} 
                        onChange={e => setNewClientData(prev => ({ ...prev, address2: e.target.value }))} 
                        className={`input-field ${validationErrors.address2 ? 'border-red-500' : ''}`} 
                        maxLength={255} 
                      />
                      {validationErrors.address2 && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.address2}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input 
                        type="text" 
                        value={newClientData.city} 
                        onChange={e => setNewClientData(prev => ({ ...prev, city: e.target.value }))} 
                        className={`input-field ${validationErrors.city ? 'border-red-500' : ''}`} 
                        maxLength={100}
                        required 
                      />
                      {validationErrors.city && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>
                      )}
                    </div>
                    {/* State/Province/Region */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province/Region
                      </label>
                      <select
                        value={newClientData.state}
                        onChange={e => setNewClientData(prev => ({ ...prev, state: e.target.value }))}
                        className={`input-field ${validationErrors.state ? 'border-red-500' : ''}`}
                        disabled={!newClientData.country || statesLoading}
                        required
                      >
                        {!newClientData.country ? (
                          <option value="">Select state...</option>  // country blank → reset
                          ) : statesLoading ? (
                            <option value="">Loading...</option>
                          ) : states.length === 0 ? (
                            <option value="">No states available</option>
                          ) : (
                            <>
                              <option value="">Select state...</option>
                              {states.map(s => (
                                <option key={s.state_code} value={s.state_code}>{s.name}</option>
                              ))}
                            </>
                        )}
                      </select>
                      {validationErrors.state && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.state}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                      <input 
                        type="text" 
                        value={newClientData.postalCode} 
                        onChange={e => setNewClientData(prev => ({ ...prev, postalCode: e.target.value }))} 
                        className={`input-field ${validationErrors.postalCode ? 'border-red-500' : ''}`} 
                        maxLength={20}
                        required 
                      />
                      {validationErrors.postalCode && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.postalCode}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Address Type *</label>
                      <select
                        value={newClientData.proofOfAddressType}
                        onChange={e => setNewClientData(prev => ({ ...prev, proofOfAddressType: e.target.value }))}
                        className={`input-field ${validationErrors.proofOfAddressType ? 'border-red-500' : ''}`}
                        required
                      >
                        <option value="">Select proof of address type...</option>
                        {proofOfAddressTypeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {validationErrors.proofOfAddressType && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.proofOfAddressType}</p>
                      )}
                    </div>
                    <div>
                      <FileInput 
                        label="Proof of Address Document"  
                        value={newClientData.proofOfAddressDocFile} 
                        onChange={(url, fileName) =>
                          setNewClientData((prev) => ({
                            ...prev,
                            proofOfAddressDocFile: url,
                          }))
                        }
                        required 
                        validationError={validationErrors.proofOfAddressDocFile}
                        uploadFile={uploadClientDocument}
                      />
                    </div>

                  </div>
                  {/* Individual-specific fields */}
                  {newClientData.clientType === 'individual' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Country *</label>
                        <select
                          value={newClientData.idDocCountry}
                          onChange={e => setNewClientData(prev => ({ ...prev, idDocCountry: e.target.value }))}
                          className={`input-field ${validationErrors.idDocCountry ? 'border-red-500' : ''}`}
                          required
                        >
                          <option value="">Select country...</option>
                          {countries.map(opt => (
                            <option key={opt.Iso2} value={opt.Iso2}>{opt.name}</option>
                          ))}
                        </select>
                        {validationErrors.idDocCountry && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.idDocCountry}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Type *</label>
                      <select
                          value={newClientData.idDocType}
                          onChange={e => setNewClientData(prev => ({ ...prev, idDocType: e.target.value }))}
                          className={`input-field ${validationErrors.idDocType ? 'border-red-500' : ''}`}
                          required
                        >
                          <option value="">Select document type...</option>
                          {idDocTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                      </select>
                        {validationErrors.idDocType && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.idDocType}</p>
                        )}
                    </div>
                      <FileInput
                        label="ID Document Front File"
                          value={newClientData.idDocFrontFile} 
                        onChange={(url, fileName) =>
                          setNewClientData((prev) => ({
                            ...prev,
                            idDocFrontFile: url,
                          }))
                        }
                          required 
                        validationError={validationErrors.idDocFrontFile}
                        uploadFile={uploadClientDocument}
                      />
                      <FileInput 
                        label="ID Document Back File"  
                        value={newClientData.idDocBackFile}
                        onChange={(url, fileName) =>
                          setNewClientData((prev) => ({
                            ...prev,
                            idDocBackFile: url,
                          }))
                        }
                        required
                        validationError={validationErrors.idDocFrontFile}
                        uploadFile={uploadClientDocument}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Source of Funds Document Type *</label>
                      <select
                          value={newClientData.sourceOfFundsDocType}
                          onChange={e => setNewClientData(prev => ({ ...prev, sourceOfFundsDocType: e.target.value }))}
                        className="input-field"
                          required
                        >
                          <option value="">Select source of funds document type...</option>
                          {sourceOfFundsDocTypeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                      </select>
                    </div>
                      <div>
                        <FileInput 
                          label="Source of Funds Document File"  
                          value={newClientData.sourceOfFundsDocFile}
                          onChange={(url, fileName) =>
                            setNewClientData((prev) => ({
                              ...prev,
                              sourceOfFundsDocFile: url,
                            }))
                          }
                          required
                          validationError={validationErrors.sourceOfFundsDocFile}
                          uploadFile={uploadClientDocument}
                        />
                  </div>
                      <div>
                        <FileInput 
                          label="Individual Holding Document Front File"  
                          value={newClientData.individualHoldingDocFrontFile}
                          onChange={(url, fileName) =>
                            setNewClientData((prev) => ({
                              ...prev,
                              individualHoldingDocFrontFile: url,
                            }))
                          }
                          validationError={validationErrors.individualHoldingDocFrontFile}
                          uploadFile={uploadClientDocument}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Purpose of Transactions *</label>
                        <select
                          value={newClientData.purposeOfTransactions}
                          onChange={e => setNewClientData(prev => ({ ...prev, purposeOfTransactions: e.target.value }))}
                          className="input-field"
                          required
                        >
                          <option value="">Select purpose of transactions...</option>
                          {purposeOfTransactionsOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Purpose of Transactions Explanation</label>
                        <textarea value={newClientData.purposeOfTransactionsExplanation} onChange={e => setNewClientData(prev => ({ ...prev, purposeOfTransactionsExplanation: e.target.value }))} className="input-field" rows={3} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">External ID</label>
                        <input type="text" value={newClientData.externalId} onChange={e => setNewClientData(prev => ({ ...prev, externalId: e.target.value }))} className="input-field" />
                      </div>
                    </div>
                  )}
                  {/* Business-specific fields */}
                  {newClientData.clientType === 'business' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Legal Name *</label>
                        <input 
                          type="text" 
                          value={newClientData.legalName} 
                          onChange={e => setNewClientData(prev => ({ ...prev, legalName: e.target.value }))} 
                          className={`input-field ${validationErrors.legalName ? 'border-red-500' : ''}`} 
                          maxLength={200}
                          required 
                        />
                        {validationErrors.legalName && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.legalName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Name (DBA)</label>
                        <input 
                          type="text" 
                          value={newClientData.doingBusinessAs} 
                          onChange={e => setNewClientData(prev => ({ ...prev, doingBusinessAs: e.target.value }))} 
                          className={`input-field ${validationErrors.doingBusinessAs ? 'border-red-500' : ''}`} 
                          maxLength={200} 
                        />
                        {validationErrors.doingBusinessAs && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.doingBusinessAs}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Formation Date *</label>
                        <input 
                          type="date" 
                          value={newClientData.formationDate} 
                          onChange={e => setNewClientData(prev => ({ ...prev, formationDate: e.target.value }))} 
                          className={`input-field ${validationErrors.formationDate ? 'border-red-500' : ''}`} 
                          required 
                        />
                        {validationErrors.formationDate && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.formationDate}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website *</label>
                        <input 
                          type="url" 
                          value={newClientData.website} 
                          onChange={e => setNewClientData(prev => ({ ...prev, website: e.target.value }))} 
                          className={`input-field ${validationErrors.website ? 'border-red-500' : ''}`} 
                          placeholder="https://www.example.com"
                          maxLength={255}
                          required 
                        />
                        {validationErrors.website && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.website}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Must include http:// or https:// protocol
                        </p>
                      </div>
                      {/* Owners/UBOs dynamic list */}
                      <div className="col-span-2">
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-medium text-gray-700">Owners/UBOs *</label>
                          <button
                            type="button"
                            onClick={addOwner}
                            className="btn-secondary text-sm px-3 py-1"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Owner
                          </button>
                        </div>
                        {validationErrors.owners && (
                          <p className="text-red-500 text-xs mb-2">{validationErrors.owners}</p>
                        )}
                        
                        {owners.map((owner, index) => (
                          <div key={owner.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-sm font-medium text-gray-900">Owner {index + 1}</h5>
                              {owners.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOwner(owner.id)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                                <input
                                  type="text"
                                  value={owner.firstName}
                                  onChange={(e) => updateOwner(owner.id, 'firstName', e.target.value)}
                                  className={`input-field ${validationErrors[`owner${index}FirstName`] ? 'border-red-500' : ''}`}
                                  maxLength={50}
                                  required
                                />
                                {validationErrors[`owner${index}FirstName`] && (
                                  <p className="text-red-500 text-xs mt-1">{validationErrors[`owner${index}FirstName`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                                <input
                                  type="text"
                                  value={owner.lastName}
                                  onChange={(e) => updateOwner(owner.id, 'lastName', e.target.value)}
                                  className={`input-field ${validationErrors[`owner${index}LastName`] ? 'border-red-500' : ''}`}
                                  maxLength={50}
                                  required
                                />
                                {validationErrors[`owner${index}LastName`] && (
                                  <p className="text-red-500 text-xs mt-1">{validationErrors[`owner${index}LastName`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                                <input
                                  type="date"
                                  value={owner.dateOfBirth}
                                  onChange={(e) => updateOwner(owner.id, 'dateOfBirth', e.target.value)}
                                  className="input-field"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ownership Percentage *</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={owner.ownershipPercentage}
                                  onChange={(e) => updateOwner(owner.id, 'ownershipPercentage', parseInt(e.target.value))}
                                  className="input-field"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID *</label>
                                <input
                                  type="text"
                                  value={owner.taxId}
                                  onChange={(e) => updateOwner(owner.id, 'taxId', e.target.value)}
                                  className={`input-field ${validationErrors[`owner${index}TaxId`] ? 'border-red-500' : ''}`}
                                  maxLength={100}
                                  required
                                />
                                {validationErrors[`owner${index}TaxId`] && (
                                  <p className="text-red-500 text-xs mt-1">{validationErrors[`owner${index}TaxId`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                                <input
                                  type="text"
                                  value={owner.address1}
                                  onChange={(e) => updateOwner(owner.id, 'address1', e.target.value)}
                                  className={`input-field ${validationErrors[`owner${index}Address1`] ? 'border-red-500' : ''}`}
                                  maxLength={255}
                                  required
                                />
                                {validationErrors[`owner${index}Address1`] && (
                                  <p className="text-red-500 text-xs mt-1">{validationErrors[`owner${index}Address1`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                                <input
                                  type="text"
                                  value={owner.address2}
                                  onChange={(e) => updateOwner(owner.id, 'address2', e.target.value)}
                                  className={`input-field ${validationErrors[`owner${index}Address2`] ? 'border-red-500' : ''}`}
                                  maxLength={255}
                                />
                                {validationErrors[`owner${index}Address2`] && (
                                  <p className="text-red-500 text-xs mt-1">{validationErrors[`owner${index}Address2`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                                <input
                                  type="text"
                                  value={owner.city}
                                  onChange={(e) => updateOwner(owner.id, 'city', e.target.value)}
                                  className={`input-field ${validationErrors[`owner${index}City`] ? 'border-red-500' : ''}`}
                                  maxLength={100}
                                  required
                                />
                                {validationErrors[`owner${index}City`] && (
                                  <p className="text-red-500 text-xs mt-1">{validationErrors[`owner${index}City`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">State/Province/Region *</label>
                                <select
                                  value={owner.state}
                                  onChange={(e) => updateOwner(owner.id, 'state', e.target.value)}
                                  className={`input-field ${validationErrors[`owner${index}State`] ? 'border-red-500' : ''}`}
                                  disabled={!owner.country}
                                  required
                                >
                                  {!owner.country ? (
                                    <option value="">Select state...</option>
                                  ) : ownerStatesLoading[owner.id] ? (
                                    <option value="">Loading...</option>
                                  ) : (ownerStatesMap[owner.id] || []).length === 0 ? (
                                    <option value="">No states available</option>
                                  ) : (
                                    <>
                                      <option value="">Select state...</option>
                                      {ownerStatesMap[owner.id]?.map(s => (
                                        <option key={s.state_code} value={s.state_code}>{s.name}</option>
                                      ))}
                                    </>
                                  )}
                                </select>
                                {validationErrors[`owner${index}State`] && (
                                  <p className="text-red-500 text-xs mt-1">{validationErrors[`owner${index}State`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                                <select
                                  value={owner.country}
                                  onChange={(e) => updateOwner(owner.id, 'country', e.target.value)}
                                  className="input-field"
                                  required
                                >
                                  <option value="">Select country...</option>
                                  {countries.map(opt => (
                                    <option key={opt.Iso2} value={opt.Iso2}>{opt.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                                <input
                                  type="text"
                                  value={owner.postalCode}
                                  onChange={(e) => updateOwner(owner.id, 'postalCode', e.target.value)}
                                  className={`input-field ${validationErrors[`owner${index}PostalCode`] ? 'border-red-500' : ''}`}
                                  maxLength={20}
                                  required
                                />
                                {validationErrors[`owner${index}PostalCode`] && (
                                  <p className="text-red-500 text-xs mt-1">{validationErrors[`owner${index}PostalCode`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                                <select
                                  value={owner.role}
                                  onChange={(e) => updateOwner(owner.id, 'role', e.target.value)}
                                  className="input-field"
                                  required
                                >
                                  <option value="beneficial_owner">Beneficial Owner</option>
                                  <option value="beneficial_controlling">Beneficial Controlling</option>
                                  <option value="controlling_person">Controlling Person</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Country *</label>
                                <select
                                  value={owner.idDocCountry}
                                  onChange={(e) => updateOwner(owner.id, 'idDocCountry', e.target.value)}
                                  className="input-field"
                                  required
                                >
                                  <option value="">Select country...</option>
                                  {countries.map(opt => (
                                    <option key={opt.Iso2} value={opt.Iso2}>{opt.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Type *</label>
                                <select
                                  value={owner.idDocType}
                                  onChange={(e) => updateOwner(owner.id, 'idDocType', e.target.value)}
                                  className="input-field"
                                  required
                                >
                                  <option value="">Select document type...</option>
                                  {idDocTypeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                {/* <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Front File *</label> */}
                                <FileInput 
                                  label="ID Document Front File"
                                  value={owner.idDocFrontFile}
                                  onChange={(url, fileName) =>
                                    updateOwner(owner.id, 'idDocFrontFile', url)
                                  }
                                  required
                                  uploadFile={uploadClientDocument}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        {/* <label className="block text-sm font-medium text-gray-700 mb-2">Incorporation Document File *</label> */}
                        <FileInput 
                          label="Incorporation Document File"
                          value={newClientData.incorporationDocFile}
                          onChange={(url, fileName) =>
                            setNewClientData((prev) => ({
                              ...prev,
                              incorporationDocFile: url,
                            }))
                          }
                          required
                          uploadFile={uploadClientDocument}
                        />
                      </div>
                      <div>
                        {/* <label className="block text-sm font-medium text-gray-700 mb-2">Proof of Ownership Document File *</label> */}
                        <FileInput 
                          label="Proof of Ownership Document File"
                          value={newClientData.proofOfOwnershipDocFile}
                          onChange={(url, fileName) =>
                            setNewClientData((prev) => ({
                              ...prev,
                              proofOfOwnershipDocFile: url,
                            }))
                          }
                          required
                          uploadFile={uploadClientDocument}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms of Service Agreement */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tos-agreement"
                    checked={agreedToTos}
                    onChange={e => setAgreedToTos(e.target.checked)}
                    className={`mr-2 ${validationErrors.tosAgreement ? 'border-red-500' : ''}`}
                  />
                  <label htmlFor="tos-agreement" className="text-sm text-gray-700">
                    I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-primary-600">Terms of Service</a>
                  </label>
                </div>
                {validationErrors.tosAgreement && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.tosAgreement}</p>
                )}
              </div>

              <div className="flex space-x-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setApiError(null);
                    setValidationErrors({});
                    setShowValidationError(false);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={!newClientData.firstName || !newClientData.lastName || !newClientData.email || !newClientData.password || !agreedToTos}
                  className={`btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed ${creatingClient ? 'opacity-75' : ''}`}
                >
                  {creatingClient ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Status Modal */}
      {showKycModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Update KYC Status</h3>
                <button
                  onClick={() => {
                    setShowKycModal(false);
                    setShowDetailsModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Current KYC status for <span className="font-medium">{selectedClient.first_name} {selectedClient.last_name}</span>:
                </p>
                <div className="flex justify-center mb-4">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getKycStatusColor(selectedClient.kyc_status)}`}>
                    {selectedClient.kyc_status.replace('_', ' ')}
                  </span>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New KYC Status
                </label>
                <select
                  value={selectedClient.kyc_status}
                  onChange={(e) => setSelectedClient({...selectedClient, kyc_status: e.target.value})}
                  className="input-field"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="requires_documents">Requires Documents</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowKycModal(false);
                    setShowDetailsModal(false);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleKycStatusChange(selectedClient.id, selectedClient.kyc_status)}
                  className="btn-primary flex-1"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setShowDetailsModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Generate a new temporary password for <span className="font-medium">{selectedClient.first_name} {selectedClient.last_name}</span>.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Important</h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        The client will be required to change this password on their next login. Make sure to communicate this password securely.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newClientData.password || ''}
                    onChange={(e) => setNewClientData(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field flex-1"
                    placeholder="New temporary password"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="btn-secondary px-3"
                    title="Generate Password"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setShowDetailsModal(false);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    showSuccessMessage(`Password reset for ${selectedClient.first_name} ${selectedClient.last_name}`);
                    setShowPasswordModal(false);
                  }}
                  disabled={!newClientData.password}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Reset Modal */}
      {showWalletResetModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Reset Wallet</h3>
                <button
                  onClick={() => {
                    setShowWalletResetModal(false);
                    setShowDetailsModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Reset wallet connection for <span className="font-medium">{selectedClient.first_name} {selectedClient.last_name}</span>.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">Warning</h4>
                      <p className="text-sm text-red-800 mt-1">
                        This will disconnect the client's current wallet. The client will need to connect a new wallet to continue using the platform.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Reset
                  </label>
                  <textarea
                    value={walletResetReason}
                    onChange={(e) => setWalletResetReason(e.target.value)}
                    className="input-field w-full"
                    placeholder="e.g., Client lost access to wallet, security concern, etc."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {walletResetReason.length}/500 characters
                  </p>
                </div>

                {(selectedClient as any).wallet_address && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Current Wallet</h4>
                    <p className="text-sm text-gray-600 font-mono">
                      {(selectedClient as any).wallet_address}
                    </p>
                    {(selectedClient as any).wallet_network && (
                      <p className="text-xs text-gray-500 mt-1">
                        Network: {(selectedClient as any).wallet_network}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowWalletResetModal(false);
                    setShowDetailsModal(false);
                  }}
                  className="btn-secondary flex-1"
                  disabled={resettingWallet}
                >
                  Cancel
                </button>
                <button
                  onClick={handleWalletReset}
                  disabled={resettingWallet}
                  className="btn-primary flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingWallet ? 'Resetting...' : 'Reset Wallet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {showDetailsModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Client Details</h3>
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setShowDetailsModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Header */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedClient.first_name} {selectedClient.last_name}</h4>
                    <p className="text-sm text-gray-600">{selectedClient.users?.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedClient.users?.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedClient.users?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Type
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.clientType}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.firstName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.lastName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.phoneNumber}</div>
                    </div>
                  </div>
                </div>

                {/* Account Credentials */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Account Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temporary Password
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.password}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Created At
                      </label>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedClient.created_at).toLocaleDateString()}
                    </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                    <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.country}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax ID
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.taxId}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 1
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.address1}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 2
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.address2}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.city}</div>
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province/Region
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.state}</div>
                </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.postalCode}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proof of Address Type
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.proofOfAddressType}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proof of Address Document
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.proofOfAddressDocFile}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        TOS ID
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.tosId}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IP Address
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.ipAddress}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image URL
                      </label>
                      <div className="text-sm text-gray-900">{selectedClient.imageUrl}</div>
                    </div>
                  </div>
                  {/* Individual-specific fields */}
                  {selectedClient.clientType === 'individual' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Document Country
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.idDocCountry}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Document Type
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.idDocType}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Document Front File
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.idDocFrontFile}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Document Back File
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.idDocBackFile}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Source of Funds Document Type
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.sourceOfFundsDocType}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Source of Funds Document File
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.sourceOfFundsDocFile}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Individual Holding Document Front File
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.individualHoldingDocFrontFile}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Purpose of Transactions
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.purposeOfTransactions}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Purpose of Transactions Explanation
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.purposeOfTransactionsExplanation}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          External ID
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.externalId}</div>
                    </div>
                  </div>
                )}
                  {/* Business-specific fields */}
                  {selectedClient.clientType === 'business' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Legal Name
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.legalName}</div>
                </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alternate Name (DBA)
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.doingBusinessAs}</div>
              </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Formation Date
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.formationDate}</div>
            </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.website}</div>
                      </div>
                      {/* Owners/UBOs dynamic list (simplified for brevity) */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Owners/UBOs
                        </label>
                        {/* Render a list of owner forms, add/remove buttons, etc. */}
                        {/* For each owner: firstName, lastName, dateOfBirth, taxId, address1, city, state, country, postalCode, idDocCountry, idDocType, idDocFrontFile, idDocBackFile, proofOfAddressType, proofOfAddressDocFile */}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Incorporation Document File
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.incorporationDocFile}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Proof of Ownership Document File
                        </label>
                        <div className="text-sm text-gray-900">{selectedClient.proofOfOwnershipDocFile}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}