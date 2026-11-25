import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/apiFetch';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'msb_admin' | 'account_holder';
    msbId?: string;
    isActive: boolean;
    createdAt: string;
    lastLogin?: string;
    clientId?: string;
    passwordChanged?: boolean;
    wallet_address?: string;
    wallet_network?: string;
    blindpay_wallet_id?: string;
}

/**
 * Hook for managing users through the msb-admin/users endpoint
 */
export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchUsers = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await apiFetch('/msb-admin/users');
            setUsers(data.users || data || []);
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Error fetching users:', error);
            setError(error.message || 'Failed to fetch users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return {
        users,
        loading,
        error,
        refetch: fetchUsers,
    };
}
