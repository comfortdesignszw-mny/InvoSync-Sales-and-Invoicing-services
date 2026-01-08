
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  DashboardIcon, InventoryIcon, InvoiceIcon, QuoteIcon, 
  SettingsIcon, ClientIcon, ShoppingCartIcon, XIcon 
} from '../Icons.tsx';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useStore } from '../../hooks/useStore.ts';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { path: '/clients', label: 'Clients', icon: ClientIcon },
  { path: '/inventory', label: 'Inventory', icon: InventoryIcon },
  { path: '/cart', label: 'Cart / Orders', icon: ShoppingCartIcon, badge: true },
  { path: '/invoices', label: 'Invoices', icon: InvoiceIcon },
  { path: '/quotes', label: 'Quotations', icon: QuoteIcon },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { state } = useStore();

  const handleLogout = () => {
    logout();
    onClose();
  };

  const cartCount = state.cart.length;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-sidebar text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl`}
      >
        <div className="h-20 flex items-center justify-between px-6 bg-sidebar-accent border-b border-gray-700">
          <h1 className="text-2xl font-bold tracking-wider">InvoSync</h1>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-700 bg-sidebar-accent/50">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-lg border-2 border-primary/20">
                    {user?.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
            </div>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-gray-300 hover:bg-sidebar-accent hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-6 h-6" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && cartCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700 bg-sidebar-accent/30">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Logout</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
