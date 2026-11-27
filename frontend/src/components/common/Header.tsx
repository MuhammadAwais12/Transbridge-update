import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { useNotifications } from '../../hooks/useDatabase';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const { msb, branding } = useBranding();
  const { unreadCount } = useNotifications();

  const getHeaderTitle = () => {
    if (title) return title;
    
    if (user?.role === 'msb_admin') {
      return msb?.name ? `${msb.name} - MSB Dashboard` : 'MSB Dashboard';
    }
    
    return 'Banking Portal';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {msb?.branding?.logoUrl && (
            <img 
              src={msb.branding.logoUrl} 
              alt={msb.name}
              className="h-8 w-auto"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {getHeaderTitle()}
            </h1>
            {msb && user?.role === 'account_holder' && (
              <p className="text-sm text-gray-600">Welcome to {msb.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          {/* <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div> */}

          {/* Notifications */}
          {/* <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button> */}

          {/* Settings */}
          {/* {user?.role === 'msb_admin' && (
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          )} */}

          {/* User Menu */}
          <div className="flex items-center space-x-3 border-l pl-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">{user?.name}</span>
              <span className="text-xs text-gray-600 capitalize">
                {user?.role === 'msb_admin' ? 'MSB Admin' : 'Account Holder'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}