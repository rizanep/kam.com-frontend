import React from 'react';
import { Loader2, Briefcase } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'medium', 
  text = '', 
  fullScreen = false, 
  overlay = false,
  variant = 'spinner',
  className = '',
  color = 'blue'
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12',
    xlarge: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'text-blue-600 border-blue-600',
    gray: 'text-gray-600 border-gray-600',
    green: 'text-green-600 border-green-600',
    red: 'text-red-600 border-red-600',
    purple: 'text-purple-600 border-purple-600',
    white: 'text-white border-white'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  // Different loading spinner variants
  const SpinnerVariant = () => (
    <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`} />
  );

  const DotsVariant = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${colorClasses[color].split(' ')[0].replace('text-', 'bg-')} animate-bounce`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );

  const PulseVariant = () => (
    <div className={`${sizeClasses[size]} rounded-full ${colorClasses[color].split(' ')[0].replace('text-', 'bg-')} animate-pulse`} />
  );

  const JobsVariant = () => (
    <div className="flex items-center space-x-2">
      <Briefcase className={`${sizeClasses[size]} ${colorClasses[color]} animate-bounce`} />
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-1 h-4 ${colorClasses[color].split(' ')[0].replace('text-', 'bg-')} animate-pulse`}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );

  const ProgressVariant = () => (
    <div className="w-full">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${colorClasses[color].split(' ')[0].replace('text-', 'bg-')} animate-pulse`} 
             style={{ width: '60%', animation: 'progress 2s ease-in-out infinite' }}>
        </div>
      </div>
      <style jsx>{`
        @keyframes progress {
          0% { width: 0% }
          50% { width: 70% }
          100% { width: 100% }
        }
      `}</style>
    </div>
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'dots': return <DotsVariant />;
      case 'pulse': return <PulseVariant />;
      case 'jobs': return <JobsVariant />;
      case 'progress': return <ProgressVariant />;
      default: return <SpinnerVariant />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderSpinner()}
      {text && (
        <p className={`${textSizeClasses[size]} ${colorClasses[color].split(' ')[0]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${overlay ? 'bg-black bg-opacity-50' : 'bg-white'}`}>
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
        {content}
      </div>
    );
  }

  return content;
};

// Specialized loading components for common use cases
export const JobsLoading = ({ text = 'Loading jobs...', ...props }) => (
  <LoadingSpinner variant="jobs" text={text} {...props} />
);

export const PageLoading = ({ text = 'Loading...', ...props }) => (
  <LoadingSpinner fullScreen overlay text={text} size="large" {...props} />
);

export const ButtonLoading = ({ text = '', ...props }) => (
  <LoadingSpinner size="small" text={text} className="inline-flex" {...props} />
);

export const CardLoading = ({ text = 'Loading...', ...props }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-8">
    <LoadingSpinner text={text} {...props} />
  </div>
);

export const TableLoading = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div 
            key={colIndex} 
            className="h-4 bg-gray-200 rounded animate-pulse flex-1"
            style={{ animationDelay: `${(rowIndex * columns + colIndex) * 0.1}s` }}
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonLoader = ({ 
  lines = 3, 
  showAvatar = false, 
  showButton = false,
  className = '' 
}) => (
  <div className={`animate-pulse ${className}`}>
    <div className="flex items-start space-x-4">
      {showAvatar && (
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      )}
      <div className="flex-1 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index}
            className={`h-4 bg-gray-200 rounded ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
        {showButton && (
          <div className="w-24 h-8 bg-gray-200 rounded mt-4"></div>
        )}
      </div>
    </div>
  </div>
);

// Loading states for specific job portal components
export const JobCardLoading = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="w-6 h-6 bg-gray-200 rounded"></div>
    </div>
    
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
    
    <div className="flex justify-between items-center">
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
);

export const JobDetailLoading = () => (
  <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
    {/* Header */}
    <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="flex gap-6 mb-4">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="flex gap-4">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-18"></div>
      </div>
    </div>
    
    {/* Description */}
    <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
    
    {/* Skills and Details */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-16"></div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default LoadingSpinner;