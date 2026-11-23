import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const refetch = () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // In a real app, this would be a call to the Supabase API
    // For now, we'll use mock data from our hooks/useDatabase.ts
    try {
      // Get notifications from the mock data in useDatabase.ts
      const mockNotifications = getMockNotifications(user.id);
      
      // Sort by created_at descending (newest first)
      mockNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch notifications');
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    
    // Set up polling for new notifications
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      // In a real app, this would be a call to the Supabase API
      // For now, we'll update our local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      setError('Failed to mark notification as read');
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      // In a real app, this would be a call to the Supabase API
      // For now, we'll update our local state
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      setError('Failed to mark all notifications as read');
      return false;
    }
  };

  return { 
    notifications, 
    loading, 
    error, 
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch
  };
}

// Mock data function - this would be replaced by actual API calls
function getMockNotifications(userId: string): Notification[] {
  // This is a simplified version - in a real app, this would come from the database
  return [
    {
      id: 'n1',
      user_id: userId,
      msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: 'transaction_approved',
      title: 'Transaction Approved',
      message: 'Your transaction of $2,500.00 has been approved and processed.',
      data: {
        transaction_id: 'txn11111-1111-1111-1111-111111111111',
        amount: 2500.00,
        transaction_number: 'TXN-FT-001'
      },
      read: false,
      created_at: new Date(Date.now() - 5 * 60000).toISOString() // 5 minutes ago
    },
    {
      id: 'n2',
      user_id: userId,
      msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: 'kyc_update',
      title: 'KYC Status Updated',
      message: 'Your KYC verification status has been updated to Approved.',
      data: {
        previous_status: 'pending',
        new_status: 'approved'
      },
      read: true,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString() // 2 hours ago
    },
    {
      id: 'n3',
      user_id: userId,
      msb_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: 'account_statement',
      title: 'New Statement Available',
      message: 'Your monthly account statement for January 2024 is now available.',
      data: {
        statement_id: 'stmt1111-1111-1111-1111-111111111111',
        period: 'January 2024'
      },
      read: false,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString() // 1 day ago
    }
  ];
}