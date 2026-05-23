import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import SignInPage from './components/SignInPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import HeroSection from './components/HeroSection';
import ExperienceSection from './components/ExperienceSection';
import SkillsSection from './components/SkillsSection';
import EducationSection from './components/EducationSection';
import ProjectsSection from './components/ProjectsSection';
import MessagesSection from './components/MessagesSection';
import BlogSection from './components/BlogSection';
import ReviewSection from './components/ReviewSection';
import CommunitySection from './components/CommunitySection';

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-500"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInPage />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'hero':
        return <HeroSection />;
      case 'experience':
        return <ExperienceSection />;
      case 'skills':
        return <SkillsSection />;
      case 'education':
        return <EducationSection />;
      case 'projects':
        return <ProjectsSection />;
      case 'messages':
        return <MessagesSection />;
      case 'blog':
        return <BlogSection />;
      case 'reviews':
        return <ReviewSection />;
      case 'community':
        return <CommunitySection />;
      default:
        return <HeroSection />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--admin-bg)' }}>
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '28px 36px', background: 'var(--admin-bg)' }}
        >
          <div style={{ maxWidth: '100%' }}>
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;