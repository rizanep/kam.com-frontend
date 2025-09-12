import React from 'react';
import { Search, Bookmark, FileText, Plus, User, Bell } from 'lucide-react';

const JobsLayout = ({ user, currentView, onViewChange, children }) => {
  const isClient = user?.account_types?.includes('client');
  const isFreelancer = user?.account_types?.includes('freelancer');

  const navigationItems = [
    { id: 'browse', label: 'Browse Jobs', icon: Search, show: true },
    { id: 'saved', label: 'Saved Jobs', icon: Bookmark, show: isFreelancer },
    { id: 'my-jobs', label: 'My Jobs', icon: FileText, show: isClient },
    { id: 'post-job', label: 'Post Job', icon: Plus, show: isClient },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Jobs Portal</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <button className="p-2 text-gray-600 hover:text-gray-900">
                    <Bell size={20} />
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {user.profile_picture ? (
                        <img 
                          src={user.profile_picture.startsWith('http') 
                            ? user.profile_picture 
                            : `http://localhost:8000${user.profile_picture}`}
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-blue-600" />
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">
                        {user.first_name} {user.last_name}
                      </span>
                      <div className="text-xs text-gray-500">
                        {user.account_types?.join(', ') || 'User'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => window.location.href = '/register'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {navigationItems.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export { JobsLayout };