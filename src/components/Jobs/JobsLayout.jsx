import React, { useState } from 'react';
import { Search, Bookmark, FileText, Plus, User, Bell, Menu, X } from 'lucide-react';

const JobsLayout = ({ user, currentView, onViewChange, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isClient = user?.account_types?.includes('client') || user?.user_type === 'client';
  const isFreelancer = user?.account_types?.includes('freelancer') || user?.user_type === 'freelancer';

  const navigationItems = [
    { 
      id: 'browse', 
      label: 'Browse Jobs', 
      icon: Search, 
      show: true,
      description: 'Find opportunities'
    },
    { 
      id: 'saved', 
      label: 'Saved Jobs', 
      icon: Bookmark, 
      show: isFreelancer,
      description: 'Your bookmarked jobs'
    },
    { 
      id: 'my-jobs', 
      label: 'My Jobs', 
      icon: FileText, 
      show: isClient,
      description: 'Manage your postings'
    },
    { 
      id: 'post-job', 
      label: 'Post Job', 
      icon: Plus, 
      show: isClient,
      description: 'Create new job posting'
    },
  ];

  const handleViewChange = (viewId) => {
    onViewChange(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Quick Action Floating Button (Mobile) */}
      {user && isClient && currentView !== 'post-job' && (
        <button
          onClick={() => handleViewChange('post-job')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors sm:hidden flex items-center justify-center"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              © 2024 Jobs Portal. Find your next opportunity.
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <button className="hover:text-gray-700">Help</button>
              <button className="hover:text-gray-700">Terms</button>
              <button className="hover:text-gray-700">Privacy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default JobsLayout;