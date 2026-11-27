import { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Lock,
  Unlock,
  DollarSign,
  TrendingUp,
  CheckCircle,
  User,
  Building2,
  Globe,
  X,
  Download,
  Key,
  Copy,
  Check,
  Shield
} from 'lucide-react';
import { useAccounts, useClients, useAccountManagement } from '../../hooks/useDatabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AccountManagement() {
  const { accounts, loading, error, refetch, updateAccountStatus } = useAccounts();
  const { clients } = useClients();
  const { createAccount, loading: creatingAccount } = useAccountManagement();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [newAccountData, setNewAccountData] = useState({
    clientId: '',
    accountName: '',
    accountNumber: '',
    accountType: 'current' as 'current' | 'savings' | 'multi_currency' | 'business',
    currency: 'USD',
    initialBalance: 0,
    interestRate: 0,
    overdraftLimit: 0,
    minimumBalance: 0,
    monthlyFee: 0,
    pinNumber: ''
  });
  const [bankAccountFields, setBankAccountFields] = useState<{
    [key: string]: string;
    iban: string;
    clabe: string;
    pix_key: string;
    account_number: string;
    routing_number: string;
  }>({
    iban: '',
    clabe: '',
    pix_key: '',
    account_number: '',
    routing_number: '',
  });
  const [formError, setFormError] = useState('');
  const [selectedBankType, setSelectedBankType] = useState('');
  // --- Add to state ---
  const [achFields, setAchFields] = useState<{ [key: string]: string }>({
    beneficiary_name: '',
    routing_number: '',
    account_number: '',
    account_type: '',
    account_class: '',
  });
  const [pixFields, setPixFields] = useState<{ [key: string]: string }>({
    pix_key: '',
  });
  const [speiFields, setSpeiFields] = useState<{ [key: string]: string }>({
    beneficiary_name: '',
    spei_protocol: '',
    spei_institution_code: '',
    spei_clabe: '',
  });
  const [achCopFields, setAchCopFields] = useState<{ [key: string]: string }>({
    account_type: '',
    ach_cop_beneficiary_first_name: '',
    ach_cop_beneficiary_last_name: '',
    ach_cop_document_id: '',
    ach_cop_document_type: '',
    ach_cop_email: '',
    ach_cop_bank_code: '',
    ach_cop_bank_account: '',
  });
  const [transfersFields, setTransfersFields] = useState<{ [key: string]: string }>({
    beneficiary_name: '',
    transfers_type: '',
    transfers_account: '',
  });
  const [wireFields, setWireFields] = useState<{
    [key: string]: string;
    beneficiary_name: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state_province_region: string;
    country: string;
    postal_code: string;
    routing_number: string;
    account_number: string;
  }>({
    beneficiary_name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province_region: '',
    country: '',
    postal_code: '',
    routing_number: '',
    account_number: '',
  });

  const [swiftFields, setSwiftFields] = useState<{
    [key: string]: string;
    swift_code_bic: string;
    swift_account_holder_name: string;
    swift_account_number_iban: string;
    swift_beneficiary_address_line_1: string;
    swift_beneficiary_address_line_2: string;
    swift_beneficiary_country: string;
    swift_beneficiary_city: string;
    swift_beneficiary_state_province_region: string;
    swift_beneficiary_postal_code: string;
    swift_bank_name: string;
    swift_bank_address_line_1: string;
    swift_bank_address_line_2: string;
    swift_bank_country: string;
    swift_bank_city: string;
    swift_bank_state_province_region: string;
    swift_bank_postal_code: string;
    swift_intermediary_bank_swift_code_bic: string;
    swift_intermediary_bank_account_number_iban: string;
    swift_intermediary_bank_name: string;
    swift_intermediary_bank_country: string;
  }>({
    swift_code_bic: '',
    swift_account_holder_name: '',
    swift_account_number_iban: '',
    swift_beneficiary_address_line_1: '',
    swift_beneficiary_address_line_2: '',
    swift_beneficiary_country: '',
    swift_beneficiary_city: '',
    swift_beneficiary_state_province_region: '',
    swift_beneficiary_postal_code: '',
    swift_bank_name: '',
    swift_bank_address_line_1: '',
    swift_bank_address_line_2: '',
    swift_bank_country: '',
    swift_bank_city: '',
    swift_bank_state_province_region: '',
    swift_bank_postal_code: '',
    swift_intermediary_bank_swift_code_bic: '',
    swift_intermediary_bank_account_number_iban: '',
    swift_intermediary_bank_name: '',
    swift_intermediary_bank_country: '',
  });

  // Helper to get selected client object
  const selectedClient = clients.find(c => c.id === newAccountData.clientId);

  // Helper to get msbId (assume from selectedClient or context)
  const msbId = selectedClient?.msb_id || user?.msbId || '';

  // Helper to determine which bank fields to show
  const getBankFieldsForCurrency = (currency: string) => {
    switch (currency) {
      case 'EUR':
      case 'GBP':
        return ['iban'];
      case 'MXN':
        return ['clabe'];
      case 'BRL':
        return ['pix_key'];
      case 'USD':
        return ['account_number', 'routing_number'];
      default:
        return ['iban'];
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'current': return <CreditCard className="w-4 h-4" />;
      case 'savings': return <TrendingUp className="w-4 h-4" />;
      case 'multi_currency': return <Globe className="w-4 h-4" />;
      case 'business': return <Building2 className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'frozen': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleStatusChange = async (accountId: string, newStatus: string) => {
    try {
      await updateAccountStatus(accountId, newStatus);
      showSuccessMessage(`Account ${newStatus === 'frozen' ? 'frozen' : 'unfrozen'} successfully`);
    } catch (error) {
      console.error('Failed to update account status:', error);
    }
  };

  const handleAccountAction = async (action: string, accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    try {
      switch (action) {
        case 'freeze':
          await updateAccountStatus(accountId, 'frozen');
          showSuccessMessage('Account frozen successfully');
          break;
        case 'unfreeze':
          await updateAccountStatus(accountId, 'active');
          showSuccessMessage('Account unfrozen successfully');
          break;
        case 'viewPin':
          setSelectedAccount(account);
          setShowPinModal(true);
          break;
        case 'sendStatement':
          showSuccessMessage('Account statement sent successfully');
          break;
        case 'generateCard':
          showSuccessMessage('New card generation initiated');
          break;
        case 'closeAccount':
          if (confirm('Are you sure you want to close this account? This action cannot be undone.')) {
            await updateAccountStatus(accountId, 'closed');
            showSuccessMessage('Account closed successfully');
          }
          break;
        default:
          console.log(`Action ${action} for account ${accountId}`);
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      for (const accountId of selectedAccounts) {
        switch (action) {
          case 'freeze':
            await updateAccountStatus(accountId, 'frozen');
            break;
          case 'unfreeze':
            await updateAccountStatus(accountId, 'active');
            break;
          case 'sendStatements':
            // Simulate sending statements
            break;
          case 'generateCards':
            // Simulate card generation
            break;
        }
      }
      showSuccessMessage(`Bulk ${action} completed for ${selectedAccounts.length} accounts`);
      setSelectedAccounts([]);
      setShowBulkActionsModal(false);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  // --- Add mapping helper ---
  const blindPayAccountTypeMap: Record<string, string> = {
    current: 'checking',
    savings: 'saving',
  };

  const handleCreateAccount = async () => {
    setFormError('');
    // Validate msb_id
    if (!msbId || msbId === 'undefined') {
      setFormError('MSB ID is missing. Please select a valid client or contact support.');
      return;
    }
    // Validate payment rail type
    if (!selectedBankType) {
      setFormError('Please select a payment rail (type).');
      return;
    }
    
    // Validate account number based on currency
    let hasValidAccountNumber = false;
    if (newAccountData.currency === 'EUR' || newAccountData.currency === 'GBP') {
      hasValidAccountNumber = !!bankAccountFields.iban;
      if (!hasValidAccountNumber) {
        setFormError('IBAN is required for EUR/GBP accounts.');
        return;
      }
    } else if (newAccountData.currency === 'MXN') {
      hasValidAccountNumber = !!bankAccountFields.clabe;
      if (!hasValidAccountNumber) {
        setFormError('CLABE is required for MXN accounts.');
        return;
      }
    } else if (newAccountData.currency === 'BRL') {
      hasValidAccountNumber = !!bankAccountFields.pix_key;
      if (!hasValidAccountNumber) {
        setFormError('PIX key is required for BRL accounts.');
        return;
      }
    } else if (newAccountData.currency === 'USD') {
      hasValidAccountNumber = !!bankAccountFields.account_number;
      if (!hasValidAccountNumber) {
        setFormError('Account number is required for USD accounts.');
        return;
      }
    } else {
      hasValidAccountNumber = !!newAccountData.accountNumber;
      if (!hasValidAccountNumber) {
        setFormError('Account number is required.');
        return;
      }
    }
    
    if (!/^\d+$/.test(newAccountData.accountNumber)) {
      setFormError('Account number must contain only digits.');
      return;
    }
    
    if (newAccountData.accountNumber.length > 50) {
      setFormError('Account number must not exceed 50 characters.');
      return;
    }
    // Validate account name
    if (!newAccountData.accountName) {
      setFormError('Account name is required.');
      return;
    }
    
    if (newAccountData.accountName.length > 100) {
      setFormError('Account name must not exceed 100 characters.');
      return;
    }
    
    // Validate PIN number
    if (!newAccountData.pinNumber) {
      setFormError('PIN number is required.');
      return;
    }
    
    if (!/^\d{5}$/.test(newAccountData.pinNumber)) {
      setFormError('PIN must be exactly 5 digits (numbers only).');
      return;
    }
    
    // Validate interest rate
    if (newAccountData.interestRate > 999.99) {
      setFormError('Interest rate cannot exceed 999.99%.');
      return;
    }
    
    // Validate numeric fields for non-negative values
    if (newAccountData.initialBalance < 0) {
      setFormError('Initial balance cannot be negative.');
      return;
    }
    
    if (newAccountData.overdraftLimit < 0) {
      setFormError('Overdraft limit cannot be negative.');
      return;
    }
    
    if (newAccountData.minimumBalance < 0) {
      setFormError('Minimum balance cannot be negative.');
      return;
    }
    
    if (newAccountData.monthlyFee < 0) {
      setFormError('Monthly fee cannot be negative.');
      return;
    }
    
    // Validate other numeric fields for maximum values
    if (newAccountData.overdraftLimit > 999999999999.99) {
      setFormError('Overdraft limit is too high.');
      return;
    }
    
    if (newAccountData.minimumBalance > 999999999999.99) {
      setFormError('Minimum balance is too high.');
      return;
    }
    
    if (newAccountData.monthlyFee > 99999999.99) {
      setFormError('Monthly fee is too high.');
      return;
    }
    // Validate fields for each rail
    let bankAccountData: any = {
      type: selectedBankType,
      name: newAccountData.accountName,
      account_type: blindPayAccountTypeMap[newAccountData.accountType] || 'checking',
    };
    if (selectedBankType === 'wire') {
      const requiredWireFields = ['beneficiary_name', 'address_line_1', 'city', 'state_province_region', 'country', 'postal_code', 'routing_number', 'account_number'];
      for (const field of requiredWireFields) {
        if (!wireFields[field]) {
          setFormError(`Field '${field.replace(/_/g, ' ')}' is required for wire transfers.`);
          return;
        }
      }
      
      // Validate wire field lengths
      if (wireFields.beneficiary_name.length > 100) {
        setFormError('Beneficiary name must not exceed 100 characters.');
        return;
      }
      if (wireFields.address_line_1.length > 200) {
        setFormError('Address line 1 must not exceed 200 characters.');
        return;
      }
      if (wireFields.address_line_2 && wireFields.address_line_2.length > 200) {
        setFormError('Address line 2 must not exceed 200 characters.');
        return;
      }
      if (wireFields.city.length > 100) {
        setFormError('City must not exceed 100 characters.');
        return;
      }
      if (wireFields.state_province_region.length > 50) {
        setFormError('State/Province/Region must not exceed 50 characters.');
        return;
      }
      if (wireFields.country.length > 3) {
        setFormError('Country code must not exceed 3 characters.');
        return;
      }
      if (wireFields.postal_code.length > 20) {
        setFormError('Postal code must not exceed 20 characters.');
        return;
      }
      if (!/^\d{9}$/.test(wireFields.routing_number)) {
        setFormError('Routing number must be exactly 9 digits.');
        return;
      }
      
      if (wireFields.routing_number.length > 20) {
        setFormError('Routing number must not exceed 20 characters.');
        return;
      }
      if (!/^\d+$/.test(wireFields.account_number)) {
        setFormError('Account number must be numeric.');
        return;
      }
      
      if (wireFields.account_number.length > 50) {
        setFormError('Account number must not exceed 50 characters.');
        return;
      }
      
      bankAccountData = { ...bankAccountData, ...wireFields };
    } else if (selectedBankType === 'ach') {
      const requiredAchFields = ['beneficiary_name', 'routing_number', 'account_number', 'account_type', 'account_class'];
      for (const field of requiredAchFields) {
        if (!achFields[field]) {
          setFormError(`Field '${field.replace(/_/g, ' ')}' is required for ACH transfers.`);
          return;
        }
      }
      
      // Validate ACH field lengths
      if (achFields.beneficiary_name.length > 100) {
        setFormError('Beneficiary name must not exceed 100 characters.');
        return;
      }
      if (!/^\d{9}$/.test(achFields.routing_number)) {
        setFormError('Routing number must be exactly 9 digits.');
        return;
      }
      
      if (achFields.routing_number.length > 20) {
        setFormError('Routing number must not exceed 20 characters.');
        return;
      }
      if (!/^\d+$/.test(achFields.account_number)) {
        setFormError('Account number must be numeric.');
        return;
      }
      
      if (achFields.account_number.length > 50) {
        setFormError('Account number must not exceed 50 characters.');
        return;
      }
      
      bankAccountData = { ...bankAccountData, ...achFields };
    } else if (selectedBankType === 'pix') {
      if (!pixFields.pix_key) {
        setFormError('Field "pix key" is required for PIX transfers.');
        return;
      }
      
      // Validate PIX field lengths
      if (pixFields.pix_key.length > 100) {
        setFormError('PIX key must not exceed 100 characters.');
        return;
      }
      
      bankAccountData = { ...bankAccountData, ...pixFields };
    } else if (selectedBankType === 'spei_bitso') {
      const requiredSpeiFields = ['beneficiary_name', 'spei_protocol', 'spei_institution_code', 'spei_clabe'];
      for (const field of requiredSpeiFields) {
        if (!speiFields[field]) {
          setFormError(`Field '${field.replace(/_/g, ' ')}' is required for SPEI transfers.`);
          return;
        }
      }
      
      // Validate SPEI field lengths
      if (speiFields.beneficiary_name.length > 100) {
        setFormError('Beneficiary name must not exceed 100 characters.');
        return;
      }
      if (speiFields.spei_protocol.length > 10) {
        setFormError('SPEI protocol must not exceed 10 characters.');
        return;
      }
      if (speiFields.spei_institution_code.length > 20) {
        setFormError('SPEI institution code must not exceed 20 characters.');
        return;
      }
      if (speiFields.spei_clabe.length > 50) {
        setFormError('SPEI CLABE must not exceed 50 characters.');
        return;
      }
      
      bankAccountData = { ...bankAccountData, ...speiFields };
    } else if (selectedBankType === 'ach_cop_bitso') {
      const requiredAchCopFields = ['account_type', 'ach_cop_beneficiary_first_name', 'ach_cop_beneficiary_last_name', 'ach_cop_document_id', 'ach_cop_document_type', 'ach_cop_email', 'ach_cop_bank_code', 'ach_cop_bank_account'];
      for (const field of requiredAchCopFields) {
        if (!achCopFields[field]) {
          setFormError(`Field '${field.replace(/_/g, ' ')}' is required for ACH COP transfers.`);
          return;
        }
      }
      
      // Validate ACH COP field lengths
      if (achCopFields.ach_cop_beneficiary_first_name.length > 50) {
        setFormError('Beneficiary first name must not exceed 50 characters.');
        return;
      }
      if (achCopFields.ach_cop_beneficiary_last_name.length > 50) {
        setFormError('Beneficiary last name must not exceed 50 characters.');
        return;
      }
      if (achCopFields.ach_cop_document_id.length > 30) {
        setFormError('Document ID must not exceed 30 characters.');
        return;
      }
      if (achCopFields.ach_cop_email.length > 100) {
        setFormError('Email must not exceed 100 characters.');
        return;
      }
      if (achCopFields.ach_cop_bank_code.length > 20) {
        setFormError('Bank code must not exceed 20 characters.');
        return;
      }
      if (achCopFields.ach_cop_bank_account.length > 50) {
        setFormError('Bank account must not exceed 50 characters.');
        return;
      }
      
      bankAccountData = { ...bankAccountData, ...achCopFields };
    } else if (selectedBankType === 'transfers_bitso') {
      const requiredTransfersFields = ['beneficiary_name', 'transfers_type', 'transfers_account'];
      for (const field of requiredTransfersFields) {
        if (!transfersFields[field]) {
          setFormError(`Field '${field.replace(/_/g, ' ')}' is required for Transfers 3.0.`);
          return;
        }
      }
      
      // Validate Transfers field lengths
      if (transfersFields.beneficiary_name.length > 100) {
        setFormError('Beneficiary name must not exceed 100 characters.');
        return;
      }
      if (transfersFields.transfers_type.length > 20) {
        setFormError('Transfers type must not exceed 20 characters.');
        return;
      }
      if (transfersFields.transfers_account.length > 50) {
        setFormError('Transfers account must not exceed 50 characters.');
        return;
      }
      
      bankAccountData = { ...bankAccountData, ...transfersFields };
    } else if (selectedBankType === 'international_swift') {
      const requiredSwiftFields = ['swift_code_bic', 'swift_account_holder_name', 'swift_account_number_iban', 'swift_beneficiary_address_line_1', 'swift_beneficiary_country', 'swift_beneficiary_city'];
      for (const field of requiredSwiftFields) {
        if (!swiftFields[field]) {
          setFormError(`Field '${field.replace(/_/g, ' ')}' is required for International SWIFT transfers.`);
          return;
        }
      }
      
      // Validate SWIFT field lengths
      if (swiftFields.swift_account_holder_name.length > 100) {
        setFormError('Account holder name must not exceed 100 characters.');
        return;
      }
      if (swiftFields.swift_beneficiary_address_line_1.length > 200) {
        setFormError('Beneficiary address line 1 must not exceed 200 characters.');
        return;
      }
      if (swiftFields.swift_beneficiary_address_line_2 && swiftFields.swift_beneficiary_address_line_2.length > 200) {
        setFormError('Beneficiary address line 2 must not exceed 200 characters.');
        return;
      }
      if (swiftFields.swift_beneficiary_city.length > 100) {
        setFormError('Beneficiary city must not exceed 100 characters.');
        return;
      }
      if (swiftFields.swift_beneficiary_country.length !== 2) {
        setFormError('Beneficiary country code must be exactly 2 characters (e.g., US, GB, DE).');
        return;
      }
      if (swiftFields.swift_beneficiary_postal_code && swiftFields.swift_beneficiary_postal_code.length > 20) {
        setFormError('Beneficiary postal code must not exceed 20 characters.');
        return;
      }
      if (swiftFields.swift_beneficiary_state_province_region && !/^[A-Z]{2}$/.test(swiftFields.swift_beneficiary_state_province_region)) {
        setFormError('Beneficiary state/province/region must be exactly 2 capital letters (e.g., NY, CA, TX).');
        return;
      }
      if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swiftFields.swift_code_bic)) {
        setFormError('SWIFT/BIC code must be 8 or 11 characters (letters and numbers).');
        return;
      }
      if (swiftFields.swift_account_number_iban.length > 50) {
        setFormError('Account number/IBAN must not exceed 50 characters.');
        return;
      }
      if (swiftFields.swift_bank_name && swiftFields.swift_bank_name.length > 100) {
        setFormError('Bank name must not exceed 100 characters.');
        return;
      }
      if (swiftFields.swift_bank_address_line_1 && swiftFields.swift_bank_address_line_1.length > 200) {
        setFormError('Bank address line 1 must not exceed 200 characters.');
        return;
      }
      if (swiftFields.swift_bank_address_line_2 && swiftFields.swift_bank_address_line_2.length > 200) {
        setFormError('Bank address line 2 must not exceed 200 characters.');
        return;
      }
      if (swiftFields.swift_bank_city && swiftFields.swift_bank_city.length > 100) {
        setFormError('Bank city must not exceed 100 characters.');
        return;
      }
      if (swiftFields.swift_bank_country && swiftFields.swift_bank_country.length !== 2) {
        setFormError('Bank country code must be exactly 2 characters (e.g., US, GB, DE).');
        return;
      }
      if (swiftFields.swift_bank_state_province_region && !/^[A-Z]{2}$/.test(swiftFields.swift_bank_state_province_region)) {
        setFormError('Bank state/province/region must be exactly 2 capital letters (e.g., NY, CA, TX).');
        return;
      }
      if (swiftFields.swift_intermediary_bank_swift_code_bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swiftFields.swift_intermediary_bank_swift_code_bic)) {
        setFormError('Intermediary bank SWIFT/BIC code must be 8 or 11 characters (letters and numbers).');
        return;
      }
      if (swiftFields.swift_intermediary_bank_name && swiftFields.swift_intermediary_bank_name.length > 100) {
        setFormError('Intermediary bank name must not exceed 100 characters.');
        return;
      }
      if (swiftFields.swift_intermediary_bank_country && swiftFields.swift_intermediary_bank_country.length !== 2) {
        setFormError('Intermediary bank country code must be exactly 2 characters (e.g., US, GB, DE).');
        return;
      }
      
      // Filter out empty optional fields for SWIFT to avoid API validation errors
      const filteredSwiftFields = Object.fromEntries(
        Object.entries(swiftFields).filter(([key, value]) => {
          // Keep all required fields
          if (['swift_code_bic', 'swift_account_holder_name', 'swift_account_number_iban', 
               'swift_beneficiary_address_line_1', 'swift_beneficiary_country', 'swift_beneficiary_city'].includes(key)) {
            return true;
          }
          // Only keep optional fields that have values (not empty strings)
          return value && value.trim() !== '';
        })
      );
      
      // Validate state/province/region fields if they have values
      if (filteredSwiftFields.swift_beneficiary_state_province_region && 
          !/^[A-Z]{2}$/.test(filteredSwiftFields.swift_beneficiary_state_province_region)) {
        setFormError('Beneficiary state/province/region must be exactly 2 capital letters (e.g., NY, CA, TX).');
        return;
      }
      
      if (filteredSwiftFields.swift_bank_state_province_region && 
          !/^[A-Z]{2}$/.test(filteredSwiftFields.swift_bank_state_province_region)) {
        setFormError('Bank state/province/region must be exactly 2 capital letters (e.g., NY, CA, TX).');
        return;
      }
      
      bankAccountData = { ...bankAccountData, ...filteredSwiftFields };
    } else {
      const fields = getBankFieldsForCurrency(newAccountData.currency);
      fields.forEach(f => { bankAccountData[f] = bankAccountFields[f]; });
      
      // Validate basic bank field lengths
      if (bankAccountFields.iban && bankAccountFields.iban.length > 50) {
        setFormError('IBAN must not exceed 50 characters.');
        return;
      }
      if (bankAccountFields.clabe && bankAccountFields.clabe.length > 50) {
        setFormError('CLABE must not exceed 50 characters.');
        return;
      }
      if (bankAccountFields.pix_key && bankAccountFields.pix_key.length > 100) {
        setFormError('PIX key must not exceed 100 characters.');
        return;
      }
      if (bankAccountFields.account_number && !/^\d+$/.test(bankAccountFields.account_number)) {
        setFormError('Account number must be numeric.');
        return;
      }
      
      if (bankAccountFields.account_number && bankAccountFields.account_number.length > 50) {
        setFormError('Account number must not exceed 50 characters.');
        return;
      }
      if (bankAccountFields.routing_number && !/^\d{9}$/.test(bankAccountFields.routing_number)) {
        setFormError('Routing number must be exactly 9 digits.');
        return;
      }
      
      if (bankAccountFields.routing_number && bankAccountFields.routing_number.length > 20) {
        setFormError('Routing number must not exceed 20 characters.');
        return;
      }
    }
    // Debug log
    console.log('bankAccountData:', bankAccountData);
    // Determine account number based on currency and bank account details
    let accountNumber = newAccountData.accountNumber;
    if (newAccountData.currency === 'EUR' && bankAccountFields.iban) {
      accountNumber = bankAccountFields.iban;
    } else if (newAccountData.currency === 'GBP' && bankAccountFields.iban) {
      accountNumber = bankAccountFields.iban;
    } else if (newAccountData.currency === 'MXN' && bankAccountFields.clabe) {
      accountNumber = bankAccountFields.clabe;
    } else if (newAccountData.currency === 'BRL' && bankAccountFields.pix_key) {
      accountNumber = bankAccountFields.pix_key;
    } else if (newAccountData.currency === 'USD' && bankAccountFields.account_number) {
      accountNumber = bankAccountFields.account_number;
    }
    
    // Build payload for backend
    const payload = {
      receiver_id: (selectedClient && 'blindpay_receiver_id' in selectedClient)
        ? (selectedClient as any).blindpay_receiver_id || ''
        : '',
      client_id: newAccountData.clientId,
      msb_id: msbId,
      account_name: newAccountData.accountName,
      account_type: blindPayAccountTypeMap[newAccountData.accountType] || 'checking',
      currency: newAccountData.currency,
      initial_balance: newAccountData.initialBalance,
      overdraft_limit: newAccountData.overdraftLimit,
      minimum_balance: newAccountData.minimumBalance,
      monthly_fee: newAccountData.monthlyFee,
      interest_rate: newAccountData.interestRate,
      pin_number: newAccountData.pinNumber,
      bankAccountData: {
        ...bankAccountData,
        account_number: accountNumber, // Include account number in bankAccountData instead
      },
    };
    try {
      await createAccount(payload);
      refetch();
      setShowCreateModal(false);
      console.log('Modal should now be closed');
      setNewAccountData({
        clientId: '',
        accountName: '',
        accountNumber: '',
        accountType: 'current',
        currency: 'USD',
        initialBalance: 0,
        interestRate: 0,
        overdraftLimit: 0,
        minimumBalance: 0,
        monthlyFee: 0,
        pinNumber: ''
      });
      setBankAccountFields({ iban: '', clabe: '', pix_key: '', account_number: '', routing_number: '' });
      setWireFields({ beneficiary_name: '', address_line_1: '', address_line_2: '', city: '', state_province_region: '', country: '', postal_code: '', routing_number: '', account_number: '' });
      setAchFields({ beneficiary_name: '', routing_number: '', account_number: '', account_type: '', account_class: '' });
      setPixFields({ pix_key: '' });
      setSpeiFields({ beneficiary_name: '', spei_protocol: '', spei_institution_code: '', spei_clabe: '' });
      setAchCopFields({ account_type: '', ach_cop_beneficiary_first_name: '', ach_cop_beneficiary_last_name: '', ach_cop_document_id: '', ach_cop_document_type: '', ach_cop_email: '', ach_cop_bank_code: '', ach_cop_bank_account: '' });
      setTransfersFields({ beneficiary_name: '', transfers_type: '', transfers_account: '' });
      setSwiftFields({ swift_code_bic: '', swift_account_holder_name: '', swift_account_number_iban: '', swift_beneficiary_address_line_1: '', swift_beneficiary_address_line_2: '', swift_beneficiary_country: '', swift_beneficiary_city: '', swift_beneficiary_state_province_region: '', swift_beneficiary_postal_code: '', swift_bank_name: '', swift_bank_address_line_1: '', swift_bank_address_line_2: '', swift_bank_country: '', swift_bank_city: '', swift_bank_state_province_region: '', swift_bank_postal_code: '', swift_intermediary_bank_swift_code_bic: '', swift_intermediary_bank_account_number_iban: '', swift_intermediary_bank_name: '', swift_intermediary_bank_country: '' });
      setSelectedBankType('');
      showSuccessMessage('Account created successfully');
    } catch (error) {
      setFormError('Failed to create account. Please try again.');
      console.error('Failed to create account:', error);
    }
  };

  const generateAccountNumber = () => {
    const prefix = '100'; // Default prefix
    const randomSuffix = Math.floor(Math.random() * 9000000) + 1000000;
    const accountNumber = prefix + randomSuffix.toString();
    setNewAccountData(prev => ({ ...prev, accountNumber }));
  };

  const generatePin = () => {
    const pin = Math.floor(Math.random() * 90000) + 10000;
    setNewAccountData(prev => ({ ...prev, pinNumber: pin.toString() }));
  };

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAccounts.length === filteredAccounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(filteredAccounts.map(account => account.id));
    }
  };

  const handleExport = () => {
    const dataToExport = selectedAccounts.length > 0 
      ? filteredAccounts.filter(a => selectedAccounts.includes(a.id))
      : filteredAccounts;
    
    // Create CSV content
    const headers = ['Account Name', 'Account Number', 'Client', 'Type', 'Currency', 'Balance', 'Status'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(account => [
        `"${account.account_name}"`,
        `"${account.account_number}"`,
        `"${account.clients?.first_name} ${account.clients?.last_name}"`,
        `"${account.account_type}"`,
        `"${account.currency}"`,
        `"${account.balance}"`,
        `"${account.status}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showSuccessMessage(`Exported ${dataToExport.length} accounts`);
  };

  const filteredAccounts = accounts.filter(acc => {
    const clientName = `${acc.clients?.first_name || ''} ${acc.clients?.last_name || ''}`.toLowerCase();
    const matchesSearch = clientName.includes(searchTerm.toLowerCase()) ||
                         acc.account_number.includes(searchTerm) ||
                         acc.account_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;
    const matchesType = typeFilter === 'all' || acc.account_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(String(acc.balance || '0')), 0);
  const activeAccounts = accounts.filter(acc => acc.status === 'active').length;
  const frozenAccounts = accounts.filter(acc => acc.status === 'frozen').length;

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
        <p className="text-red-600">Error loading accounts: {error}</p>
      </div>
    );
  }

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
          <p className="text-gray-600 mt-1">Manage client accounts and balances</p>
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
            Create Account
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{activeAccounts}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Frozen Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{frozenAccounts}</p>
            </div>
            <Lock className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
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
                placeholder="Search accounts..."
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

          {selectedAccounts.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedAccounts.length} selected
              </span>
              <button 
                onClick={() => setShowBulkActionsModal(true)}
                className="btn-secondary text-sm"
              >
                <Edit className="w-4 h-4 mr-1" />
                Bulk Actions
              </button>
            </div>
          )}
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
                  <option value="frozen">Frozen</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Types</option>
                  <option value="current">Current</option>
                  <option value="savings">Savings</option>
                  <option value="multi_currency">Multi-Currency</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
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

      {/* Accounts Table */}
      <div className="card overflow-hidden min-h-[20rem]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 min-h-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th> */}
                {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={() => handleSelectAccount(account.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                        {getAccountTypeIcon(account.account_type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{account.account_name}</div>
                        <div className="text-sm text-gray-500">****{account.account_number.slice(-4)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {account.clients?.first_name} {account.clients?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">ID: {account.client_id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 capitalize">
                      {account.account_type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-500">{account.currency}</div>
                  </td>
                  {/* <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ${account.balance.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Available: ${account.available_balance.toLocaleString()}
                    </div>
                  </td> */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.status)}`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(account.clients?.risk_level || 'low')}`}>
                      {account.clients?.risk_level || 'low'}
                    </span>
                  </td>
                  {/* <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(account.last_activity).toLocaleDateString()}
                    </div>
                  </td> */}
                  {/* <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {account.status === 'active' ? (
                        <button
                          onClick={() => handleAccountAction('freeze', account.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Freeze Account"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      ) : account.status === 'frozen' ? (
                        <button
                          onClick={() => handleAccountAction('unfreeze', account.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Unfreeze Account"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      ) : null}
                      <button
                        onClick={() => setSelectedAccount(account)}
                        className="text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                          <button
                            onClick={() => handleAccountAction('viewPin', account.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Key className="w-4 h-4 inline mr-2" />
                            View PIN
                          </button>
                          <button
                            onClick={() => handleAccountAction('sendStatement', account.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Mail className="w-4 h-4 inline mr-2" />
                            Send Statement
                          </button>
                          <button
                            onClick={() => handleAccountAction('generateCard', account.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <CardIcon className="w-4 h-4 inline mr-2" />
                            Generate Card
                          </button>
                          <button
                            onClick={() => handleAccountAction('closeAccount', account.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 inline mr-2" />
                            Close Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create New Account</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Client *
                  </label>
                  <select
                    value={newAccountData.clientId}
                    onChange={(e) => setNewAccountData(prev => ({ ...prev, clientId: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="">Choose a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} ({client.users?.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      value={newAccountData.accountName}
                      onChange={(e) => setNewAccountData(prev => ({ ...prev, accountName: e.target.value }))}
                      className="input-field"
                      placeholder="Primary Checking"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newAccountData.accountNumber}
                        onChange={(e) => setNewAccountData(prev => ({ ...prev, accountNumber: e.target.value }))}
                        className="input-field flex-1"
                        placeholder="Account number"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateAccountNumber}
                        className="btn-secondary px-3"
                        title="Generate Account Number"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type *
                    </label>
                    <select
                      value={newAccountData.accountType}
                      onChange={(e) => setNewAccountData(prev => ({ ...prev, accountType: e.target.value as any }))}
                      className="input-field"
                      required
                    >
                      <option value="current">Checking Account</option>
                      <option value="savings">Saving Account</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      value={newAccountData.currency}
                      onChange={(e) => setNewAccountData(prev => ({ ...prev, currency: e.target.value }))}
                      className="input-field"
                      required
                    >
                      <option value="USD">USD - US Dollar</option>
                      {/* <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="JPY">JPY - Japanese Yen</option> */}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div style={{ display: 'none' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Balance
                    </label>
                    <input
                      type="number"
                      value={newAccountData.initialBalance}
                      onChange={(e) => setNewAccountData(prev => ({ ...prev, initialBalance: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIN Number *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newAccountData.pinNumber}
                        onChange={(e) => {
                          // Only allow numeric input
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setNewAccountData(prev => ({ ...prev, pinNumber: value }));
                        }}
                        className="input-field flex-1"
                        placeholder="5-digit PIN"
                        maxLength={5}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        required
                      />
                      <button
                        type="button"
                        onClick={generatePin}
                        className="btn-secondary px-3"
                        title="Generate PIN"
                      >
                        Generate
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PIN must be 5 digits (numbers only)
                    </p>
                  </div>
                </div>

                {/* Payment Rail (Type) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Rail (Type) *</label>
                  <select
                    value={selectedBankType}
                    onChange={e => setSelectedBankType(e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Select payment rail...</option>
                    {/* <option value="wire">Wire</option> */}
                    <option value="ach">ACH</option>
                    {/* <option value="pix">PIX</option>
                    <option value="spei_bitso">SPEI Bitso</option>
                    <option value="transfers_bitso">Transfers Bitso</option>
                    <option value="ach_cop_bitso">ACH COP Bitso</option>
                    <option value="international_swift">International SWIFT</option>
                    <option value="rtp">RTP</option> */}
                  </select>
                </div>

                {/* Bank Account Details (BlindPay) */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Bank Account Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getBankFieldsForCurrency(newAccountData.currency).includes('iban') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">IBAN *</label>
                        <input
                          type="text"
                          value={bankAccountFields.iban}
                          onChange={e => {
                            setBankAccountFields(prev => ({ ...prev, iban: e.target.value }));
                            // Auto-populate SWIFT account number if International SWIFT is selected
                            if (selectedBankType === 'international_swift') {
                              setSwiftFields(prev => ({ ...prev, swift_account_number_iban: e.target.value }));
                            }
                          }}
                          className="input-field"
                          placeholder="IBAN"
                          required
                        />
                      </div>
                    )}
                    {getBankFieldsForCurrency(newAccountData.currency).includes('clabe') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CLABE *</label>
                        <input
                          type="text"
                          value={bankAccountFields.clabe}
                          onChange={e => setBankAccountFields(prev => ({ ...prev, clabe: e.target.value }))}
                          className="input-field"
                          placeholder="CLABE"
                          required
                        />
                      </div>
                    )}
                    {getBankFieldsForCurrency(newAccountData.currency).includes('pix_key') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">PIX Key *</label>
                        <input
                          type="text"
                          value={bankAccountFields.pix_key}
                          onChange={e => setBankAccountFields(prev => ({ ...prev, pix_key: e.target.value }))}
                          className="input-field"
                          placeholder="PIX Key"
                          required
                        />
                      </div>
                    )}
                                         {getBankFieldsForCurrency(newAccountData.currency).includes('account_number') && (
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
                         <input
                           type="text"
                           value={bankAccountFields.account_number}
                           onChange={e => {
                             setBankAccountFields(prev => ({ ...prev, account_number: e.target.value }));
                             // Auto-populate SWIFT account number if International SWIFT is selected
                             if (selectedBankType === 'international_swift') {
                               setSwiftFields(prev => ({ ...prev, swift_account_number_iban: e.target.value }));
                             }
                             // Auto-populate ACH account number if ACH is selected
                             if (selectedBankType === 'ach') {
                               setAchFields(prev => ({ ...prev, account_number: e.target.value }));
                             }
                           }}
                           className="input-field"
                           placeholder="Account Number"
                           required
                         />
                       </div>
                     )}
                                         {getBankFieldsForCurrency(newAccountData.currency).includes('routing_number') && (
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number *</label>
                         <input
                           type="text"
                           value={bankAccountFields.routing_number}
                           onChange={e => {
                             setBankAccountFields(prev => ({ ...prev, routing_number: e.target.value }));
                             // Auto-populate ACH routing number if ACH is selected
                             if (selectedBankType === 'ach') {
                               setAchFields(prev => ({ ...prev, routing_number: e.target.value }));
                             }
                           }}
                           className="input-field"
                           placeholder="Routing Number"
                           required
                         />
                       </div>
                     )}
                  </div>
                </div>

                {/* Account Features */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Account Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newAccountData.accountType === 'savings' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interest Rate (% APY)
                        </label>
                        <input
                          type="number"
                          value={newAccountData.interestRate}
                          onChange={(e) => setNewAccountData(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
                          className="input-field"
                          placeholder="2.5"
                          min="0"
                          max="999.99"
                          step="0.01"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter percentage (e.g., 2.5 for 2.5% APY). Maximum: 999.99%
                        </p>
                      </div>
                    )}
                    {(newAccountData.accountType === 'current' || newAccountData.accountType === 'business') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Overdraft Limit
                        </label>
                        <input
                          type="number"
                          value={newAccountData.overdraftLimit}
                          onChange={(e) => setNewAccountData(prev => ({ ...prev, overdraftLimit: parseFloat(e.target.value) || 0 }))}
                          className="input-field"
                          placeholder="5000"
                          min="0"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Balance
                      </label>
                      <input
                        type="number"
                        value={newAccountData.minimumBalance}
                        onChange={(e) => setNewAccountData(prev => ({ ...prev, minimumBalance: parseFloat(e.target.value) || 0 }))}
                        className="input-field"
                        placeholder="100"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Fee
                      </label>
                      <input
                        type="number"
                        value={newAccountData.monthlyFee}
                        onChange={(e) => setNewAccountData(prev => ({ ...prev, monthlyFee: parseFloat(e.target.value) || 0 }))}
                        className="input-field"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {selectedBankType === 'wire' && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Wire Transfer Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiary Name *</label>
                      <input
                        type="text"
                        value={wireFields.beneficiary_name}
                        onChange={e => setWireFields(prev => ({ ...prev, beneficiary_name: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number *</label>
                      <input
                        type="text"
                        value={wireFields.routing_number}
                        onChange={e => setWireFields(prev => ({ ...prev, routing_number: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
                      <input
                        type="text"
                        value={wireFields.account_number}
                        onChange={e => setWireFields(prev => ({ ...prev, account_number: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                      <input
                        type="text"
                        value={wireFields.address_line_1}
                        onChange={e => setWireFields(prev => ({ ...prev, address_line_1: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                      <input
                        type="text"
                        value={wireFields.address_line_2}
                        onChange={e => setWireFields(prev => ({ ...prev, address_line_2: e.target.value }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        value={wireFields.city}
                        onChange={e => setWireFields(prev => ({ ...prev, city: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State/Province/Region (2-letter code) *</label>
                      <input
                        type="text"
                        value={wireFields.state_province_region}
                        onChange={e => setWireFields(prev => ({ ...prev, state_province_region: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country (ISO 2-letter) *</label>
                      <input
                        type="text"
                        value={wireFields.country}
                        onChange={e => setWireFields(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                      <input
                        type="text"
                        value={wireFields.postal_code}
                        onChange={e => setWireFields(prev => ({ ...prev, postal_code: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedBankType === 'ach' && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">ACH Transfer Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiary Name *</label>
                      <input
                        type="text"
                        value={achFields.beneficiary_name}
                        onChange={e => setAchFields(prev => ({ ...prev, beneficiary_name: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                                         <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number *</label>
                       <input
                         type="text"
                         value={achFields.routing_number}
                         onChange={e => setAchFields(prev => ({ ...prev, routing_number: e.target.value }))}
                         className={`input-field ${bankAccountFields.routing_number ? 'bg-gray-50' : ''}`}
                         placeholder={bankAccountFields.routing_number ? "Auto-populated from Bank Account Details" : "Enter routing number"}
                         readOnly={!!bankAccountFields.routing_number}
                         required
                       />
                       {bankAccountFields.routing_number && (
                         <p className="text-xs text-blue-600 mt-1">
                           ✓ Auto-populated from Bank Account Details above
                         </p>
                       )}
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
                       <input
                         type="text"
                         value={achFields.account_number}
                         onChange={e => setAchFields(prev => ({ ...prev, account_number: e.target.value }))}
                         className={`input-field ${bankAccountFields.account_number ? 'bg-gray-50' : ''}`}
                         placeholder={bankAccountFields.account_number ? "Auto-populated from Bank Account Details" : "Enter account number"}
                         readOnly={!!bankAccountFields.account_number}
                         required
                       />
                       {bankAccountFields.account_number && (
                         <p className="text-xs text-blue-600 mt-1">
                           ✓ Auto-populated from Bank Account Details above
                         </p>
                       )}
                     </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Type *</label>
                      <select
                        value={achFields.account_type}
                        onChange={e => setAchFields(prev => ({ ...prev, account_type: e.target.value }))}
                        className="input-field"
                        required
                      >
                        <option value="">Select account type...</option>
                        <option value="checking">Checking</option>
                        <option value="saving">Saving</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Class *</label>
                      <select
                        value={achFields.account_class}
                        onChange={e => setAchFields(prev => ({ ...prev, account_class: e.target.value }))}
                        className="input-field"
                        required
                      >
                        <option value="">Select account class...</option>
                        <option value="individual">Individual</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedBankType === 'pix' && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">PIX Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PIX Key *</label>
                      <input
                        type="text"
                        value={pixFields.pix_key}
                        onChange={e => setPixFields(prev => ({ ...prev, pix_key: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedBankType === 'spei_bitso' && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">SPEI Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiary Name *</label>
                      <input
                        type="text"
                        value={speiFields.beneficiary_name}
                        onChange={e => setSpeiFields(prev => ({ ...prev, beneficiary_name: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SPEI Protocol *</label>
                      <select
                        value={speiFields.spei_protocol}
                        onChange={e => setSpeiFields(prev => ({ ...prev, spei_protocol: e.target.value }))}
                        className="input-field"
                        required
                      >
                        <option value="">Select SPEI protocol...</option>
                        <option value="02">02 - Standard SPEI</option>
                        <option value="03">03 - SPEI 3.0</option>
                        <option value="04">04 - SPEI 4.0</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SPEI Institution Code *</label>
                      <input
                        type="text"
                        value={speiFields.spei_institution_code}
                        onChange={e => setSpeiFields(prev => ({ ...prev, spei_institution_code: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SPEI CLABE *</label>
                      <input
                        type="text"
                        value={speiFields.spei_clabe}
                        onChange={e => setSpeiFields(prev => ({ ...prev, spei_clabe: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedBankType === 'ach_cop_bitso' && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">ACH COP Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Type *</label>
                      <select
                        value={achCopFields.account_type}
                        onChange={e => setAchCopFields(prev => ({ ...prev, account_type: e.target.value }))}
                        className="input-field"
                        required
                      >
                        <option value="">Select account type...</option>
                        <option value="checking">Checking</option>
                        <option value="saving">Saving</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiary First Name *</label>
                      <input
                        type="text"
                        value={achCopFields.ach_cop_beneficiary_first_name}
                        onChange={e => setAchCopFields(prev => ({ ...prev, ach_cop_beneficiary_first_name: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiary Last Name *</label>
                      <input
                        type="text"
                        value={achCopFields.ach_cop_beneficiary_last_name}
                        onChange={e => setAchCopFields(prev => ({ ...prev, ach_cop_beneficiary_last_name: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Document ID *</label>
                      <input
                        type="text"
                        value={achCopFields.ach_cop_document_id}
                        onChange={e => setAchCopFields(prev => ({ ...prev, ach_cop_document_id: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Document Type *</label>
                      <select
                        value={achCopFields.ach_cop_document_type}
                        onChange={e => setAchCopFields(prev => ({ ...prev, ach_cop_document_type: e.target.value }))}
                        className="input-field"
                        required
                      >
                        <option value="">Select document type...</option>
                        <option value="CC">CC - Colombian Citizenship Card</option>
                        <option value="CE">CE - Foreigner ID</option>
                        <option value="NIT">NIT - Tax ID</option>
                        <option value="PP">PP - Passport</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="text"
                        value={achCopFields.ach_cop_email}
                        onChange={e => setAchCopFields(prev => ({ ...prev, ach_cop_email: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank Code *</label>
                      <input
                        type="text"
                        value={achCopFields.ach_cop_bank_code}
                        onChange={e => setAchCopFields(prev => ({ ...prev, ach_cop_bank_code: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account *</label>
                      <input
                        type="text"
                        value={achCopFields.ach_cop_bank_account}
                        onChange={e => setAchCopFields(prev => ({ ...prev, ach_cop_bank_account: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedBankType === 'transfers_bitso' && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Transfers 3.0 Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiary Name *</label>
                      <input
                        type="text"
                        value={transfersFields.beneficiary_name}
                        onChange={e => setTransfersFields(prev => ({ ...prev, beneficiary_name: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transfers Type *</label>
                      <select
                        value={transfersFields.transfers_type}
                        onChange={e => setTransfersFields(prev => ({ ...prev, transfers_type: e.target.value }))}
                        className="input-field"
                        required
                      >
                        <option value="">Select transfers type...</option>
                        <option value="ach">ACH</option>
                        <option value="wire">Wire</option>
                        <option value="pix">PIX</option>
                        <option value="spei">SPEI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transfers Account *</label>
                      <input
                        type="text"
                        value={transfersFields.transfers_account}
                        onChange={e => setTransfersFields(prev => ({ ...prev, transfers_account: e.target.value }))}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedBankType === 'international_swift' && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">International SWIFT Details</h4>
                  
                  {/* Account Information */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Account Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SWIFT/BIC Code *</label>
                        <input
                          type="text"
                          value={swiftFields.swift_code_bic}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_code_bic: e.target.value.toUpperCase() }))}
                          className="input-field"
                          placeholder="ABCDEF12 or ABCDEF12XXX"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">8 or 11 characters (letters and numbers)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name *</label>
                        <input
                          type="text"
                          value={swiftFields.swift_account_holder_name}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_account_holder_name: e.target.value }))}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Account Number/IBAN *</label>
                        <input
                          type="text"
                          value={swiftFields.swift_account_number_iban}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_account_number_iban: e.target.value }))}
                          className={`input-field ${(bankAccountFields.iban || bankAccountFields.account_number) ? 'bg-gray-50' : ''}`}
                          placeholder={bankAccountFields.iban || bankAccountFields.account_number ? "Auto-populated from Bank Account Details" : "Enter account number or IBAN"}
                          readOnly={!!(bankAccountFields.iban || bankAccountFields.account_number)}
                          required
                        />
                        {(bankAccountFields.iban || bankAccountFields.account_number) && (
                          <p className="text-xs text-blue-600 mt-1">
                            ✓ Auto-populated from Bank Account Details above
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Beneficiary Information */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Beneficiary Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                        <input
                          type="text"
                          value={swiftFields.swift_beneficiary_address_line_1}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_beneficiary_address_line_1: e.target.value }))}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                        <input
                          type="text"
                          value={swiftFields.swift_beneficiary_address_line_2}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_beneficiary_address_line_2: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                                                 <input
                           type="text"
                           value={swiftFields.swift_beneficiary_country}
                           onChange={e => setSwiftFields(prev => ({ ...prev, swift_beneficiary_country: e.target.value.toUpperCase() }))}
                           className="input-field"
                           placeholder="US, GB, DE, etc."
                           maxLength={2}
                           required
                         />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                        <input
                          type="text"
                          value={swiftFields.swift_beneficiary_city}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_beneficiary_city: e.target.value }))}
                          className="input-field"
                          required
                        />
                      </div>
                                             <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">State/Province/Region</label>
                         <input
                           type="text"
                           value={swiftFields.swift_beneficiary_state_province_region}
                           onChange={e => setSwiftFields(prev => ({ ...prev, swift_beneficiary_state_province_region: e.target.value.toUpperCase() }))}
                           className="input-field"
                           placeholder="NY, CA, TX, etc."
                           maxLength={2}
                         />
                         <p className="text-xs text-gray-500 mt-1">2 capital letters (e.g., NY for New York)</p>
                       </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                        <input
                          type="text"
                          value={swiftFields.swift_beneficiary_postal_code}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_beneficiary_postal_code: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Information */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Bank Information (Optional)</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                        <input
                          type="text"
                          value={swiftFields.swift_bank_name}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_bank_name: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Address Line 1</label>
                        <input
                          type="text"
                          value={swiftFields.swift_bank_address_line_1}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_bank_address_line_1: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Address Line 2</label>
                        <input
                          type="text"
                          value={swiftFields.swift_bank_address_line_2}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_bank_address_line_2: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Country</label>
                                                 <input
                           type="text"
                           value={swiftFields.swift_bank_country}
                           onChange={e => setSwiftFields(prev => ({ ...prev, swift_bank_country: e.target.value.toUpperCase() }))}
                           className="input-field"
                           placeholder="US, GB, DE, etc."
                           maxLength={2}
                         />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank City</label>
                        <input
                          type="text"
                          value={swiftFields.swift_bank_city}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_bank_city: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                                             <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Bank State/Province/Region</label>
                         <input
                           type="text"
                           value={swiftFields.swift_bank_state_province_region}
                           onChange={e => setSwiftFields(prev => ({ ...prev, swift_bank_state_province_region: e.target.value.toUpperCase() }))}
                           className="input-field"
                           placeholder="NY, CA, TX, etc."
                           maxLength={2}
                         />
                         <p className="text-xs text-gray-500 mt-1">2 capital letters (e.g., NY for New York)</p>
                       </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Postal Code</label>
                        <input
                          type="text"
                          value={swiftFields.swift_bank_postal_code}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_bank_postal_code: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Intermediary Bank Information (Optional) */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Intermediary Bank Information (Optional)</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Intermediary Bank SWIFT/BIC Code</label>
                        <input
                          type="text"
                          value={swiftFields.swift_intermediary_bank_swift_code_bic}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_intermediary_bank_swift_code_bic: e.target.value.toUpperCase() }))}
                          className="input-field"
                          placeholder="ABCDEF12 or ABCDEF12XXX"
                        />
                        <p className="text-xs text-gray-500 mt-1">8 or 11 characters (letters and numbers)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Intermediary Bank Account Number/IBAN</label>
                        <input
                          type="text"
                          value={swiftFields.swift_intermediary_bank_account_number_iban}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_intermediary_bank_account_number_iban: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Intermediary Bank Name</label>
                        <input
                          type="text"
                          value={swiftFields.swift_intermediary_bank_name}
                          onChange={e => setSwiftFields(prev => ({ ...prev, swift_intermediary_bank_name: e.target.value }))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Intermediary Bank Country</label>
                                                 <input
                           type="text"
                           value={swiftFields.swift_intermediary_bank_country}
                           onChange={e => setSwiftFields(prev => ({ ...prev, swift_intermediary_bank_country: e.target.value.toUpperCase() }))}
                           className="input-field"
                           placeholder="US, GB, DE, etc."
                           maxLength={2}
                         />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                  disabled={creatingAccount}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAccount}
                  disabled={creatingAccount || !newAccountData.clientId || !newAccountData.accountName || !newAccountData.accountNumber || !newAccountData.pinNumber || !selectedBankType}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingAccount ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Account PIN</h3>
                  <p className="text-sm text-gray-600">
                    {selectedAccount.account_name} ({selectedAccount.account_number})
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900">Secure PIN Access</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      This PIN is used for account access and transactions.
                    </p>
                    <div className="mt-3 flex items-center space-x-2">
                      <code className="bg-white px-3 py-2 rounded border text-2xl font-mono tracking-widest">
                        {selectedAccount.pin_number || '12345'}
                      </code>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(selectedAccount.pin_number || '12345');
                            showSuccessMessage('PIN copied to clipboard');
                          } catch (error) {
                            console.error('Failed to copy PIN:', error);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded"
                        title="Copy PIN"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Security Notice:</strong> This PIN should only be shared with the account holder. 
                  Keep this information confidential and secure.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPinModal(false)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    // Generate new PIN
                    const newPin = Math.floor(Math.random() * 90000) + 10000;
                    showSuccessMessage(`New PIN generated: ${newPin}`);
                    setShowPinModal(false);
                  }}
                  className="btn-primary flex-1"
                >
                  Generate New PIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkActionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Actions</h3>
              <p className="text-gray-600 mb-6">
                Choose an action to apply to {selectedAccounts.length} selected accounts.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleBulkAction('freeze')}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">Freeze Accounts</div>
                  <div className="text-sm text-gray-600">Temporarily suspend account access</div>
                </button>
                <button
                  onClick={() => handleBulkAction('unfreeze')}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">Unfreeze Accounts</div>
                  <div className="text-sm text-gray-600">Restore account access</div>
                </button>
                <button
                  onClick={() => handleBulkAction('sendStatements')}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">Send Statements</div>
                  <div className="text-sm text-gray-600">Email account statements to clients</div>
                </button>
                <button
                  onClick={() => handleBulkAction('generateCards')}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">Generate Cards</div>
                  <div className="text-sm text-gray-600">Issue new debit cards for accounts</div>
                </button>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkActionsModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Modal */}
      {selectedAccount && !showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAccount.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAccount.account_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {selectedAccount.account_type.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAccount.currency}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Balance</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      ${selectedAccount.balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Available Balance</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      ${selectedAccount.available_balance.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAccount.status)}`}>
                      {selectedAccount.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(selectedAccount.clients?.risk_level || 'low')}`}>
                      {selectedAccount.clients?.risk_level || 'low'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Opened Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedAccount.opened_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Activity</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedAccount.last_activity).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedAccount.interest_rate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interest Rate</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAccount.interest_rate}% APY</p>
                  </div>
                )}

                {selectedAccount.overdraft_limit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Overdraft Limit</label>
                    <p className="mt-1 text-sm text-gray-900">
                      ${selectedAccount.overdraft_limit.toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4 border-t">
                  <button className="btn-primary flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Account
                  </button>
                  {selectedAccount.status === 'active' ? (
                    <button
                      onClick={() => {
                        handleStatusChange(selectedAccount.id, 'frozen');
                        setSelectedAccount(null);
                      }}
                      className="btn-danger flex-1"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Freeze Account
                    </button>
                  ) : selectedAccount.status === 'frozen' ? (
                    <button
                      onClick={() => {
                        handleStatusChange(selectedAccount.id, 'active');
                        setSelectedAccount(null);
                      }}
                      className="btn-primary flex-1"
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Unfreeze Account
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}