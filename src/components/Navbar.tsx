import { UserButton, useUser } from '@clerk/clerk-react';
import { ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user } = useUser();

  return (
    <nav className="admin-topbar sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.3)' }}
        >
          <ShieldCheck size={15} style={{ color: '#7c6af7' }} />
        </div>
        <span
          className="font-bold text-sm tracking-tight"
          style={{ color: '#e8edf5' }}
        >
          SecureGarv
          <span style={{ color: '#7c6af7' }}> / Admin</span>
        </span>
      </div>

      <div className="flex-1" />

      {/* Right */}
      <div className="flex items-center gap-4">
        {user?.firstName && (
          <span className="text-xs hidden md:block" style={{ color: '#687081' }}>
            {user.firstName}
          </span>
        )}
        <div
          className="h-5 w-px"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        />
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-7 h-7',
            },
          }}
        />
      </div>
    </nav>
  );
}