import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../lib/apiBase';
import { getAuthHeaders } from '../lib/auth';
import type { User } from '../types';

// Mock data for demo mode
const MOCK_CLIENTS = [
  {
    id: 'aaaabbbb-1111-2222-3333-444444444444',
    user_id: '44444444-4444-4444-4444-444444444444',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    first_name: 'Sarah',
    last_name: 'Johnson',
    date_of_birth: '1985-03-15',
    nationality: 'United States',
    phone_number: '+1-555-123-4567',
    id_type: 'driver_license',
    id_number: 'DL123456789',
    occupation: 'Software Engineer',
    source_of_funds: 'employment',
    annual_income_range: '50k-100k',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States'
    },
    kyc_status: 'approved',
    risk_level: 'low',
    kyc_completed_at: '2024-01-02T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    users: {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'sarah.johnson@email.com',
      name: 'Sarah Johnson',
      is_active: true,
      last_login: '2024-01-15T10:30:00Z'
    }
  },
  {
    id: 'bbbbcccc-2222-3333-4444-555555555555',
    user_id: '55555555-5555-5555-5555-555555555555',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    first_name: 'Michael',
    last_name: 'Chen',
    date_of_birth: '1978-11-22',
    nationality: 'Canada',
    phone_number: '+1-555-987-6543',
    id_type: 'passport',
    id_number: 'P987654321',
    occupation: 'Business Owner',
    source_of_funds: 'business',
    annual_income_range: '100k-250k',
    address: {
      street: '456 Business Ave',
      city: 'Toronto',
      state: 'ON',
      postalCode: 'M5V 3A8',
      country: 'Canada'
    },
    kyc_status: 'approved',
    risk_level: 'medium',
    kyc_completed_at: '2023-12-16T00:00:00Z',
    created_at: '2023-12-15T00:00:00Z',
    updated_at: '2023-12-16T00:00:00Z',
    users: {
      id: '55555555-5555-5555-5555-555555555555',
      email: 'michael.chen@business.com',
      name: 'Michael Chen',
      is_active: true,
      last_login: '2024-01-14T16:45:00Z'
    }
  },
  {
    id: 'ccccdddd-3333-4444-5555-666666666666',
    user_id: '66666666-6666-6666-6666-666666666666',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    first_name: 'Emma',
    last_name: 'Rodriguez',
    date_of_birth: '1992-07-08',
    nationality: 'Mexico',
    phone_number: '+1-555-456-7890',
    id_type: 'passport',
    id_number: 'P456789123',
    occupation: 'Marketing Manager',
    source_of_funds: 'employment',
    annual_income_range: '25k-50k',
    address: {
      street: '789 Oak St',
      city: 'Mexico City',
      state: 'CDMX',
      postalCode: '01000',
      country: 'Mexico'
    },
    kyc_status: 'requires_documents',
    risk_level: 'low',
    kyc_completed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z',
    users: {
      id: '66666666-6666-6666-6666-666666666666',
      email: 'emma.rodriguez@gmail.com',
      name: 'Emma Rodriguez',
      is_active: true,
      last_login: null
    }
  },
  {
    id: 'ffffeeee-6666-7777-8888-999999999999',
    user_id: '99999999-9999-9999-9999-999999999999',
    msb_id: 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33',
    first_name: 'Robert',
    last_name: 'Davis',
    date_of_birth: '1980-05-20',
    nationality: 'United States',
    phone_number: '+1-555-234-5678',
    id_type: 'driver_license',
    id_number: 'DL234567890',
    occupation: 'Financial Analyst',
    source_of_funds: 'employment',
    annual_income_range: '75k-100k',
    address: {
      street: '567 Finance Blvd',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'United States'
    },
    kyc_status: 'approved',
    risk_level: 'low',
    kyc_completed_at: '2024-01-05T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
    users: {
      id: '99999999-9999-9999-9999-999999999999',
      email: 'robert.davis@finance.com',
      name: 'Robert Davis',
      is_active: true,
      last_login: '2024-01-15T11:45:00Z'
    }
  }
];

const MOCK_ACCOUNTS = [
  // Sarah Johnson's accounts
  {
    id: '1111aaaa-1111-1111-1111-111111111111',
    client_id: 'aaaabbbb-1111-2222-3333-444444444444',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    account_number: '1001234567',
    account_name: 'Primary Checking',
    account_type: 'current',
    currency: 'USD',
    balance: 25750.00,
    available_balance: 25750.00,
    status: 'active',
    interest_rate: null,
    overdraft_limit: 5000,
    minimum_balance: null,
    monthly_fee: 0,
    opened_date: '2024-01-01T00:00:00Z',
    last_activity: '2024-01-15T10:30:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    clients: {
      first_name: 'Sarah',
      last_name: 'Johnson',
      risk_level: 'low',
      users: {
        email: 'sarah.johnson@email.com'
      }
    }
  },
  {
    id: '2222bbbb-2222-2222-2222-222222222222',
    client_id: 'aaaabbbb-1111-2222-3333-444444444444',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    account_number: '1001234568',
    account_name: 'High Yield Savings',
    account_type: 'savings',
    currency: 'USD',
    balance: 20000.00,
    available_balance: 20000.00,
    status: 'active',
    interest_rate: 2.5,
    overdraft_limit: null,
    minimum_balance: 1000,
    monthly_fee: 0,
    opened_date: '2024-01-01T00:00:00Z',
    last_activity: '2024-01-12T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
    clients: {
      first_name: 'Sarah',
      last_name: 'Johnson',
      risk_level: 'low',
      users: {
        email: 'sarah.johnson@email.com'
      }
    }
  },
  // Michael Chen's accounts
  {
    id: '3333cccc-3333-3333-3333-333333333333',
    client_id: 'bbbbcccc-2222-3333-4444-555555555555',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    account_number: '1002345678',
    account_name: 'Business Checking',
    account_type: 'business',
    currency: 'USD',
    balance: 85300.50,
    available_balance: 85300.50,
    status: 'active',
    interest_rate: null,
    overdraft_limit: 15000,
    minimum_balance: null,
    monthly_fee: 25,
    opened_date: '2024-01-01T00:00:00Z',
    last_activity: '2024-01-14T16:45:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-14T16:45:00Z',
    clients: {
      first_name: 'Michael',
      last_name: 'Chen',
      risk_level: 'medium',
      users: {
        email: 'michael.chen@business.com'
      }
    }
  },
  // Robert Davis's accounts
  {
    id: '9999cccc-9999-9999-9999-999999999999',
    client_id: 'ffffeeee-6666-7777-8888-999999999999',
    msb_id: 'c2eede11-be2d-6ef0-dd8f-8dd1df502c33',
    account_number: '3001234567',
    account_name: 'Premium Checking',
    account_type: 'current',
    currency: 'USD',
    balance: 45000.00,
    available_balance: 45000.00,
    status: 'active',
    interest_rate: null,
    overdraft_limit: 10000,
    minimum_balance: null,
    monthly_fee: 15,
    opened_date: '2024-01-01T00:00:00Z',
    last_activity: '2024-01-15T11:45:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T11:45:00Z',
    clients: {
      first_name: 'Robert',
      last_name: 'Davis',
      risk_level: 'low',
      users: {
        email: 'robert.davis@finance.com'
      }
    }
  }
];

const MOCK_TRANSACTIONS = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    account_id: '1111aaaa-1111-1111-1111-111111111111',
    client_id: 'aaaabbbb-1111-2222-3333-444444444444',
    transaction_number: 'TXN-FT-001',
    type: 'credit',
    category: 'deposit',
    amount: 2500.00,
    currency: 'USD',
    description: 'Salary Deposit - Monthly Pay',
    reference: 'PAYROLL-2024-001',
    status: 'completed',
    requires_approval: false,
    payment_method: 'ach',
    balance_after: 25750.00,
    risk_score: 15,
    flags: [],
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z',
    clients: {
      first_name: 'Sarah',
      last_name: 'Johnson'
    },
    main_account: {
      id: '1111aaaa-1111-1111-1111-111111111111',
      account_name: 'Primary Checking',
      account_number: '1001234567'
    }
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    account_id: '1111aaaa-1111-1111-1111-111111111111',
    client_id: 'aaaabbbb-1111-2222-3333-444444444444',
    transaction_number: 'TXN-FT-002',
    type: 'debit',
    category: 'payment',
    amount: -85.50,
    currency: 'USD',
    description: 'Grocery Store Purchase',
    reference: 'CARD-2024-002',
    status: 'completed',
    requires_approval: false,
    payment_method: 'card',
    balance_after: 23250.00,
    risk_score: 10,
    flags: [],
    created_at: '2025-01-14T18:45:00Z',
    updated_at: '2025-01-14T18:45:00Z',
    clients: {
      first_name: 'Sarah',
      last_name: 'Johnson'
    },
    main_account: {
      id: '1111aaaa-1111-1111-1111-111111111111',
      account_name: 'Primary Checking',
      account_number: '1001234567'
    }
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    account_id: '3333cccc-3333-3333-3333-333333333333',
    client_id: 'bbbbcccc-2222-3333-4444-555555555555',
    transaction_number: 'TXN-FT-003',
    type: 'credit',
    category: 'deposit',
    amount: 15000.00,
    currency: 'USD',
    description: 'Business Revenue Deposit',
    reference: 'DEPOSIT-2024-001',
    status: 'completed',
    requires_approval: false,
    payment_method: 'wire',
    balance_after: 85300.50,
    risk_score: 45,
    flags: ['Large Deposit'],
    created_at: '2025-01-14T16:45:00Z',
    updated_at: '2025-01-14T16:45:00Z',
    clients: {
      first_name: 'Michael',
      last_name: 'Chen'
    },
    main_account: {
      id: '3333cccc-3333-3333-3333-333333333333',
      account_name: 'Business Checking',
      account_number: '1002345678'
    }
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    account_id: '9999cccc-9999-9999-9999-999999999999',
    client_id: 'ffffeeee-6666-7777-8888-999999999999',
    transaction_number: 'TXN-FT-004',
    type: 'credit',
    category: 'transfer',
    amount: 5000.00,
    currency: 'USD',
    description: 'Wire Transfer Received',
    reference: 'WIRE-2024-001',
    status: 'completed',
    requires_approval: false,
    payment_method: 'wire',
    balance_after: 50000.00,
    risk_score: 25,
    flags: [],
    created_at: '2025-01-13T14:20:00Z',
    updated_at: '2025-01-13T14:20:00Z',
    clients: {
      first_name: 'Robert',
      last_name: 'Davis'
    },
    main_account: {
      id: '9999cccc-9999-9999-9999-999999999999',
      account_name: 'Premium Checking',
      account_number: '3001234567'
    }
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    account_id: '1111aaaa-1111-1111-1111-111111111111',
    client_id: 'aaaabbbb-1111-2222-3333-444444444444',
    transaction_number: 'TXN-FT-005',
    type: 'debit',
    category: 'withdrawal',
    amount: -200.00,
    currency: 'USD',
    description: 'ATM Withdrawal',
    reference: 'ATM-2024-001',
    status: 'completed',
    requires_approval: false,
    payment_method: 'atm',
    balance_after: 23050.00,
    risk_score: 5,
    flags: [],
    created_at: '2025-01-12T09:15:00Z',
    updated_at: '2025-01-12T09:15:00Z',
    clients: {
      first_name: 'Sarah',
      last_name: 'Johnson'
    },
    main_account: {
      id: '1111aaaa-1111-1111-1111-111111111111',
      account_name: 'Primary Checking',
      account_number: '1001234567'
    }
  },
  {
    id: 'a6666666-6666-6666-6666-666666666666',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    account_id: '3333cccc-3333-3333-3333-333333333333',
    client_id: 'bbbbcccc-2222-3333-4444-555555555555',
    transaction_number: 'TXN-FT-006',
    type: 'debit',
    category: 'payment',
    amount: -1250.00,
    currency: 'USD',
    description: 'Office Rent Payment',
    reference: 'RENT-2024-001',
    status: 'completed',
    requires_approval: false,
    payment_method: 'ach',
    balance_after: 84050.50,
    risk_score: 20,
    flags: [],
    created_at: '2025-01-11T11:30:00Z',
    updated_at: '2025-01-11T11:30:00Z',
    clients: {
      first_name: 'Michael',
      last_name: 'Chen'
    },
    main_account: {
      id: '3333cccc-3333-3333-3333-333333333333',
      account_name: 'Business Checking',
      account_number: '1002345678'
    }
  },
  {
    id: 'a7777777-7777-7777-7777-777777777777',
    msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    account_id: '9999cccc-9999-9999-9999-999999999999',
    client_id: 'ffffeeee-6666-7777-8888-999999999999',
    transaction_number: 'TXN-FT-007',
    type: 'credit',
    category: 'deposit',
    amount: 3000.00,
    currency: 'USD',
    description: 'Investment Dividend',
    reference: 'DIV-2024-001',
    status: 'completed',
    requires_approval: false,
    payment_method: 'ach',
    balance_after: 53000.00,
    risk_score: 15,
    flags: [],
    created_at: '2025-01-10T16:45:00Z',
    updated_at: '2025-01-10T16:45:00Z',
    clients: {
      first_name: 'Robert',
      last_name: 'Davis'
    },
    main_account: {
      id: '9999cccc-9999-9999-9999-999999999999',
      account_name: 'Premium Checking',
      account_number: '3001234567'
    }
  }
];

// Types
interface Client {
  id: string;
  user_id: string;
  msb_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  phone_number: string | null;
  id_type: 'passport' | 'driver_license' | 'national_id' | null;
  id_document_type: 'PASSPORT' | 'SSN' | 'DRIVER_LICENSE' | 'NATIONAL_ID' | 'ID_CARD' | 'DRIVERS' | null;
  id_number: string | null;
  occupation: string | null;
  source_of_funds: string | null;
  annual_income_range: string | null;
  address: any;
  kyc_status: 'pending' | 'approved' | 'rejected' | 'requires_documents';
  risk_level: 'low' | 'medium' | 'high';
  kyc_completed_at: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    email: string;
    name: string;
    is_active: boolean;
    last_login: string | null;
  };
}

interface Account {
  id: string;
  client_id: string;
  msb_id: string;
  account_number: string;
  account_name: string;
  account_type: 'current' | 'savings' | 'multi_currency' | 'business';
  currency: string;
  balance: number;
  available_balance: number;
  status: 'active' | 'inactive' | 'frozen' | 'closed';
  interest_rate: number | null;
  overdraft_limit: number | null;
  minimum_balance: number | null;
  monthly_fee: number;
  opened_date: string;
  last_activity: string;
  created_at: string;
  updated_at: string;
  clients?: Client;
  pin_number?: string;
}

interface Transaction {
  id: string;
  msb_id: string;
  account_id: string;
  client_id: string;
  transaction_number: string;
  type: 'credit' | 'debit';
  category: 'transfer' | 'payment' | 'deposit' | 'withdrawal' | 'fee' | 'interest' | 'refund';
  amount: number;
  currency: string;
  description: string;
  reference: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed' | 'cancelled' | 'payout_pending' | 'payin_completed';
  requires_approval: boolean;
  from_account_id: string | null;
  to_account_id: string | null;
  beneficiary_id: string | null;
  payment_method: 'card' | 'online' | 'mobile' | 'atm' | 'wire' | 'ach' | null;
  location: string | null;
  merchant: string | null;
  balance_after: number | null;
  risk_score: number;
  flags: string[];
  approved_by: string | null;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  clients?: Client;
  main_account?: Account;
  client_info?: {
    id: string;
    name: string;
    type: 'individual' | 'business';
  };
}

interface Notification {
  id: string;
  user_id: string;
  msb_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

interface ComplianceAlert {
  id: string;
  msb_id: string;
  client_id: string;
  transaction_id: string | null;
  alert_type: 'suspicious_activity' | 'large_transaction' | 'kyc_review' | 'aml_flag' | 'sanctions_check';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'under_review' | 'resolved' | 'false_positive';
  description: string;
  amount: number | null;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Beneficiary {
  id: string;
  client_id: string;
  msb_id: string;
  name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  account_type: 'checking' | 'savings';
  currency: string;
  country: string;
  address: string;
  signature_tx_hash: string;
  created_at: string;
  updated_at: string;
  blindpay_bank_account_id?: string;
}

interface VirtualAccount {
  id: string;
  clientId: string;
  blindpayReceiverId: string;
  blindpayVirtualAccountId: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  paymentRail: 'ach' | 'domestic_wire' | 'international_wire' | 'rtp';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  token: string;
  blockchainWalletId?: string;
  balance: string;
  availableBalance: string;
  currency: string;
  accountName?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
}



// Clients Hook
export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClients = async () => {
    if (!user?.msbId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Fetch from backend
      const clientsRes = await fetch(`${API_BASE_URL}/client/list?msb_id=${user.msbId}`, {
        headers: Object.assign({}, getAuthHeaders(), {}),
      });
      if (!clientsRes.ok) throw new Error('Failed to fetch clients');
      const data = await clientsRes.json();
      const clients = (data.clients || []) as Client[];
      const usersResponse = await fetch(`${API_BASE_URL}/msb-admin/users`, {
        headers: Object.assign({}, getAuthHeaders(), {}),
      });

      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      const users = (usersData.users || []) as User[];
      const clientsWithUsers = clients.map(client => ({
        ...client,
        users: users.find(user => user.id === client.user_id)
      })) as Client[];
      setClients(clientsWithUsers);
    } catch (err: any) {
      console.log('Falling back to mock client data');
      const mockData = MOCK_CLIENTS.filter(client => client.msb_id === user.msbId).map(client => ({
        ...client,
        id_type: (['passport', 'driver_license', 'national_id'].includes(client.id_type) ? client.id_type : null) as 'passport' | 'driver_license' | 'national_id' | null
      }));
      setClients(mockData as Client[]);
      setError(err.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user?.msbId]);

  const updateClientStatus = async (clientId: string, isActive: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/client/update-status/${clientId}`, {
        method: 'PUT',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to update client status');
      await fetchClients();
    } catch (err: any) {
      console.error('Error updating client status:', err);
      throw err;
    }
  };

  const updateClientKycStatus = async (clientId: string, kycStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/client/update-kyc-status/${clientId}`, {
        method: 'PUT',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify({ kycStatus }),
      });
      if (!res.ok) throw new Error('Failed to update KYC status');
      await fetchClients();
    } catch (err: any) {
      console.error('Error updating KYC status:', err);
      throw err;
    }
  };

  const updateClientRiskLevel = async (clientId: string, riskLevel: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/client/update-risk-level/${clientId}`, {
        method: 'PUT',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify({ riskLevel }),
      });
      if (!res.ok) throw new Error('Failed to update risk level');
      await fetchClients();
    } catch (err: any) {
      console.error('Error updating risk level:', err);
      throw err;
    }
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    updateClientStatus,
    updateClientKycStatus,
    updateClientRiskLevel
  };
}

// Accounts Hook
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAccounts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let res, data;
      console.log(user);
      if (user.role === 'msb_admin') {
        // Validate msbId before making the request
        if (!user.msbId) {
          console.error('MSB ID is missing for msb_admin user');
          setError('MSB ID is missing. Please contact support.');
          setLoading(false);
          return;
        }
        // Fetch all accounts for this MSB
        res = await fetch(`${API_BASE_URL}/account/msb/${user.msbId}`, {
          headers: Object.assign({}, getAuthHeaders(), {}),
        });
        if (!res.ok) throw new Error('Failed to fetch accounts');
        data = await res.json();
        setAccounts(data || []);
      } else {
        // Fetch only this client's accounts
        console.log("client id", user.clientId);
        res = await fetch(`${API_BASE_URL}/account/list?user_id=${user.clientId}`, {
          headers: Object.assign({}, getAuthHeaders(), {}),
        });
        if (!res.ok) throw new Error('Failed to fetch accounts');
        data = await res.json();
        setAccounts(data || []);
      }
    } catch (err: any) {
      console.log('Falling back to mock account data');
      let mockData;
      if (user.role === 'msb_admin') {
        mockData = MOCK_ACCOUNTS.filter(account => account.msb_id === user.msbId).map(account => ({
          ...account,
          account_type: (['current', 'savings', 'multi_currency', 'business'].includes(account.account_type) ? account.account_type : 'current') as 'current' | 'savings' | 'multi_currency' | 'business',
        }));
      } else {
        const clientRecord = MOCK_CLIENTS.find(client => client.user_id === user.id);
        if (!clientRecord) throw new Error('Client record not found in mock data');
        mockData = MOCK_ACCOUNTS.filter(account => account.client_id === clientRecord.id).map(account => ({
          ...account,
          account_type: (['current', 'savings', 'multi_currency', 'business'].includes(account.account_type) ? account.account_type : 'current') as 'current' | 'savings' | 'multi_currency' | 'business',
        }));
      }
      setAccounts(mockData as Account[]);
      setError(err.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const updateAccountStatus = async (accountId: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/account/update-status/${accountId}`, {
        method: 'PUT',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update account status');
      await fetchAccounts();
    } catch (err: any) {
      console.error('Error updating account status:', err);
      throw err;
    }
  };

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
    updateAccountStatus
  };
}

// MSB Transactions Hook - For MSB admins to get all transactions from all clients
export function useMSBTransactions(page: number = 1, limit: number = 50, status?: string, type?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { user } = useAuth();

  const fetchMSBTransactions = async () => {
    if (!user || user.role !== 'msb_admin') {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Use the new MSB transaction endpoint
      const res = await fetch(`${API_BASE_URL}/transaction/msb/list`, {
        method: 'POST',
        headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          msb_id: user.msbId,
          page,
          limit,
          status,
          type
        }),
      });
      if (!res.ok) throw new Error('Failed to fetch MSB transactions');
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err: any) {
      console.log('Falling back to mock transaction data for MSB');
      // Filter mock transactions for this MSB
      const mockData = MOCK_TRANSACTIONS.filter(transaction => transaction.msb_id === user.msbId).map(transaction => ({
        ...transaction,
        type: (['credit', 'debit'].includes(transaction.type) ? transaction.type : 'credit') as 'credit' | 'debit',
        category: (['transfer', 'payment', 'deposit', 'withdrawal', 'fee', 'interest', 'refund'].includes(transaction.category) ? transaction.category : 'transfer') as 'transfer' | 'payment' | 'deposit' | 'withdrawal' | 'fee' | 'interest' | 'refund',
        status: (['pending', 'approved', 'rejected', 'completed', 'failed', 'cancelled', 'payout_pending', 'payin_completed'].includes(transaction.status) ? transaction.status : 'pending') as 'pending' | 'approved' | 'rejected' | 'completed' | 'failed' | 'cancelled' | 'payout_pending' | 'payin_completed',
      }));
      setTransactions(mockData as Transaction[]);
      setTotal(mockData.length);
      setTotalPages(Math.ceil(mockData.length / limit));
      setError(err.message || 'Failed to fetch MSB transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMSBTransactions();
  }, [user, page, limit, status, type]);

  return {
    transactions,
    loading,
    error,
    total,
    totalPages,
    refetch: fetchMSBTransactions
  };
}

// Dashboard Transactions Hook - For MSB dashboard statistics (fetches more data)
export function useDashboardTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDashboardTransactions = async () => {
    if (!user || user.role !== 'msb_admin') {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Fetch multiple pages to get more transactions for dashboard stats
      const allTransactions: Transaction[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const pageLimit = 100; // API limit

      while (hasMorePages && currentPage <= 5) { // Limit to 5 pages max for dashboard
        const res = await fetch(`${API_BASE_URL}/transaction/msb/list`, {
          method: 'POST',
          headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            msb_id: user.msbId,
            page: currentPage,
            limit: pageLimit
          }),
        });

        if (!res.ok) throw new Error('Failed to fetch MSB transactions');
        const data = await res.json();

        if (data.transactions && data.transactions.length > 0) {
          allTransactions.push(...data.transactions);
          hasMorePages = currentPage < (data.totalPages || 1);
          currentPage++;
        } else {
          hasMorePages = false;
        }
      }

      setTransactions(allTransactions);
    } catch (err: any) {
      console.log('Falling back to mock transaction data for dashboard');
      // Filter mock transactions for this MSB
      const mockData = MOCK_TRANSACTIONS.filter(transaction => transaction.msb_id === user.msbId).map(transaction => ({
        ...transaction,
        type: (['credit', 'debit'].includes(transaction.type) ? transaction.type : 'credit') as 'credit' | 'debit',
        category: (['transfer', 'payment', 'deposit', 'withdrawal', 'fee', 'interest', 'refund'].includes(transaction.category) ? transaction.category : 'transfer') as 'transfer' | 'payment' | 'deposit' | 'withdrawal' | 'fee' | 'interest' | 'refund',
        status: (['pending', 'approved', 'rejected', 'completed', 'failed', 'cancelled', 'payout_pending', 'payin_completed'].includes(transaction.status) ? transaction.status : 'pending') as 'pending' | 'approved' | 'rejected' | 'completed' | 'failed' | 'cancelled' | 'payout_pending' | 'payin_completed',
      }));
      setTransactions(mockData as Transaction[]);
      setError(err.message || 'Failed to fetch dashboard transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardTransactions();
  }, [user]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchDashboardTransactions
  };
}

// Client Transactions Hook - For individual clients
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { user } = useAuth();

  const fetchTransactions = async (page: number = 1, append: boolean = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // Only for clients, not MSB admins
      if (user.role === 'msb_admin') {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const clientId = user.clientId || user.id;

      // Fetch from backend with pagination
      const res = await fetch(`${API_BASE_URL}/transaction/list`, {
        method: 'POST',
        headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          client_id: clientId,
          page: page,
          limit: pageSize
        }),
      });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();

      const newTransactions = data.transactions || [];

      if (append) {
        setTransactions(prev => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }

      // Check if there are more transactions
      setHasMore(newTransactions.length === pageSize);
      setCurrentPage(page);
    } catch (err: any) {
      console.log('Falling back to mock transaction data');
      const clientRecord = MOCK_CLIENTS.find(client => client.user_id === user.id);
      if (!clientRecord) throw new Error('Client record not found in mock data');
      const mockData = MOCK_TRANSACTIONS.filter(transaction => transaction.client_id === clientRecord.id).map(transaction => ({
        ...transaction,
        type: (['credit', 'debit'].includes(transaction.type) ? transaction.type : 'credit') as 'credit' | 'debit',
        category: (['transfer', 'payment', 'deposit', 'withdrawal', 'fee', 'interest', 'refund'].includes(transaction.category) ? transaction.category : 'transfer') as 'transfer' | 'payment' | 'deposit' | 'withdrawal' | 'fee' | 'interest' | 'refund',
        status: (['pending', 'approved', 'rejected', 'completed', 'failed', 'cancelled', 'payout_pending', 'payin_completed'].includes(transaction.status) ? transaction.status : 'pending') as 'pending' | 'approved' | 'rejected' | 'completed' | 'failed' | 'cancelled' | 'payout_pending' | 'payin_completed',
      }));

      // For mock data, simulate pagination
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedMockData = mockData.slice(startIndex, endIndex);

      if (append) {
        setTransactions(prev => [...prev, ...paginatedMockData as Transaction[]]);
      } else {
        setTransactions(paginatedMockData as Transaction[]);
      }

      setHasMore(endIndex < mockData.length);
      setCurrentPage(page);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1, false);
  }, [user]);

  const loadMore = async () => {
    if (hasMore && !loadingMore) {
      await fetchTransactions(currentPage + 1, true);
    }
  };

  const approveTransaction = async (transactionId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/transaction/approve/${transactionId}`, {
        method: 'PUT',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!res.ok) throw new Error('Failed to approve transaction');
      await fetchTransactions(1, false);
    } catch (err: any) {
      console.error('Error approving transaction:', err);
      throw err;
    }
  };

  const rejectTransaction = async (transactionId: string, reason?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/transaction/reject/${transactionId}`, {
        method: 'PUT',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify({ status: 'rejected', reason }),
      });
      if (!res.ok) throw new Error('Failed to reject transaction');
      await fetchTransactions(1, false);
    } catch (err: any) {
      console.error('Error rejecting transaction:', err);
      throw err;
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: string, reason?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/transaction/update-status/${transactionId}`, {
        method: 'PUT',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error('Failed to update transaction status');
      await fetchTransactions(1, false);
    } catch (err: any) {
      console.error('Error updating transaction status:', err);
      throw err;
    }
  };

  const createTransaction = async (transactionData: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/transaction/create`, {
        method: 'POST',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify(transactionData),
      });
      if (!res.ok) throw new Error('Failed to create transaction');
      const data = await res.json();
      await fetchTransactions(1, false);
      return { success: true, data };
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      throw err;
    }
  };

  const fetchRecentTransactions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let clientId;
      if (user.role === 'msb_admin') {
        // For MSB admins, we need to get the client ID from the user's context
        // For now, we'll use msbId as a fallback
        clientId = user.msbId;
      } else {
        clientId = user.clientId || user.id; // Use clientId for clients, fallback to id
      }
      const res = await fetch(
        `${API_BASE_URL}/transaction/recent?user_id=${clientId}`,
        {
          method: 'GET',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (!res.ok) {
        throw new Error(`Error fetching transaction: ${res.status}`);
      }
      const data = await res.json();
      return data.transactions || []; // Assume backend already returns an array of transactions
    } catch (err: any) {
      console.error('Error fetching recent transaction:', err);
      setError(err.message || 'Failed to fetch transactions');
    }
    finally {
      setLoading(false);
    }
  };

  return {
    transactions,
    loading,
    loadingMore,
    error,
    hasMore,
    currentPage,
    loadMore,
    refetch: () => fetchTransactions(1, false),
    approveTransaction,
    rejectTransaction,
    updateTransactionStatus,
    createTransaction,
    fetchRecentTransactions
  };
}

// Notifications Hook
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Fetch from backend
      const res = await fetch(`${API_BASE_URL}/notification/list?user_id=${user.id}`, {
        headers: Object.assign({}, getAuthHeaders(), {}),
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter((n: any) => !n.read).length);
    } catch (err: any) {
      setNotifications([]);
      setUnreadCount(0);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notification/mark-read/${notificationId}`, {
        method: 'PUT',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) throw new Error('Failed to mark notification as read');
      await fetchNotifications();
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notification/mark-all-read`, {
        method: 'PUT',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) throw new Error('Failed to mark all notifications as read');
      await fetchNotifications();
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  };

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}

// Compliance Alerts Hook
export function useComplianceAlerts() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAlerts = async () => {
    if (!user?.msbId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Fetch from backend
      const res = await fetch(`${API_BASE_URL}/compliance-alert/list?msb_id=${user.msbId}`, {
        headers: Object.assign({}, getAuthHeaders(), {}),
      });
      if (!res.ok) throw new Error('Failed to fetch compliance alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err: any) {
      console.error('Error fetching compliance alerts:', err);
      setError(err.message || 'Failed to fetch compliance alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [user?.msbId]);

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts
  };
}

// Client Management Hook
export function useClientManagement() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const createClient = async (clientData: any) => {
    if (!user?.msbId) {
      throw new Error('MSB ID not found');
    }

    // Require dateOfBirth for individual clients
    if (clientData.clientType === 'individual' && !clientData.dateOfBirth) {
      throw new Error('Date of birth is required for individual clients.');
    }

    setLoading(true);
    try {
      // Generate a temporary password if not provided
      const tempPassword = clientData.password || generateTempPassword();

      // Create the client (user + profile) in one call
      const clientRes = await fetch(`${API_BASE_URL}/client/register`, {
        method: 'POST',
        headers: Object.assign(
          {},
          getAuthHeaders(),
          { 'Content-Type': 'application/json' }
        ),
        body: JSON.stringify({
          msb_id: user.msbId,
          email: clientData.email,
          password: tempPassword,
          name: `${clientData.firstName} ${clientData.lastName}`,
          first_name: clientData.firstName,
          last_name: clientData.lastName,
          phone_number: clientData.phoneNumber || null,
          date_of_birth: clientData.dateOfBirth ? new Date(`${clientData.dateOfBirth}T00:00:00.000Z`).toISOString() : null,
          nationality: clientData.nationality || null,
          occupation: clientData.occupation || null,
          source_of_funds: clientData.sourceOfFunds || null,
          annual_income_range: clientData.annualIncomeRange || null,
          client_type: clientData.clientType,
          kyc_type: clientData.kycType,
          tax_id: clientData.taxId || null,
          address_1: clientData.address1 || null,
          address_2: clientData.address2 || null,
          city: clientData.city || null,
          state: clientData.state || null,
          country: clientData.country || null,
          postal_code: clientData.postalCode || null,
          proof_of_address_type: clientData.proofOfAddressType || null,
          proof_of_address_document: clientData.proofOfAddressDocFile?.fileUrl || clientData.proofOfAddressDocFile || null,
          source_of_funds_doc_type: clientData.sourceOfFundsDocType || null,
          source_of_funds_doc_file: clientData.sourceOfFundsDocFile?.fileUrl || clientData.sourceOfFundsDocFile || null,
          individual_holding_doc_front_file: clientData.individualHoldingDocFrontFile?.fileUrl || clientData.individualHoldingDocFrontFile || null,
          purpose_of_transactions: clientData.purposeOfTransactions || null,
          purpose_of_transactions_explanation: clientData.purposeOfTransactionsExplanation || null,
          external_id: clientData.externalId || null,
          // Business fields
          legal_name: clientData.legalName || null,
          doing_business_as: clientData.doingBusinessAs || null,
          formation_date: clientData.formationDate || null,
          website: clientData.website || null,
          owners: clientData.owners || [],
          incorporation_doc_file: clientData.incorporationDocFile || null,
          proof_of_ownership_doc_file: clientData.proofOfOwnershipDocFile || null,
          // Individual fields
          id_document_country: clientData.idDocCountry || null,
          id_document_type: clientData.idDocType || null,
          id_document_front: clientData.idDocFrontFile?.fileUrl || clientData.idDocFrontFile || null,
          id_document_back: clientData.idDocBackFile?.fileUrl || clientData.idDocBackFile || null,
        }),
      });
      if (!clientRes.ok) {
        // Try to extract error message from response
        let errorMessage = 'Failed to create client';
        try {
          const errorData = await clientRes.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = clientRes.statusText || 'Failed to create client';
        }
        throw new Error(errorMessage);
      }
      const clientRecord = await clientRes.json();

      // Store the demo credentials for login
      const demoCredentials = JSON.parse(localStorage.getItem('demo_credentials') || '[]');
      demoCredentials.push({
        email: clientData.email,
        name: `${clientData.firstName} ${clientData.lastName}`,
        user_type: 'client',
        company_name: user.role === 'msb_admin' ? 'FinTech Solutions Ltd' : 'SecureBank Pro',
        company_domain: user.role === 'msb_admin' ? 'banking.fintechsolutions.com' : 'app.securebank.pro',
        password_hint: tempPassword,
        description: 'New client account'
      });
      localStorage.setItem('demo_credentials', JSON.stringify(demoCredentials));

      // Dispatch event to update login form
      window.dispatchEvent(new Event('credentialsUpdated'));

      setLoading(false);
      return { success: true, tempPassword, clientId: clientRecord.client?.id };
    } catch (err: any) {
      setLoading(false);
      console.error('Error creating client:', err);
      throw err;
    }
  };

  const uploadClientDocument = async (cliendDocument: File) => {
    if (!user?.msbId) {
      throw new Error('MSB ID not found');
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", cliendDocument);
      const clientRes = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });

      if (!clientRes.ok) {
        throw new Error(`Upload failed: ${clientRes.statusText}`);
      }
      setUploading(false);
      return await clientRes.json();
    }
    catch (err: any) {
      setUploading(false);
      console.error('Error uploading client document:', err);
      throw err;
    }
  }

  return {
    createClient,
    uploadClientDocument,
    loading,
    uploading
  };
}

// Account Management Hook
export function useAccountManagement() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createAccount = async (accountData: any) => {
    if (!user?.msbId) {
      throw new Error('MSB ID not found');
    }

    setLoading(true);
    try {
      // If the payload already includes BlindPay fields, pass it through
      const isBlindPayPayload = accountData.receiver_id && accountData.bankAccountData;
      const payload = isBlindPayPayload
        ? accountData
        : {
          client_id: accountData.clientId,
          msb_id: user.msbId,
          account_number: accountData.accountNumber,
          account_name: accountData.accountName,
          account_type: accountData.accountType,
          currency: accountData.currency,
          balance: accountData.initialBalance !== undefined && accountData.initialBalance !== null ? String(accountData.initialBalance) : "0",
          available_balance: accountData.initialBalance !== undefined && accountData.initialBalance !== null ? String(accountData.initialBalance) : "0",
          status: 'active',
          interest_rate: accountData.interestRate !== undefined && accountData.interestRate !== null ? String(accountData.interestRate) : null,
          overdraft_limit: accountData.overdraftLimit !== undefined && accountData.overdraftLimit !== null ? String(accountData.overdraftLimit) : null,
          minimum_balance: accountData.minimumBalance !== undefined && accountData.minimumBalance !== null ? String(accountData.minimumBalance) : null,
          monthly_fee: accountData.monthlyFee !== undefined && accountData.monthlyFee !== null ? String(accountData.monthlyFee) : "0",
          opened_date: new Date().toISOString(),
          last_activity: new Date().toISOString()
        };
      const res = await fetch(`${API_BASE_URL}/account`, {
        method: 'POST',
        headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create account');
      const data = await res.json();

      // Create a notification for the client
      /*
      // TODO: Re-enable notification logic once /client/get-user-id/:clientId endpoint is fixed
      if (accountData.clientId) {
        const clientRes = await fetch(`${API_BASE_URL}/client/get-user-id/${accountData.clientId}`, {
          headers: Object.assign({}, getAuthHeaders(), {}),
        });
        if (!clientRes.ok) throw new Error('Failed to get client user ID');
        const clientData = await clientRes.json();

        if (clientData) {
          await fetch(`${API_BASE_URL}/notification/create`, {
            method: 'POST',
            headers: Object.assign({}, getAuthHeaders(), {}),
            body: JSON.stringify({
              user_id: clientData.user_id,
              msb_id: user.msbId,
              type: 'account_created',
              title: 'New Account Created',
              message: `Your ${accountData.accountName} account has been created and is ready to use.`,
              data: {
                account_id: data.id,
                account_name: accountData.accountName,
                account_number: accountData.accountNumber
              },
              read: false
            }),
          });
        }
      }
      */

      setLoading(false);
      return { success: true, data };
    } catch (err: any) {
      setLoading(false);
      console.error('Error creating account:', err);
      throw err;
    }
  };

  return {
    createAccount,
    loading
  };
}

// Wallets Hook
export function useWallets() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all wallets (filtered by MSB ID for MSB admin users)
  const fetchWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE_URL}/wallet`;

      // For MSB admin users, filter by their MSB ID
      if (user?.role === 'msb_admin' && user?.msbId) {
        url += `?msb_id=${user.msbId}`;
      }

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch wallets');
      const data = await res.json();
      const wallets = data as any[];
      const usersResponse = await fetch(`${API_BASE_URL}/msb-admin/users`, {
        headers: Object.assign({}, getAuthHeaders(), {}),
      });
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      const users = (usersData.users || []) as User[];
      const walletsWithUsers = wallets.map(wallet => ({
        ...wallet,
        client: {
          ...wallet.client,
          users: users.find(user => user.id === wallet.client?.user_id)
        }
      }));
      setWallets(walletsWithUsers);
      setLoading(false);
      return data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to fetch wallets');
      setWallets([]);
      throw err;
    }
  };

  // Fetch wallets by client ID
  const fetchWalletsByClientId = async (clientId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/wallet/client/${clientId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch wallets');
      const data = await res.json();
      setWallets(data);
      setLoading(false);
      return data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to fetch wallets');
      setWallets([]);
      throw err;
    }
  };

  // Create wallet
  const createWallet = async (walletData: any) => {
    setLoading(true);
    setError(null);
    try {
      console.log('useWallets sending to backend:', walletData);

      const res = await fetch(`${API_BASE_URL}/wallet`, {
        method: 'POST',
        headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify(walletData),
      });

      console.log('Backend response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Backend error response:', errorText);

        // Try to parse the error response as JSON to get the actual error message
        let errorMessage = 'Failed to create wallet';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.details?.message) {
            errorMessage = errorData.details.message;
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            // Extract error messages from validation errors
            const errorMessages = errorData.errors.map((err: any) => err.message).join(', ');
            errorMessage = errorMessages || errorMessage;
          }
        } catch (parseError) {
          // If JSON parsing fails, use the raw error text
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log('Backend success response:', data);

      setLoading(false);
      return { success: true, data };
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to create wallet');
      throw err;
    }
  };

  return {
    wallets,
    loading,
    error,
    fetchWallets,
    fetchWalletsByClientId,
    createWallet,
  };
}

// Beneficiary Management Hook
export function useBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBeneficiaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/beneficiary/list/${user?.clientId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch beneficiaries');
      const data = await res.json();
      setBeneficiaries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  const createBeneficiary = async (beneficiaryData: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/beneficiary`, {
        method: 'POST',
        headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify(beneficiaryData),
      });
      if (!res.ok) throw new Error('Failed to create beneficiary');
      const data = await res.json();
      setLoading(false);
      return { success: true, data };
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to create beneficiary');
      throw err;
    }
  };

  return {
    beneficiaries,
    loading,
    error,
    fetchBeneficiaries,
    createBeneficiary,
  };
}

// Virtual Accounts Hook
export function useVirtualAccounts() {
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchVirtualAccounts = async () => {
    if (!user?.msbId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Fetch from backend
      const res = await fetch(`${API_BASE_URL}/virtual-account/list?msb_id=${user.msbId}`, {
        headers: Object.assign({}, getAuthHeaders(), {}),
      });
      if (!res.ok) throw new Error('Failed to fetch virtual accounts');
      const data = await res.json();
      const virtualAccounts = (data.virtualAccounts || []) as VirtualAccount[];
      const usersResponse = await fetch(`${API_BASE_URL}/msb-admin/users`, {
        headers: Object.assign({}, getAuthHeaders(), {}),
      });
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      const users = (usersData.users || []) as User[];
      const virtualAccountsWithUsers = virtualAccounts.map(virtualAccount => ({
        ...virtualAccount,
        client: {
          ...virtualAccount.client,
          users: users.find(user => user.id === virtualAccount.client?.user_id)
        }
      })) as VirtualAccount[];
      setVirtualAccounts(virtualAccountsWithUsers);
    } catch (err: any) {
      console.log('No virtual accounts found');
      setVirtualAccounts([]);
      setError(null); // Don't show error for empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVirtualAccounts();
  }, [user?.msbId]);

  const createVirtualAccount = async (virtualAccountData: any) => {
    if (!user?.msbId) {
      throw new Error('MSB ID not found');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/virtual-account`, {
        method: 'POST',
        headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          clientId: virtualAccountData.clientId,
          paymentRail: virtualAccountData.paymentRail,
          token: virtualAccountData.token,
          blockchainWalletId: virtualAccountData.blockchainWalletId,
          accountName: virtualAccountData.accountName,
          description: virtualAccountData.description,
        }),
      });
      if (!res.ok) throw new Error('Failed to create virtual account');
      const data = await res.json();
      await fetchVirtualAccounts();
      return { success: true, data };
    } catch (err: any) {
      setLoading(false);
      console.error('Error creating virtual account:', err);
      throw err;
    }
  };

  const updateVirtualAccountStatus = async (virtualAccountId: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/virtual-account/update-status/${virtualAccountId}`, {
        method: 'PUT',
        headers: Object.assign({}, getAuthHeaders(), {}),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update virtual account status');
      await fetchVirtualAccounts();
    } catch (err: any) {
      console.error('Error updating virtual account status:', err);
      throw err;
    }
  };

  return {
    virtualAccounts,
    loading,
    error,
    refetch: fetchVirtualAccounts,
    createVirtualAccount,
    updateVirtualAccountStatus
  };
}

// Unified Transfer Hook
export function useTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);

  // Preview transfer (get payin + payout quote, total fees, recipient amount)
  const previewTransfer = async (transferData: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/transfer`, {
        method: 'POST',
        headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify(transferData),
      });
      if (!res.ok) throw new Error('Failed to get transfer preview');
      const data = await res.json();
      setPreview(data);
      setLoading(false);
      return data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to get transfer preview');
      throw err;
    }
  };

  // Confirm transfer (initiate payin, create transaction)
  const confirmTransfer = async (confirmData: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/transfer/confirm`, {
        method: 'POST',
        headers: Object.assign({}, getAuthHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify(confirmData),
      });
      if (!res.ok) throw new Error('Failed to initiate transfer');
      const data = await res.json();
      setTransaction(data);
      setLoading(false);
      return data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to initiate transfer');
      throw err;
    }
  };

  // Get transaction status (stub)
  const getTransactionStatus = async (transactionId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/transfer/transaction/${transactionId}`, {
        method: 'GET',
        headers: Object.assign({}, getAuthHeaders(), {}),
      });
      if (!res.ok) throw new Error('Failed to get transaction status');
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error('Error getting transaction status:', err);
      throw err;
    }
  };

  return {
    loading,
    error,
    preview,
    transaction,
    previewTransfer,
    confirmTransfer,
    getTransactionStatus,
  };
}

// Helper function to generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function linkWallet({ wallet_address, wallet_network }: { wallet_address: string; wallet_network: string }) {
  console.log('linkWallet called with:', { wallet_address, wallet_network });

  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('No auth token found');
    throw new Error('Not authenticated');
  }

  console.log('Making request to:', `${API_BASE_URL}/client/link-wallet`);
  console.log('Request payload:', { wallet_address, wallet_network });

  const res = await fetch(`${API_BASE_URL}/client/link-wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ wallet_address, wallet_network }),
  });

  console.log('Response status:', res.status);
  console.log('Response headers:', Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    let errorMsg = 'Failed to link wallet';
    try {
      const err = await res.json();
      errorMsg = err.message || errorMsg;
      console.error('Error response:', err);
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }
    throw new Error(errorMsg);
  }

  const result = await res.json();
  console.log('linkWallet success result:', result);
  return result;
}

export async function resetClientWallet({
  client_id,
  reason,
  support_agent_id
}: {
  client_id: string;
  reason?: string;
  support_agent_id?: string;
}) {
  console.log('resetClientWallet called with:', { client_id, reason, support_agent_id });

  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('No auth token found');
    throw new Error('Not authenticated');
  }

  console.log('Making request to:', `${API_BASE_URL}/client/reset-wallet`);
  console.log('Request payload:', { client_id, reason, support_agent_id });

  const res = await fetch(`${API_BASE_URL}/client/reset-wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ client_id, reason, support_agent_id }),
  });

  console.log('Response status:', res.status);
  console.log('Response headers:', Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    let errorMsg = 'Failed to reset wallet';
    try {
      const err = await res.json();
      errorMsg = err.message || errorMsg;
      console.error('Error response:', err);
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }
    throw new Error(errorMsg);
  }

  const result = await res.json();
  console.log('resetClientWallet success result:', result);
  return result;
}

export async function approveTransaction({
  transaction_id,
  wallet_address,
  reason
}: {
  transaction_id: string;
  wallet_address: string;
  reason?: string;
}) {
  console.log('approveTransaction called with:', { transaction_id, wallet_address, reason });

  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('No auth token found');
    throw new Error('Not authenticated');
  }

  // First, get the transaction details to check if token approval is needed
  console.log('Getting transaction details for approval...');
  const transactionRes = await fetch(`${API_BASE_URL}/transfer/transaction/${transaction_id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!transactionRes.ok) {
    let errorMsg = 'Failed to get transaction details';
    try {
      const err = await transactionRes.json();
      errorMsg = err.message || errorMsg;
      console.error('Transaction details error response:', err);
    } catch (e) {
      console.error('Failed to parse transaction details error response:', e);
    }
    throw new Error(errorMsg);
  }

  const transaction = await transactionRes.json();
  console.log('Transaction details for approval:', transaction);

  // Check if the transaction has payout quote data that requires token approval
  const payoutQuoteData = transaction.metadata?.payout_quote_data;
  if (payoutQuoteData?.contract) {
    console.log('Transaction requires token approval:', {
      contractAddress: payoutQuoteData.contract.address,
      blindpayContractAddress: payoutQuoteData.contract.blindpayContractAddress,
      amount: payoutQuoteData.contract.amount,
      network: payoutQuoteData.contract.network
    });

    // Return the approval data so the frontend can handle the token approval
    return {
      requiresTokenApproval: true,
      approvalData: {
        contractAddress: payoutQuoteData.contract.address,
        blindpayContractAddress: payoutQuoteData.contract.blindpayContractAddress,
        amount: payoutQuoteData.contract.amount,
        network: payoutQuoteData.contract.network,
        transaction_id,
        wallet_address,
        reason
      }
    };
  }

  // If no token approval needed, proceed with the approval directly
  console.log('No token approval required, proceeding with transaction approval');
  console.log('Making request to:', `${API_BASE_URL}/transfer/approve`);
  console.log('Request payload:', { transaction_id, wallet_address, reason });

  const res = await fetch(`${API_BASE_URL}/transfer/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ transaction_id, wallet_address, reason }),
  });

  console.log('Response status:', res.status);
  console.log('Response headers:', Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    let errorMsg = 'Failed to approve transaction';
    try {
      const err = await res.json();
      errorMsg = err.message || errorMsg;
      console.error('Error response:', err);
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }
    throw new Error(errorMsg);
  }

  const result = await res.json();
  console.log('approveTransaction success result:', result);
  return result;
}

export async function completeTransactionApproval({
  transaction_id,
  wallet_address,
  reason
}: {
  transaction_id: string;
  wallet_address: string;
  reason?: string;
}) {
  console.log('completeTransactionApproval called with:', { transaction_id, wallet_address, reason });

  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('No auth token found');
    throw new Error('Not authenticated');
  }

  console.log('Making request to:', `${API_BASE_URL}/transfer/approve`);
  console.log('Request payload:', { transaction_id, wallet_address, reason });

  const res = await fetch(`${API_BASE_URL}/transfer/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ transaction_id, wallet_address, reason }),
  });

  console.log('Response status:', res.status);
  console.log('Response headers:', Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    let errorMsg = 'Failed to approve transaction';
    try {
      const err = await res.json();
      errorMsg = err.message || errorMsg;
      console.error('Error response:', err);
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }
    throw new Error(errorMsg);
  }

  const result = await res.json();
  console.log('completeTransactionApproval success result:', result);
  return result;
}

export async function manuallyCompleteTransaction({
  transaction_id,
  payout_id
}: {
  transaction_id: string;
  payout_id?: string;
}): Promise<any> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.error('No auth token found');
    throw new Error('Not authenticated');
  }

  console.log('manuallyCompleteTransaction called with:', { transaction_id, payout_id });

  try {
    const response = await fetch(`${API_BASE_URL}/transfer/complete/${transaction_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        payoutId: payout_id
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to manually complete transaction');
    }

    const result = await response.json();
    console.log('manuallyCompleteTransaction success result:', result);
    return result;
  } catch (error) {
    console.error('Error in manuallyCompleteTransaction:', error);
    throw error;
  }
}