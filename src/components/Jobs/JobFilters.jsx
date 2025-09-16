import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, X, Calendar, DollarSign, MapPin } from 'lucide-react';

const JobFilters = ({ filters, onFiltersChange, categories, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters };
    
    // Handle special cases
    if (key === 'salary_range') {
      const [min, max] = value.split('-');
      newFilters.min_budget = min || '';
      newFilters.max_budget = max || '';
    } else if (key === 'date_posted') {
      const today = new Date();
      let startDate = '';
      
      switch (value) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate = monthAgo.toISOString().split('T')[0];
          break;
        default:
          startDate = '';
      }
      
      newFilters.posted_after = startDate;
    } else {
      newFilters[key] = value;
    }
    
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value && value !== '' && value !== false && value !== 'all'
  ).length;

  const getFilterDisplayValue = (key, value) => {
    switch (key) {
      case 'category':
        const category = categories.find(cat => cat.id === value);
        return category ? category.name : value;
      case 'job_type':
        return value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      case 'experience_level':
        return value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      case 'remote_only':
        return 'Remote Only';
      case 'featured_only':
        return 'Featured Only';
      case 'urgent_only':
        return 'Urgent Only';
      default:
        return value;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <span className="font-medium text-gray-900">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-200 space-y-6">
          {/* Quick Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Filters</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'remote_only', label: 'Remote Only', icon: MapPin },
                { key: 'featured_only', label: 'Featured', icon: null },
                { key: 'urgent_only', label: 'Urgent', icon: null },
                { key: 'has_deadline', label: 'Has Deadline', icon: Calendar },
              ].map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.key}
                    onClick={() => handleFilterChange(filter.key, !filters[filter.key])}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filters[filter.key]
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={isLoading}
                  >
                    {Icon && <Icon size={14} />}
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.jobs_count && `(${cat.jobs_count})`}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Job Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                value={filters.job_type || ''}
                onChange={(e) => handleFilterChange('job_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">All Types</option>
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly</option>
                <option value="milestone">Milestone</option>
              </select>
            </div>
            
            {/* Experience Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={filters.experience_level || ''}
                onChange={(e) => handleFilterChange('experience_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
                <option value="any">Any Level</option>
              </select>
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1">
              <DollarSign size={16} />
              Budget Range
            </h4>
            <div className="space-y-3">
              {/* Preset Budget Ranges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: 'Under $500', value: '0-500' },
                  { label: '$500 - $1K', value: '500-1000' },
                  { label: '$1K - $5K', value: '1000-5000' },
                  { label: '$5K+', value: '5000-' }
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => handleFilterChange('salary_range', range.value)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      (filters.min_budget && filters.max_budget && 
                       `${filters.min_budget}-${filters.max_budget}` === range.value) ||
                      (filters.min_budget && !filters.max_budget && range.value.endsWith('-') &&
                       filters.min_budget === range.value.split('-')[0])
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    disabled={isLoading}
                  >
                    {range.label}
                  </button>
                ))}
              </div>

              {/* Custom Budget Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Budget ($)</label>
                  <input
                    type="number"
                    value={filters.min_budget || ''}
                    onChange={(e) => handleFilterChange('min_budget', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    disabled={isLoading}
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Budget ($)</label>
                  <input
                    type="number"
                    value={filters.max_budget || ''}
                    onChange={(e) => handleFilterChange('max_budget', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                    disabled={isLoading}
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date Posted Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1">
              <Calendar size={16} />
              Posted Date
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Today', value: 'today' },
                { label: 'This Week', value: 'week' },
                { label: 'This Month', value: 'month' },
                { label: 'Any Time', value: '' }
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => handleFilterChange('date_posted', period.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    (period.value === '' && !filters.posted_after) ||
                    (period.value !== '' && filters.posted_after)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={isLoading}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project Duration Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Project Duration</h4>
            <select
              value={filters.estimated_duration || ''}
              onChange={(e) => handleFilterChange('estimated_duration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">Any Duration</option>
              <option value="less_than_week">Less than a week</option>
              <option value="1_to_4_weeks">1 to 4 weeks</option>
              <option value="1_to_3_months">1 to 3 months</option>
              <option value="3_to_6_months">3 to 6 months</option>
              <option value="more_than_6_months">More than 6 months</option>
            </select>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Active Filters</h4>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  <X size={14} />
                  Clear all
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters)
                  .filter(([key, value]) => value && value !== '' && value !== false && value !== 'all')
                  .map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                    >
                      {getFilterDisplayValue(key, value)}
                      <button
                        onClick={() => handleFilterChange(key, '')}
                        className="hover:text-blue-900"
                        disabled={isLoading}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Apply/Reset Buttons */}
          <div className="pt-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Apply Filters
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobFilters;