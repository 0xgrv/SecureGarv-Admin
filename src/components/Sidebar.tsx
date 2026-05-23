import { useState } from 'react';
import {
  FileText, Briefcase, GraduationCap, MessageSquare,
  Settings, Menu, X, Globe, Star, LayoutDashboard,
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const MENU_ITEMS = [
  { id: 'hero',      label: 'Home Content', icon: LayoutDashboard },
  { id: 'skills',    label: 'Skills',       icon: Settings },
  { id: 'education', label: 'Education',    icon: GraduationCap },
  { id: 'projects',  label: 'Projects',     icon: FileText },
  { id: 'experience',label: 'Experience',   icon: Briefcase },
  { id: 'community', label: 'Community',    icon: Globe },
  { id: 'blog',      label: 'Blog Posts',   icon: FileText },
  { id: 'reviews',   label: 'Reviews',      icon: Star },
  { id: 'messages',  label: 'Messages',     icon: MessageSquare },
] as const;

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNav = (id: string) => {
    onSectionChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-3.5 left-4 z-50 p-1.5 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen
          ? <X size={18} style={{ color: '#e8edf5' }} />
          : <Menu size={18} style={{ color: '#687081' }} />}
      </button>

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-0 lg:inset-auto lg:sticky lg:top-0 z-40
          admin-sidebar h-screen
          transition-transform duration-250 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ width: 220 }}
        aria-label="Admin navigation"
      >
        <div className="h-full flex flex-col p-4 overflow-y-auto">
          {/* Header spacer on mobile */}
          <div className="h-14 lg:hidden" />

          <nav className="flex flex-col gap-1 flex-1" role="navigation">
            {MENU_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className={`admin-nav-item ${activeSection === id ? 'active' : ''}`}
                aria-current={activeSection === id ? 'page' : undefined}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Bottom — version tag */}
          <div
            className="mt-4 pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-[10px]" style={{ color: '#3a4256', fontFamily: 'Space Mono, monospace' }}>
              SecureGarv Admin v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}