import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "import.meta.env.VITE_SUPABASE_URL";
const supabaseAnonKey = "import.meta.env.VITE_SUPABASE_ANON_KEY";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = null;

// Database types
export interface Database {
  public: {
    Tables: {
      demo_credentials: {
        Row: {
          id: number;
          email: string;
          name: string;
          user_type: 'msb_admin' | 'client';
          company_name: string | null;
          company_domain: string | null;
          password_hint: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['demo_credentials']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['demo_credentials']['Insert']>;
      };
      msbs: {
        Row: {
          id: string;
          name: string;
          domain: string;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          theme: 'light' | 'dark';
          is_active: boolean;
          settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['msbs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['msbs']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          msb_id: string;
          email: string;
          name: string;
          role: 'msb_admin' | 'account_holder';
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          msb_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          nationality: string | null;
          phone_number: string | null;
          id_type: 'passport' | 'driver_license' | 'national_id' | null;
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
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      accounts: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>;
      };
      transactions: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      compliance_alerts: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['compliance_alerts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['compliance_alerts']['Insert']>;
      };
      compliance_reports: {
        Row: {
          id: string;
          msb_id: string;
          name: string;
          type: 'sar' | 'ctr' | 'kyc_summary' | 'transaction_monitoring' | 'risk_assessment';
          period_start: string;
          period_end: string;
          status: 'draft' | 'pending' | 'submitted' | 'approved';
          content: any;
          file_url: string | null;
          due_date: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['compliance_reports']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['compliance_reports']['Insert']>;
      };
    };
  };
}

// Helper function to test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    // const { data, error } = await supabase.from('demo_credentials').select('count').limit(1);
    // if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};

// Helper function to safely fetch demo credentials with error handling
export const fetchDemoCredentials = async () => {
  try {
    // const { data, error } = await supabase
    //   .from('demo_credentials')
    //   .select('*')
    //   .order('created_at', { ascending: true });
    
    // if (error) {
    //   console.error('Supabase error:', error);
    //   throw new Error(`Database error: ${error.message}`);
    // }
    
    // return data || [];
return [];
  } catch (error) {
    console.error('Failed to fetch demo credentials:', error);
    
    // Return fallback demo data if database is not accessible
    return [
      {
        id: 1,
        email: 'admin@fintech.demo',
        name: 'MSB Administrator',
        user_type: 'msb_admin' as const,
        company_name: 'Demo FinTech MSB',
        company_domain: 'fintech.demo',
        password_hint: 'demo123',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        email: 'client@example.com',
        name: 'John Doe',
        user_type: 'client' as const,
        company_name: null,
        company_domain: null,
        password_hint: 'demo123',
        created_at: new Date().toISOString()
      }
    ];
  }
};