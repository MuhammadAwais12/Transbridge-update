import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../../contexts/BrandingContext';
import { useAccounts, useTransactions, useTransfer, useBeneficiaries, approveTransaction, completeTransactionApproval, useClientManagement } from '../../hooks/useDatabase';
import { useTransactionStatus } from '../../hooks/useTransactionStatus';
import { useAuth } from '../../contexts/AuthContext';
import WalletConnectModal from '../auth/WalletConnectModal';
import MetaMaskInstallModal from '../auth/MetaMaskInstallModal';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from 'wagmi';
import { isMetaMaskInstalled } from '../../utils/metamaskDetection';
import FileInput from '../common/FileInput';
import { getTokenNetworkConfig } from '../../utils/tokenNetworkConfig';
import { 
  ArrowRight, 
  Loader, 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  User, 
  CreditCard, 
  Globe, 
  Plus, 
  Trash2, 
  Search,
  DollarSign
} from 'lucide-react';

interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  country: string;
  type: 'internal' | 'domestic' | 'international';
  email?: string;
  phone?: string;
  address?: string;
  isVerified: boolean;
  lastUsed?: string;
}

interface TransferLimit {
  daily: number;
  monthly: number;
  perTransaction: number;
  used: {
    daily: number;
    monthly: number;
  };
}

const mockBeneficiaries: Beneficiary[] = [
  {
    id: 'BEN-001',
    name: 'Sarah Johnson',
    accountNumber: '****4567',
    bankName: 'Same Bank',
    country: 'United States',
    type: 'internal',
    email: 'sarah.johnson@email.com',
    isVerified: true,
    lastUsed: '2024-01-10'
  },
  {
    id: 'BEN-002',
    name: 'Michael Chen',
    accountNumber: '****8901',
    bankName: 'First National Bank',
    bankCode: 'FNB001',
    country: 'United States',
    type: 'domestic',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 123-4567',
    isVerified: true,
    lastUsed: '2024-01-08'
  },
  {
    id: 'BEN-003',
    name: 'Emma Rodriguez',
    accountNumber: 'GB29NWBK60161331926819',
    bankName: 'Barclays Bank UK',
    bankCode: 'NWBKGB2L',
    country: 'United Kingdom',
    type: 'international',
    email: 'emma.rodriguez@email.com',
    address: '123 London Street, London, UK',
    isVerified: true,
    lastUsed: '2024-01-05'
  }
];

const transferLimits: TransferLimit = {
  daily: 10000,
  monthly: 50000,
  perTransaction: 5000,
  used: {
    daily: 1500,
    monthly: 8500
  }
};

export default function TransferMoney() {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { beneficiaries, loading: beneficiariesLoading, createBeneficiary, fetchBeneficiaries } = useBeneficiaries();
  const { createTransaction } = useTransactions();
  const { user } = useAuth();
  const [step, setStep] = useState<'select' | 'amount' | 'review' | 'confirm'>('select');
  const [transferType, setTransferType] = useState<'internal' | 'domestic' | 'international' | 'new'>('internal');
  const [fromAccount, setFromAccount] = useState<any>(null);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [memoError, setMemoError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewBeneficiary, setShowNewBeneficiary] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: '',
    account_number: '',
    bank_name: '',
    bank_code: '',
    routing_number: '',
    account_type: 'checking',
    account_class: 'individual',
    country: 'United States',
    state: 'NY', // Add state field with default value
    city: '',
    postal_code: '',
    type: 'domestic' as 'internal' | 'domestic' | 'international',
    email: '',
    phone: '',
    address: '',
    // Beneficiary type (individual or business)
    beneficiaryType: 'individual' as 'individual' | 'business',
    // BlindPay KYC fields for individual beneficiaries
    date_of_birth: '',
    id_document_country: 'United States',
    id_document_type: 'PASSPORT',
    id_document_front: '',
    id_document_back: '',
    // Business-specific fields
    legal_name: '',
    formation_date: '',
    website: '',
    owners: [] as any[]
  });
  const { previewTransfer, confirmTransfer, loading: transferLoading, error: transferError, preview, transaction } = useTransfer();
  const { status: transactionStatus, loading: statusLoading } = useTransactionStatus(transaction?.id || null);
  const { uploadClientDocument } = useClientManagement();
  
  // Add state to track if we're currently processing any step
  const [isProcessingStep, setIsProcessingStep] = useState(false);
  
  // Wallet connection state
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMetaMaskInstallModal, setShowMetaMaskInstallModal] = useState(false);
  
  // Token approval state
  const [showTokenApproval, setShowTokenApproval] = useState(false);
  const [approvalAmount, setApprovalAmount] = useState('');
  const [approvalContract, setApprovalContract] = useState('');
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [isApprovalInProgress, setIsApprovalInProgress] = useState(false);
  const [pendingApprovalData, setPendingApprovalData] = useState<any>(null);
  const [approvingTransaction, setApprovingTransaction] = useState<string | null>(null);
  
  // "Do not close" notice during confirm step
  const [showDoNotCloseModal, setShowDoNotCloseModal] = useState(false);
  
  // Wagmi hooks for token approval
  const { address: walletAddress, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync: approveTokens, isPending: isApproving } = useWriteContract();
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalSuccess, isError: isApprovalError } = useWaitForTransactionReceipt({
    hash: approvalTxHash as `0x${string}` | undefined,
  });

  // Show the "do not close" modal upon reaching confirm step
  useEffect(() => {
    if (step === 'confirm') {
      setShowDoNotCloseModal(true);
    } else {
      setShowDoNotCloseModal(false);
    }
  }, [step]);

  // Auto-hide the notice once the transaction is completed or failed
  useEffect(() => {
    if (step === 'confirm' && (transactionStatus?.status === 'completed' || transactionStatus?.status === 'failed')) {
      setShowDoNotCloseModal(false);
    }
  }, [step, transactionStatus?.status]);

  // Field limits
  const REFERENCE_MAX_LENGTH = 255;
  const MEMO_MAX_LENGTH = 1000;

  // Helper functions for business beneficiary owners
  const addOwner = () => {
    const newOwner = {
      id: Date.now(),
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      ownershipPercentage: ''
    };
    setNewBeneficiary(prev => ({
      ...prev,
      owners: [...prev.owners, newOwner]
    }));
  };

  const removeOwner = (ownerId: number) => {
    setNewBeneficiary(prev => ({
      ...prev,
      owners: prev.owners.filter(owner => owner.id !== ownerId)
    }));
  };

  const updateOwner = (ownerId: number, field: string, value: any) => {
    setNewBeneficiary(prev => ({
      ...prev,
      owners: prev.owners.map(owner => 
        owner.id === ownerId ? { ...owner, [field]: value } : owner
      )
    }));
  };

  // Load beneficiaries on component mount
  React.useEffect(() => {
    if (user?.clientId) {
      fetchBeneficiaries();
    }
  }, [user?.clientId]);

  // Reset approval progress state when step changes
  React.useEffect(() => {
    if (step !== 'review') {
      setIsApprovalInProgress(false);
    }
  }, [step]);

  // Filter accounts or beneficiaries based on transfer type and search term
  const filteredBeneficiaries = React.useMemo(() => {
    if (transferType === 'internal') {
      // For internal transfers, show other accounts from the same client
      return accounts.filter(account => 
        account.client_id === user?.clientId && 
        account.id !== fromAccount?.id &&
        (account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         account.account_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else {
      // For external transfers, show beneficiaries
      return beneficiaries.filter(beneficiary => 
        beneficiary.type === transferType &&
        (beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         beneficiary.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
         beneficiary.bank_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  }, [transferType, accounts, beneficiaries, user?.clientId, fromAccount?.id, searchTerm]);

  const getBeneficiaryIcon = (type: string) => {
    switch (type) {
      case 'internal': return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'domestic': return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'international': return <Globe className="w-5 h-5 text-purple-600" />;
      default: return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransferFee = () => {
    if (!selectedBeneficiary || !amount) return 0;
    const transferAmount = parseFloat(amount);
    
    switch (selectedBeneficiary.type) {
      case 'internal': return 0;
      case 'domestic': return transferAmount > 1000 ? 0 : 2.50;
      case 'international': return Math.max(15, transferAmount * 0.01);
      default: return 0;
    }
  };

  const getExchangeRate = () => {
    if (!selectedBeneficiary || !fromAccount) return 1;
    if (fromAccount.currency === 'USD' && selectedBeneficiary.country === 'United Kingdom') {
      return 0.79; // USD to GBP
    }
    return 1;
  };

  const handleTransferTypeChange = (type: 'internal' | 'domestic' | 'international' | 'new') => {
    setTransferType(type);
    setSelectedBeneficiary(null);
    setSearchTerm('');
    setShowNewBeneficiary(type === 'new');
    setError(''); // Clear any existing errors when transfer type changes
  };

  const handleFromAccountSelect = (account: any) => {
    setFromAccount(account);
    // Clear selected beneficiary if it's the same account (for internal transfers)
    if (transferType === 'internal' && selectedBeneficiary && selectedBeneficiary.id === account.id) {
      setSelectedBeneficiary(null);
      setError('Cannot transfer to the same account. Please select a different destination account.');
    } else {
      // Clear error if selection is valid
      setError('');
    }
  };

  const handleBeneficiarySelect = (beneficiary: any) => {
    setSelectedBeneficiary(beneficiary);
    // Clear from account if it's the same account (for internal transfers)
    if (transferType === 'internal' && fromAccount && fromAccount.id === beneficiary.id) {
      setFromAccount(null);
      setError('Cannot transfer from and to the same account. Please select a different source account.');
    } else {
      // Clear error if selection is valid
      setError('');
    }
  };

  // Normalize amount to 2 decimal places
  const roundToTwoDecimals = (val: string): string => {
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    return num.toFixed(2);
  };

  const validateStep = () => {
    setError('');
    console.log('validateStep called for step:', step);
    
    switch (step) {
      case 'select':
        console.log('Validating select step', { 
          fromAccount: !!fromAccount, 
          selectedBeneficiary: !!selectedBeneficiary, 
          showNewBeneficiary, 
          newBeneficiary 
        });
        if (!fromAccount) {
          setError('Please select a source account');
          return false;
        }
        if (!selectedBeneficiary && !showNewBeneficiary) {
          setError('Please select a beneficiary or add a new one');
          return false;
        }
        
        // Prevent selecting the same account for internal transfers
        if (transferType === 'internal' && fromAccount && selectedBeneficiary && fromAccount.id === selectedBeneficiary.id) {
          setError('Cannot transfer to the same account. Please select a different destination account.');
          return false;
        }
        if (showNewBeneficiary) {
          // Basic required fields for all beneficiary types
          if (!newBeneficiary.name || !newBeneficiary.account_number || !newBeneficiary.bank_name || !newBeneficiary.country || !newBeneficiary.type || !newBeneficiary.beneficiaryType) {
            setError('Please fill in all required beneficiary details');
            return false;
          }
          
          // Individual-specific required fields
          if (newBeneficiary.beneficiaryType === 'individual' && (!newBeneficiary.date_of_birth || !newBeneficiary.id_document_country || !newBeneficiary.id_document_type || !newBeneficiary.id_document_front)) {
            setError('Please fill in all required individual beneficiary details including ID document front');
            return false;
          }
          
          // Business-specific required fields
          if (newBeneficiary.beneficiaryType === 'business' && (!newBeneficiary.legal_name || !newBeneficiary.formation_date || !newBeneficiary.website || newBeneficiary.owners.length === 0)) {
            setError('Please fill in all required business beneficiary details including at least one owner');
            return false;
          }
          
          // Validate business owners
          if (newBeneficiary.beneficiaryType === 'business') {
            for (const owner of newBeneficiary.owners) {
              if (!owner.firstName || !owner.lastName || !owner.dateOfBirth || !owner.ownershipPercentage) {
                setError('Please fill in all required owner details');
                return false;
              }
            }
          }
        }
        console.log('Select step validation passed');
        return true;
      case 'amount':
        if (!amount || parseFloat(amount) < 10) {
          setError('Minimum amount is $10');
          return false;
        }
        if (parseFloat(amount) > transferLimits.perTransaction) {
          setError(`Amount exceeds per-transaction limit of $${transferLimits.perTransaction.toLocaleString()}`);
          return false;
        }
        if (!reference.trim()) {
          setReferenceError('Reference is required');
          setError('Please enter a reference');
          return false;
        }
        if (reference.length > REFERENCE_MAX_LENGTH) {
          setReferenceError(`Reference must be at most ${REFERENCE_MAX_LENGTH} characters`);
          setError(`Reference must be at most ${REFERENCE_MAX_LENGTH} characters`);
          return false;
        }
        if (memo && memo.length > MEMO_MAX_LENGTH) {
          setMemoError(`Memo must be at most ${MEMO_MAX_LENGTH} characters`);
          setError(`Memo must be at most ${MEMO_MAX_LENGTH} characters`);
          return false;
        }
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  // Check if user has wallet connected for transfers
  const checkWalletConnection = () => {
    if (!user?.wallet_address) {
      setShowWalletModal(true);
      return false;
    }
    return true;
  };

  const handleTokenApproval = async (contractAddress: string, amount: string) => {
    console.log('=== FRONTEND TOKEN APPROVAL WALLET ADDRESS ===');
    console.log('User wallet address:', user?.wallet_address);
    console.log('Connected wallet address:', walletAddress);
    console.log('Contract address for approval:', contractAddress);
    console.log('BlindPay contract address (spender):', preview?.payout_quote?.contract?.blindpayContractAddress);
    console.log('Amount to approve:', amount);
    console.log('Network for approval:', preview?.payout_quote?.contract?.network);
    console.log('Chain ID for approval:', preview?.payout_quote?.contract?.network?.chainId);
    console.log('================================');

    // Ensure wallet is on the correct network before approving
    const requiredChainId: number | undefined = preview?.payout_quote?.contract?.network?.chainId;
    if (!requiredChainId) {
      setError('Missing payout network. Please regenerate the quote.');
      return false;
    }

    if (currentChainId !== requiredChainId) {
      console.log(`Switching network from ${currentChainId} to ${requiredChainId} for approval`);
      try {
        if (switchChain) {
          await switchChain({ chainId: requiredChainId });
        } else if ((window as any).ethereum?.request) {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + requiredChainId.toString(16) }],
          });
        } else {
          setError('Unable to switch network. Please switch in MetaMask to the required network and try again.');
          return false;
        }
      } catch (switchErr) {
        console.error('Network switch rejected/failed:', switchErr);
        setError('Please switch your wallet to the required network and try again.');
        return false;
      }
    }
    
    console.log('handleTokenApproval called with:', { contractAddress, amount });
    console.log('approveTokens available:', !!approveTokens);
    console.log('preview?.payout_quote?.contract?.blindpayContractAddress:', preview?.payout_quote?.contract?.blindpayContractAddress);
    
    if (!approveTokens) {
      console.log('approveTokens is not available');
      setError('Token approval not available');
      return false;
    }

    try {
      console.log('About to call approveTokens with args:', {
        address: contractAddress,
        spender: preview?.payout_quote?.contract?.blindpayContractAddress,
        amount: amount
      });
      
      // ERC20 approve function
      const txHash = await approveTokens({
        address: contractAddress as `0x${string}`,
        chainId: requiredChainId,
        abi: [
          {
            name: 'approve',
            type: 'function',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bool' }]
          }
        ],
        functionName: 'approve',
        args: [
          preview?.payout_quote?.contract?.blindpayContractAddress as `0x${string}`, // BlindPay contract
          BigInt(amount) // Amount to approve
        ]
      });
      setApprovalTxHash(txHash as `0x${string}`);
      
      console.log('approveTokens call successful');
      console.log('Token approval transaction submitted');
      
      // Wait for the transaction to be confirmed (max 60 seconds)
      let waitTime = 0;
      const maxWaitTime = 60000; // 60 seconds
      
      while (isWaitingForApproval && waitTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        waitTime += 1000;
        console.log(`Waiting for approval confirmation... ${waitTime}ms`);
      }
      
      if (waitTime >= maxWaitTime) {
        console.error('Token approval transaction timed out');
        setError('Token approval transaction timed out');
        return false;
      }
      
      if (isApprovalError) {
        console.error('Token approval transaction failed');
        setError('Token approval transaction failed');
        return false;
      }
      
      console.log('Token approval transaction confirmed successfully');
      return true;
    } catch (error) {
      console.error('Token approval failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Token approval failed: ${errorMessage}`);
      return false;
    }
  };

  const handleNext = async () => {
    console.log('handleNext called', { step, isProcessingStep, processing });
    if (!validateStep() || isProcessingStep) {
      console.log('handleNext blocked', { validationFailed: !validateStep(), isProcessingStep });
      return;
    }
    
    // Check wallet connection early for all steps that require it
    if (step === 'select' || step === 'amount') {
      if (!checkWalletConnection()) {
        setIsProcessingStep(false);
        return;
      }
    }
    
    setIsProcessingStep(true);
    setError('');
    
    try {
      switch (step) {
        case 'select':
          console.log('Processing select step', { showNewBeneficiary, newBeneficiary });
          // If adding a new beneficiary, create it first
          if (showNewBeneficiary && newBeneficiary.name && newBeneficiary.account_number && newBeneficiary.bank_name && newBeneficiary.country && newBeneficiary.type && newBeneficiary.beneficiaryType) {
            try {
              const beneficiaryData = {
                client_id: user?.clientId,
                msb_id: user?.msbId,
                name: newBeneficiary.name,
                account_number: newBeneficiary.account_number,
                bank_name: newBeneficiary.bank_name,
                bank_code: newBeneficiary.bank_code,
                routing_number: newBeneficiary.routing_number,
                account_type: newBeneficiary.account_type,
                account_class: newBeneficiary.account_class,
                country: newBeneficiary.country,
                state: newBeneficiary.state, // Added state field
                city: newBeneficiary.city,
                postal_code: newBeneficiary.postal_code,
                type: newBeneficiary.type,
                email: newBeneficiary.email,
                phone: newBeneficiary.phone,
                address: newBeneficiary.address,
                // Beneficiary type
                beneficiary_type: newBeneficiary.beneficiaryType,
                // Individual-specific KYC fields
                date_of_birth: newBeneficiary.beneficiaryType === 'individual' ? newBeneficiary.date_of_birth : undefined,
                id_document_country: newBeneficiary.beneficiaryType === 'individual' ? newBeneficiary.id_document_country : undefined,
                id_document_type: newBeneficiary.beneficiaryType === 'individual' ? newBeneficiary.id_document_type : undefined,
                id_document_front: newBeneficiary.beneficiaryType === 'individual' ? newBeneficiary.id_document_front : undefined,
                id_document_back: newBeneficiary.beneficiaryType === 'individual' ? newBeneficiary.id_document_back : undefined,
                // Business-specific fields
                legal_name: newBeneficiary.beneficiaryType === 'business' ? newBeneficiary.legal_name : undefined,
                formation_date: newBeneficiary.beneficiaryType === 'business' ? newBeneficiary.formation_date : undefined,
                website: newBeneficiary.beneficiaryType === 'business' ? newBeneficiary.website : undefined,
                owners: newBeneficiary.beneficiaryType === 'business' ? newBeneficiary.owners : undefined,
              };
              
              console.log('Creating beneficiary with data:', beneficiaryData);
              const result = await createBeneficiary(beneficiaryData);
              if (result.success) {
                // Set the newly created beneficiary as selected
                setSelectedBeneficiary(result.data);
                // Refresh the beneficiaries list
                await fetchBeneficiaries();
              }
            } catch (err) {
              console.error('Beneficiary creation error:', err);
              setError('Failed to create beneficiary');
              setIsProcessingStep(false);
              return;
            }
          }
          setStep('amount');
          break;
        case 'amount':
          // Call previewTransfer to get fee/recipient preview
          try {
            const normalizedAmount = roundToTwoDecimals(String(amount));
            setAmount(normalizedAmount);
            // Get dynamic token and network configuration based on user's wallet and environment
            const { token, network } = getTokenNetworkConfig(user?.wallet_network);
            
            console.log('Calling previewTransfer with data:', {
              account_id: fromAccount?.id,
              client_id: user?.clientId,
              msb_id: user?.msbId,
              transfer_type: transferType,
              destination_account_id: transferType === 'internal' ? selectedBeneficiary?.id : undefined,
              beneficiary_id: transferType !== 'internal' ? selectedBeneficiary?.id : undefined,
              bank_account_id: selectedBeneficiary?.blindpay_bank_account_id || '',
              amount: parseFloat(normalizedAmount),
              cover_fees: false,
              payment_method: transferType === 'international' ? 'wire' : 'ach',
              token,
              network,
            });
            
            const previewData = await previewTransfer({
              account_id: fromAccount?.id,
              client_id: user?.clientId,
              msb_id: user?.msbId,
              transfer_type: transferType as 'internal' | 'domestic' | 'international',
              destination_account_id: transferType === 'internal' ? selectedBeneficiary?.id : undefined,
              beneficiary_id: transferType !== 'internal' ? selectedBeneficiary?.id : undefined,
              bank_account_id: selectedBeneficiary?.blindpay_bank_account_id || '',
              amount: parseFloat(normalizedAmount),
              cover_fees: false, // or user selection
              payment_method: transferType === 'international' ? 'wire' : 'ach',
              token, // Dynamic token based on wallet and environment
              network, // Dynamic network based on wallet and environment
            });
            
            console.log('Preview data received:', previewData);
            console.log('=== PREVIEW DATA DEBUG ===');
            console.log('Total fees:', previewData?.total_fees);
            console.log('Recipient amount:', previewData?.recipient_amount);
            console.log('Sender amount:', previewData?.sender_amount);
            console.log('Payin quote:', previewData?.payin_quote);
            console.log('Payout quote:', previewData?.payout_quote);
            console.log('Full preview data keys:', Object.keys(previewData || {}));
            console.log('================================');
            setStep('review');
          } catch (err) {
            console.error('Preview transfer error:', err);
            setError('Failed to get transfer preview');
            setIsProcessingStep(false);
            return;
          }
          break;
        case 'review':
          handleSubmitTransfer();
          return; // Don't reset isProcessingStep here as handleSubmitTransfer manages its own state
        default:
          break;
      }
    } catch (err) {
      console.error('Step processing error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsProcessingStep(false);
    }
  };

  const handleBack = () => {
    setError('');
    switch (step) {
      case 'amount':
        setStep('select');
        break;
      case 'review':
        setStep('amount');
        break;
      case 'confirm':
        setStep('review');
        break;
    }
  };

  const handleSubmitTransfer = async () => {
    if (processing) return; // Prevent multiple calls
    
    setProcessing(true);
    setError('');
    try {
      // Step 1: Check MetaMask connection status (same logic as sidebar)
      console.log('=== FRONTEND TRANSFER INITIATION WALLET ADDRESS ===');
      console.log('User wallet address:', user?.wallet_address);
      console.log('Connected wallet address:', walletAddress);
      console.log('Transfer amount:', amount);
      console.log('From account:', fromAccount?.id);
      console.log('================================');
      
      console.log('handleSubmitTransfer called');
      console.log('Preview data:', preview);
      console.log('Preview payout quote:', preview?.payout_quote);
      console.log('Preview payout quote contract:', preview?.payout_quote?.contract);
      console.log('Preview payout quote contract blindpayContractAddress:', preview?.payout_quote?.contract?.blindpayContractAddress);
      
      // Check MetaMask connection status using the same logic as sidebar
      const metaMaskInstalled = isMetaMaskInstalled();
      
      if (!metaMaskInstalled) {
        console.log('MetaMask not installed, showing installation modal');
        setShowMetaMaskInstallModal(true);
        setProcessing(false);
        return;
      }
      
      if (!isConnected) {
        console.log('MetaMask not connected, showing wallet modal');
          setShowWalletModal(true);
          setProcessing(false);
          return;
        }
      
      if (isConnected && !user?.wallet_address) {
        console.log('MetaMask connected but wallet not registered, showing wallet modal');
        setShowWalletModal(true);
        setProcessing(false);
        return;
      }
      
      if (preview?.payout_quote?.contract) {
        console.log('Token approval required for transfer');
        console.log('Preview payout quote contract:', preview.payout_quote.contract);
        console.log('Preview payout quote contract blindpayContractAddress:', preview.payout_quote.contract.blindpayContractAddress);
        console.log('Wallet address check:', { walletAddress, hasWallet: !!walletAddress });
        
        // Show token approval modal
        console.log('About to set approval states...');
        setApprovalContract(preview.payout_quote.contract.address);
        setApprovalAmount(preview.payout_quote.contract.amount);
        console.log('About to set showTokenApproval to true...');
        setShowTokenApproval(true);
        console.log('Setting showTokenApproval to true');
        console.log('Approval contract:', preview.payout_quote.contract.address);
        console.log('Approval amount:', preview.payout_quote.contract.amount);
        
        // Force a re-render by updating processing state
        setProcessing(false);
        console.log('Returning early from handleSubmitTransfer');
        return; // Stop here, let the modal handle the approval
      }
      
      // Step 2: Call confirmTransfer with preview data
      // Get dynamic token and network configuration based on user's wallet and environment
      const { token, network } = getTokenNetworkConfig(user?.wallet_network);
      
      await confirmTransfer({
        account_id: fromAccount?.id,
        client_id: user?.clientId,
        msb_id: user?.msbId,
        transfer_type: transferType as 'internal' | 'domestic' | 'international',
        destination_account_id: transferType === 'internal' ? selectedBeneficiary?.id : undefined,
        beneficiary_id: transferType !== 'internal' ? selectedBeneficiary?.id : undefined,
        bank_account_id: selectedBeneficiary?.blindpay_bank_account_id || '',
        amount: parseFloat(amount),
        cover_fees: false,
        payment_method: transferType === 'international' ? 'wire' : 'ach',
        token, // Dynamic token based on wallet and environment
        network, // Dynamic network based on wallet and environment
        payin_quote_id: preview?.payin_quote?.id,
        payout_quote_id: preview?.payout_quote?.id,
        payout_quote_data: preview?.payout_quote, // Add the complete payout quote data for token approval
      });
      setStep('confirm');
    } catch (err) {
      setError('Failed to initiate transfer');
    } finally {
      setProcessing(false);
      setIsProcessingStep(false); // Reset the step processing state as well
      setIsApprovalInProgress(false); // Reset approval progress state as well
    }
  };

  const calculateRiskScore = (amount: number, type: string) => {
    let score = 0;
    
    // Amount-based risk
    if (amount > 10000) score += 30;
    else if (amount > 5000) score += 15;
    else if (amount > 1000) score += 5;
    
    // Type-based risk
    if (type === 'international') score += 20;
    else if (type === 'domestic') score += 5;
    
    // Random factor for demo
    score += Math.floor(Math.random() * 10);
    
    return Math.min(score, 100);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {['Select', 'Amount', 'Review', 'Confirm'].map((stepName, index) => {
          const stepNumber = index + 1;
          const currentStepNumber = ['select', 'amount', 'review', 'confirm'].indexOf(step) + 1;
          const isActive = stepNumber === currentStepNumber;
          const isCompleted = stepNumber < currentStepNumber;
          
          return (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isCompleted ? 'bg-green-600 text-white' :
                isActive ? 'text-white' : 'bg-gray-200 text-gray-600'
              }`} style={isActive ? { backgroundColor: branding.primaryColor } : {}}>
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                isActive ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {stepName}
              </span>
              {index < 3 && (
                <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSelectStep = () => (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* From Account Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">From Account</h3>
        {accountsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                onClick={() => handleFromAccountSelect(account)}
                className={`card cursor-pointer transition-all duration-200 ${
                  fromAccount?.id === account.id 
                    ? 'ring-2 ring-offset-2 ring-primary-500' 
                    : 'hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{account.account_name}</h4>
                    <p className="text-sm text-gray-600">{account.account_number}</p>
                  </div>
                </div>
                {/* <p className="text-lg font-bold" style={{ color: branding.secondaryColor }}>
                  {account.currency === 'EUR' ? '€' : '$'}{account.available_balance.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Available Balance</p> */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfer Type Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { type: 'internal', label: 'Internal Transfer', desc: 'To another account in same bank', icon: Building2 },
            { type: 'domestic', label: 'Domestic Transfer', desc: 'To other banks in same country', icon: CreditCard },
            { type: 'international', label: 'International', desc: 'To banks in other countries', icon: Globe },
            { type: 'new', label: 'New Beneficiary', desc: 'Add a new recipient', icon: Plus }
          ].map(({ type, label, desc, icon: Icon }) => (
            <button
              key={type}
              onClick={() => handleTransferTypeChange(type as any)}
              className={`card text-left transition-all duration-200 ${
                transferType === type 
                  ? 'ring-2 ring-offset-2 ring-primary-500' 
                  : 'hover:border-gray-300'
              }`}
            >
              <Icon className="w-8 h-8 mb-3" style={{ color: branding.primaryColor }} />
              <h4 className="font-semibold text-gray-900">{label}</h4>
              <p className="text-sm text-gray-600 mt-1">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Beneficiary Selection */}
      {transferType !== 'new' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Beneficiary</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search beneficiaries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="space-y-3">
            {filteredBeneficiaries.map((item) => (
              <div
                key={item.id}
                onClick={() => handleBeneficiarySelect(item)}
                className={`card cursor-pointer transition-all duration-200 ${
                  selectedBeneficiary?.id === item.id 
                    ? 'ring-2 ring-offset-2 ring-primary-500' 
                    : 'hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getBeneficiaryIcon(transferType)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">
                          {transferType === 'internal' ? item.account_name : item.name}
                        </h4>
                        {transferType !== 'internal' && item.is_verified && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{item.account_number}</p>
                      <p className="text-sm text-gray-600">
                        {transferType === 'internal' 
                          ? `${item.account_type} • ${item.currency}`
                          : `${item.bank_name} • ${item.country}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {transferType === 'internal' ? (
                      <>
                        {/* <p className="text-xs text-gray-500">Balance</p> */}
                        {/* <p className="text-xs text-gray-500">${item.available_balance.toLocaleString()}</p> */}
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-xs text-gray-500">{item.type}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Beneficiary Form */}
      {showNewBeneficiary && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Beneficiary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                value={newBeneficiary.name}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Number *</label>
              <input
                type="text"
                value={newBeneficiary.account_number}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, account_number: e.target.value }))}
                className="input-field"
                placeholder="1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
              <input
                type="text"
                value={newBeneficiary.bank_name}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, bank_name: e.target.value }))}
                className="input-field"
                placeholder="First National Bank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Code</label>
              <input
                type="text"
                value={newBeneficiary.bank_code}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, bank_code: e.target.value }))}
                className="input-field"
                placeholder="SWIFT/Routing Code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number</label>
              <input
                type="text"
                value={newBeneficiary.routing_number}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, routing_number: e.target.value }))}
                className="input-field"
                placeholder="ABA/Routing Number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type *</label>
              <select
                value={newBeneficiary.account_type}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, account_type: e.target.value }))}
                className="input-field"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Class *</label>
              <select
                value={newBeneficiary.account_class}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, account_class: e.target.value }))}
                className="input-field"
              >
                <option value="individual">Individual</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
              <select
                value={newBeneficiary.country}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, country: e.target.value }))}
                className="input-field"
              >
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Australia">Australia</option>
                <option value="Japan">Japan</option>
                <option value="China">China</option>
                <option value="India">India</option>
                <option value="Brazil">Brazil</option>
                <option value="Mexico">Mexico</option>
                <option value="Italy">Italy</option>
                <option value="Spain">Spain</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Sweden">Sweden</option>
                <option value="Norway">Norway</option>
                <option value="Denmark">Denmark</option>
                <option value="Finland">Finland</option>
                <option value="Belgium">Belgium</option>
                <option value="Austria">Austria</option>
                <option value="Poland">Poland</option>
                <option value="Ireland">Ireland</option>
                <option value="Portugal">Portugal</option>
                <option value="Greece">Greece</option>
                <option value="Argentina">Argentina</option>
                <option value="Chile">Chile</option>
                <option value="Colombia">Colombia</option>
                <option value="Peru">Peru</option>
                <option value="Uruguay">Uruguay</option>
                <option value="Venezuela">Venezuela</option>
                <option value="Singapore">Singapore</option>
                <option value="South Korea">South Korea</option>
                <option value="Thailand">Thailand</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Philippines">Philippines</option>
                <option value="Indonesia">Indonesia</option>
                <option value="South Africa">South Africa</option>
                <option value="Egypt">Egypt</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Kenya">Kenya</option>
                <option value="Ghana">Ghana</option>
                <option value="Morocco">Morocco</option>
                <option value="Tunisia">Tunisia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State/Province *</label>
              <select
                value={newBeneficiary.state}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, state: e.target.value }))}
                className="input-field"
              >
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
                <option value="DC">District of Columbia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                type="text"
                value={newBeneficiary.city}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, city: e.target.value }))}
                className="input-field"
                placeholder="New York"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
              <input
                type="text"
                value={newBeneficiary.postal_code}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, postal_code: e.target.value }))}
                className="input-field"
                placeholder="10001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={newBeneficiary.email}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
                placeholder="john.smith@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Type *</label>
              <select
                value={newBeneficiary.type}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, type: e.target.value as 'internal' | 'domestic' | 'international' }))}
                className="input-field"
              >
                <option value="domestic">Domestic</option>
                <option value="international">International</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiary Type *</label>
              <select
                value={newBeneficiary.beneficiaryType}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, beneficiaryType: e.target.value as 'individual' | 'business' }))}
                className="input-field"
              >
                <option value="individual">Individual</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={newBeneficiary.phone}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={newBeneficiary.address}
                onChange={(e) => setNewBeneficiary(prev => ({ ...prev, address: e.target.value }))}
                className="input-field"
                placeholder="123 Main Street, City, State, ZIP"
              />
            </div>
            {/* Individual-specific fields */}
            {newBeneficiary.beneficiaryType === 'individual' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    value={newBeneficiary.date_of_birth}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Country *</label>
                  <select
                    value={newBeneficiary.id_document_country}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, id_document_country: e.target.value }))}
                    className="input-field"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Australia">Australia</option>
                    <option value="Japan">Japan</option>
                    <option value="China">China</option>
                    <option value="India">India</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Mexico">Mexico</option>
                    <option value="Italy">Italy</option>
                    <option value="Spain">Spain</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Norway">Norway</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Finland">Finland</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Austria">Austria</option>
                    <option value="Poland">Poland</option>
                    <option value="Ireland">Ireland</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Greece">Greece</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Peru">Peru</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Singapore">Singapore</option>
                    <option value="South Korea">South Korea</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Egypt">Egypt</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Morocco">Morocco</option>
                    <option value="Tunisia">Tunisia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Type *</label>
                  <select
                    value={newBeneficiary.id_document_type}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, id_document_type: e.target.value }))}
                    className="input-field"
                  >
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                    <option value="NATIONAL_ID">National ID</option>
                    <option value="MILITARY_ID">Military ID</option>
                    <option value="RESIDENCE_PERMIT">Residence Permit</option>
                  </select>
                </div>
                <div>
                  <FileInput
                    label="ID Document Front"
                    value={newBeneficiary.id_document_front}
                    onChange={(fileUrl, fileName) => setNewBeneficiary(prev => ({ ...prev, id_document_front: fileUrl }))}
                    required
                    uploadFile={uploadClientDocument}
                  />
                </div>
                <div>
                  <FileInput
                    label="ID Document Back (Optional)"
                    value={newBeneficiary.id_document_back}
                    onChange={(fileUrl, fileName) => setNewBeneficiary(prev => ({ ...prev, id_document_back: fileUrl }))}
                    uploadFile={uploadClientDocument}
                  />
                </div>
              </>
            )}

            {/* Business-specific fields */}
            {newBeneficiary.beneficiaryType === 'business' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Legal Name *</label>
                  <input
                    type="text"
                    value={newBeneficiary.legal_name}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, legal_name: e.target.value }))}
                    className="input-field"
                    placeholder="Legal business name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Formation Date *</label>
                  <input
                    type="date"
                    value={newBeneficiary.formation_date}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, formation_date: e.target.value }))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website *</label>
                  <input
                    type="url"
                    value={newBeneficiary.website}
                    onChange={(e) => setNewBeneficiary(prev => ({ ...prev, website: e.target.value }))}
                    className="input-field"
                    placeholder="https://www.example.com"
                    required
                  />
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
                  
                  {newBeneficiary.owners.map((owner, index) => (
                    <div key={owner.id} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-sm font-medium text-gray-900">Owner {index + 1}</h5>
                        {newBeneficiary.owners.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOwner(owner.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
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
                            className="input-field"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                          <input
                            type="text"
                            value={owner.lastName}
                            onChange={(e) => updateOwner(owner.id, 'lastName', e.target.value)}
                            className="input-field"
                            required
                          />
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
                            onChange={(e) => updateOwner(owner.id, 'ownershipPercentage', e.target.value)}
                            className="input-field"
                            placeholder="25"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderAmountStep = () => (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={(e) => setAmount(roundToTwoDecimals(e.target.value))}
                className="pl-10 input-field text-lg"
                placeholder="0.00"
                min="10"
                step="0.01"
              />
            </div>
            {/* <p className="text-sm text-gray-600 mt-1">
              Available: {fromAccount?.currency === 'EUR' ? '€' : '$'}{fromAccount?.available_balance.toLocaleString()}
            </p> */}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference *</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => {
                const next = e.target.value.slice(0, REFERENCE_MAX_LENGTH);
                setReference(next);
                if (!next.trim()) {
                  setReferenceError('Reference is required');
                } else {
                  setReferenceError(null);
                }
              }}
              aria-invalid={!!referenceError}
              className={`input-field ${referenceError ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Payment reference"
              maxLength={REFERENCE_MAX_LENGTH}
            />
            <div className="flex items-center justify-between mt-1">
              <p className={`text-xs ${referenceError ? 'text-red-600' : 'text-gray-500'}`}>{referenceError ? referenceError : ''}</p>
              <p className="text-xs text-gray-500">{reference.length}/{REFERENCE_MAX_LENGTH}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Memo (Optional)</label>
          <textarea
            value={memo}
            onChange={(e) => {
              const next = e.target.value.slice(0, MEMO_MAX_LENGTH);
              setMemo(next);
              if (next.length > MEMO_MAX_LENGTH) {
                setMemoError(`Memo must be at most ${MEMO_MAX_LENGTH} characters`);
              } else {
                setMemoError(null);
              }
            }}
            aria-invalid={!!memoError}
            className={`input-field ${memoError ? 'border-red-500 focus:ring-red-500' : ''}`}
            rows={3}
            placeholder="Additional notes for this transfer"
            maxLength={MEMO_MAX_LENGTH}
          />
          <div className="flex items-center justify-between mt-1">
            <p className={`text-xs ${memoError ? 'text-red-600' : 'text-gray-500'}`}>{memoError ? memoError : ''}</p>
            <p className="text-xs text-gray-500">{memo.length}/{MEMO_MAX_LENGTH}</p>
          </div>
        </div>
      </div>

      {/* Transfer Limits */}
      {/* <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Limits</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Daily Limit</span>
              <span>${transferLimits.used.daily.toLocaleString()} / ${transferLimits.daily.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full" 
                style={{ 
                  width: `${(transferLimits.used.daily / transferLimits.daily) * 100}%`,
                  backgroundColor: branding.primaryColor 
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Monthly Limit</span>
              <span>${transferLimits.used.monthly.toLocaleString()} / ${transferLimits.monthly.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full" 
                style={{ 
                  width: `${(transferLimits.used.monthly / transferLimits.monthly) * 100}%`,
                  backgroundColor: branding.secondaryColor 
                }}
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Per transaction limit: ${transferLimits.perTransaction.toLocaleString()}
          </div>
        </div>
      </div> */}

      
    </div>
  );

  const renderReviewStep = () => {
    console.log('Rendering review step with preview data:', preview);
    return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Review Transfer</h3>
        
        <div className="space-y-6">
          {/* Transfer Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">From</h4>
                <p className="text-sm text-gray-600">{fromAccount?.account_name}</p>
                <p className="text-sm text-gray-600">{fromAccount?.account_number}</p>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="text-right">
                <h4 className="font-semibold text-gray-900">To</h4>
                <p className="text-sm text-gray-600">{selectedBeneficiary?.account_name || newBeneficiary.name}</p>
                <p className="text-sm text-gray-600">{selectedBeneficiary?.account_number || newBeneficiary.account_number}</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: branding.primaryColor }}>
                ${parseFloat(roundToTwoDecimals(String(amount))).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">{reference}</p>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Transfer Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span>${parseFloat(roundToTwoDecimals(String(amount))).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Fee</span>
                  <span>${preview?.total_fees !== null && preview?.total_fees !== undefined ? preview.total_fees.toFixed(2) : 'Calculating...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient Gets</span>
                  <span>${preview?.recipient_amount !== null && preview?.recipient_amount !== undefined ? preview.recipient_amount.toLocaleString() : 'Calculating...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference</span>
                  <span>{reference}</span>
                </div>
                {memo && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memo</span>
                    <span className="text-right max-w-32 truncate">{memo}</span>
                  </div>
                )}
              </div>
              
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Beneficiary Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Name</span>
                  <span>{selectedBeneficiary?.account_name || newBeneficiary.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Type</span>
                  <span>{selectedBeneficiary?.account_type || newBeneficiary.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency</span>
                  <span>{selectedBeneficiary?.currency || newBeneficiary.country}</span>
                </div>
                {transferType === 'international' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Time</span>
                    <span>1-3 business days</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-blue-900">Security Notice</h4>
                <p className="text-sm text-blue-800 mt-1">
                  This transfer will be processed securely. You will receive a confirmation email once completed.
                  {(selectedBeneficiary?.type || transferType) === 'international' && 
                    ' International transfers may take 1-3 business days to complete.'
                  }
                  {parseFloat(amount) > 10000 && 
                    ' This transfer requires approval due to the amount.'
                  }
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
  };

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="card text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Transfer Initiated Successfully</h3>
        <p className="text-gray-600 mb-6">
          Your transfer of ${parseFloat(amount).toLocaleString()} has been initiated and is being processed.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-mono">{transaction?.transaction_number || '...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={
                transactionStatus?.status === 'completed' ? 'text-green-600 font-medium' :
                transactionStatus?.status === 'failed' ? 'text-red-600 font-medium' :
                transactionStatus?.status === 'payout_pending' ? 'text-yellow-600 font-medium' :
                transactionStatus?.status === 'payin_initiated' ? 'text-blue-600 font-medium' :
                transactionStatus?.status === 'payin_processing' ? 'text-blue-600 font-medium' :
                transactionStatus?.status === 'payout_initiated' ? 'text-blue-600 font-medium' :
                transactionStatus?.status === 'payout_processing' ? 'text-blue-600 font-medium' :
                'text-yellow-600 font-medium'
              }>
                {statusLoading ? (
                  <span className="flex items-center">
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  transactionStatus?.status ? transactionStatus.status.replace('_', ' ').toUpperCase() : 'Pending'
                )}
              </span>
            </div>
            {/* <div className="flex justify-between">
              <span className="text-gray-600">Estimated Completion</span>
              <span>
                {transaction?.status === 'completed' ? 'Completed' :
                 transaction?.status === 'failed' ? 'Failed' :
                 transaction?.status === 'payout_pending' ? 'Payout in progress' :
                 'Processing...'}
              </span>
            </div> */}
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              setStep('select');
              setFromAccount(null);
              setSelectedBeneficiary(null);
              setAmount('');
              setReference('');
              setMemo('');
              setError('');
            }}
            className="btn-secondary flex-1"
          >
            Make Another Transfer
          </button>
          <button 
            onClick={() => navigate('/client/transactions')}
            className="btn-primary flex-1"
          >
            View Transaction
          </button>
        </div>
        
        {/* Approve Button - Show when transaction is awaiting approval or failed */}
        {((transactionStatus?.status === 'payin_completed' && transactionStatus?.metadata?.awaiting_approval) || transactionStatus?.status === 'payout_failed') && (
          <div className="mt-4 pt-4 border-t border-gray-200 max-w-md mx-auto text-center">
                          <div className={`border rounded-lg p-4 mb-4 ${
                transactionStatus?.status === 'payout_failed' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <AlertCircle className={`w-5 h-5 mt-1 ${
                    transactionStatus?.status === 'payout_failed' 
                      ? 'text-red-600' 
                      : 'text-yellow-600'
                  }`} />
                  <div>
                    <h4 className={`font-medium ${
                      transactionStatus?.status === 'payout_failed' 
                        ? 'text-red-900' 
                        : 'text-yellow-900'
                    }`}>
                      {transactionStatus?.status === 'payout_failed' ? 'Retry Required' : 'Approval Required'}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      transactionStatus?.status === 'payout_failed' 
                        ? 'text-red-800' 
                        : 'text-yellow-800'
                    }`}>
                      {transactionStatus?.status === 'payout_failed' 
                        ? 'The payout failed. Please retry the transaction to complete the transfer.'
                        : 'Your transfer has been initiated successfully. Please approve the transaction to complete the payout.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            <button 
              onClick={async () => {
                if (!user?.wallet_address) {
                  alert('Please connect your wallet first');
                  return;
                }
                
                setApprovingTransaction(transaction?.id || '');
                try {
                  const result = await approveTransaction({
                    transaction_id: transaction?.id || '',
                    wallet_address: user.wallet_address,
                    reason: 'Client approved the transfer from success page'
                  });
                  
                  if (result.requiresTokenApproval) {
                    // Set state to show MetaMask approval modal
                    setApprovalContract(result.approvalData.contractAddress);
                    setApprovalAmount(result.approvalData.amount);
                    setShowTokenApproval(true);
                    setPendingApprovalData(result.approvalData); // Store data for post-approval call
                  } else {
                    // No token approval needed, show success message and reload
                    alert('Transaction approved successfully! The payout will now be processed.');
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Error approving transaction:', error);
                  alert(`Failed to approve transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  setApprovingTransaction(null); // Only reset on error
                }
              }}
              disabled={approvingTransaction === transaction?.id}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approvingTransaction === transaction?.id ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {transactionStatus?.status === 'payout_failed' ? 'Retrying...' : 'Approving...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {transactionStatus?.status === 'payout_failed' ? 'Retry Transaction' : 'Approve Transaction'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  console.log('TransferMoney component rendering, showTokenApproval:', showTokenApproval);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer Money</h1>
          <p className="text-gray-600 mt-1">Send money to accounts and beneficiaries</p>
        </div>
      </div>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      {step === 'select' && renderSelectStep()}
      {step === 'amount' && renderAmountStep()}
      {step === 'review' && renderReviewStep()}
      {step === 'confirm' && renderConfirmStep()}

      {/* Navigation Buttons */}
      {step !== 'confirm' && (
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={step === 'select' || processing || isProcessingStep}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={() => {
              console.log('Next button clicked');
              handleNext();
            }}
            disabled={processing || isProcessingStep || isApprovalInProgress}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing || isProcessingStep || isApprovalInProgress ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                {step === 'review' ? 'Processing Transfer...' : 'Processing...'}
              </>
            ) : (
              step === 'review' ? 'Confirm Transfer' : 'Next'
            )}
          </button>
        </div>
      )}
      
      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={() => {
          setShowWalletModal(false);
          // Retry the current action after wallet connection
          setTimeout(() => {
            if (step === 'review') {
              // If on review step, retry the transfer submission
              handleSubmitTransfer();
            } else {
              // For other steps, retry the next step
              handleNext();
            }
          }, 500);
        }}
      />
      
      {/* MetaMask Installation Modal */}
      <MetaMaskInstallModal
        isOpen={showMetaMaskInstallModal}
        onClose={() => {
          setShowMetaMaskInstallModal(false);
          // After closing the install modal, check if MetaMask is now available
          // and show the wallet connection modal if it is
          setTimeout(() => {
            if (isMetaMaskInstalled()) {
              setShowWalletModal(true);
            }
          }, 1000);
        }}
      />
      
      {/* Token Approval Modal */}
      {showTokenApproval && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" 
          onClick={() => {
            setShowTokenApproval(false);
            setIsApprovalInProgress(false);
            setApprovingTransaction(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-red-600">Approve Token Transfer</h3>
            <p className="text-gray-600 mb-4">
              To complete this transfer, you need to approve the token contract to spend your tokens.
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Token:</span>
                <span className="font-mono text-sm">{approvalContract}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span>{approvalAmount}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowTokenApproval(false);
                  setIsApprovalInProgress(false);
                  setApprovingTransaction(null);
                }}
                className="btn-secondary flex-1"
                disabled={isApproving || isApprovalInProgress}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (approvalContract && approvalAmount) {
                    setIsApprovalInProgress(true);
                    try {
                    const success = await handleTokenApproval(approvalContract, approvalAmount);
                    if (success) {
                      setShowTokenApproval(false);
                        
                        // Check if this is a post-payin approval (pendingApprovalData exists)
                        if (pendingApprovalData) {
                          // This is a post-payin approval, call completeTransactionApproval
                          setTimeout(async () => {
                            try {
                              await completeTransactionApproval({
                                transaction_id: pendingApprovalData.transaction_id,
                                wallet_address: pendingApprovalData.wallet_address,
                                reason: pendingApprovalData.reason
                              });
                              alert('Transaction approved successfully! The payout will now be processed.');
                              window.location.reload();
                            } catch (error) {
                              console.error('Transaction approval failed after token approval:', error);
                              alert(`Failed to approve transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                                         } finally {
                               setIsApprovalInProgress(false);
                               setPendingApprovalData(null);
                               setApprovingTransaction(null);
                             }
                          }, 1000); // Give time for approval to be processed
                        } else {
                          // This is initial transfer confirmation
                      setTimeout(async () => {
                        try {
                          // Get dynamic token and network configuration based on user's wallet and environment
                          const { token, network } = getTokenNetworkConfig(user?.wallet_network);
                          
                          await confirmTransfer({
                            account_id: fromAccount?.id,
                            client_id: user?.clientId,
                            msb_id: user?.msbId,
                            transfer_type: transferType as 'internal' | 'domestic' | 'international',
                            destination_account_id: transferType === 'internal' ? selectedBeneficiary?.id : undefined,
                            beneficiary_id: transferType !== 'internal' ? selectedBeneficiary?.id : undefined,
                            bank_account_id: selectedBeneficiary?.blindpay_bank_account_id || '',
                            amount: parseFloat(amount),
                            cover_fees: false,
                            payment_method: transferType === 'international' ? 'wire' : 'ach',
                            token, // Dynamic token based on wallet and environment
                            network, // Dynamic network based on wallet and environment
                            payin_quote_id: preview?.payin_quote?.id,
                            payout_quote_id: preview?.payout_quote?.id,
                            payout_quote_data: preview?.payout_quote,
                          });
                          setStep('confirm');
                        } catch (error) {
                          console.error('Transfer confirmation failed after approval:', error);
                          setError('Transfer failed after approval. Please try again.');
                                                         } finally {
                               setIsApprovalInProgress(false);
                               setApprovingTransaction(null);
                        }
                      }, 1000); // Give time for approval to be processed
                        }
                                             } else {
                         setIsApprovalInProgress(false);
                         setApprovingTransaction(null);
                       }
                                         } catch (error) {
                       console.error('Approval failed:', error);
                       setIsApprovalInProgress(false);
                       setApprovingTransaction(null);
                    }
                  }
                }}
                className="btn-primary flex-1"
                disabled={isApproving || isApprovalInProgress}
              >
                {isApproving || isApprovalInProgress ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Do Not Close Modal (Confirm Step) */}
      {step === 'confirm' && showDoNotCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9998]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl" role="dialog" aria-modal="true">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 mt-1 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold mb-1">Please keep this page open</h3>
                <p className="text-gray-600">Please do not close this page until the transaction is approved.</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowDoNotCloseModal(false)}
                className="btn-primary w-full"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}