import React from 'react'
import { Link } from 'react-router-dom'
import {
  SearchIcon,
  ZapIcon,
  TrendingUpIcon,
  DollarSignIcon,
  ClockIcon,
  StarIcon,
} from 'lucide-react'
const FreelancerDashboard = () => {
  // Mock data
  const activeBids = [
    {
      id: 1,
      jobTitle: 'Website Redesign for E-commerce Store',
      clientName: 'Global Retail Inc.',
      budget: '$1,500',
      bidAmount: '$1,400',
      deadline: 'Aug 30, 2023',
      aiMatchScore: 95,
    },
    {
      id: 2,
      jobTitle: 'Mobile App UI Design',
      clientName: 'TechStart Solutions',
      budget: '$2,000',
      bidAmount: '$1,900',
      deadline: 'Sep 15, 2023',
      aiMatchScore: 88,
    },
  ]
  const recommendedJobs = [
    {
      id: 3,
      title: 'WordPress Blog Development',
      clientName: 'Media Publishing Co.',
      budget: '$800',
      deadline: 'Sep 5, 2023',
      aiMatchScore: 97,
      postedDate: '2 days ago',
    },
    {
      id: 4,
      title: 'E-commerce Product Page Design',
      clientName: 'Fashion Brand',
      budget: '$1,200',
      deadline: 'Sep 20, 2023',
      aiMatchScore: 92,
      postedDate: '5 hours ago',
    },
    {
      id: 5,
      title: 'React Dashboard Development',
      clientName: 'Analytics Startup',
      budget: '$2,500',
      deadline: 'Oct 10, 2023',
      aiMatchScore: 94,
      postedDate: 'Just now',
    },
  ]
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Freelancer Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Find jobs that match your skills and experience
          </p>
        </div>
        {/* Quick Search */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-grow">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 py-3 border-gray-300 rounded-md"
                  placeholder="Search for jobs by keyword, skill, or category"
                />
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link
                to="/freelancer/browse-jobs"
                className="w-full md:w-auto flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Find Jobs
              </Link>
            </div>
          </div>
        </div>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUpIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Bids</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeBids.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSignIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Earnings This Month
                </p>
                <p className="text-2xl font-semibold text-gray-900">$3,250</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <StarIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Your Rating</p>
                <p className="text-2xl font-semibold text-gray-900">4.9/5.0</p>
              </div>
            </div>
          </div>
        </div>
        {/* Recommended Jobs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-medium text-gray-900">
              Recommended Jobs
            </h2>
            <div className="flex items-center text-sm text-gray-500">
              <ZapIcon className="h-4 w-4 text-blue-500 mr-1" />
              <span>AI-matched for your profile</span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recommendedJobs.map((job) => (
              <div key={job.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center">
                      <Link
                        to={`/freelancer/jobs/${job.id}`}
                        className="text-lg font-medium text-blue-600 hover:text-blue-700"
                      >
                        {job.title}
                      </Link>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {job.aiMatchScore}% Match
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {job.clientName}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex items-center text-gray-500">
                        <DollarSignIcon className="h-4 w-4 mr-1" />
                        <span>{job.budget}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>Due {job.deadline}</span>
                      </div>
                      <div className="text-gray-500 text-sm">
                        Posted {job.postedDate}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Link
                      to={`/freelancer/jobs/${job.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      View Job
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Link
              to="/freelancer/browse-jobs"
              className="text-blue-600 hover:text-blue-500 font-medium flex items-center"
            >
              View all recommended jobs
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
        {/* Active Bids */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-medium text-gray-900">Active Bids</h2>
          </div>
          {activeBids.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {activeBids.map((bid) => (
                <div key={bid.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <Link
                        to={`/freelancer/bids/${bid.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600"
                      >
                        {bid.jobTitle}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {bid.clientName}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center text-gray-500">
                          <DollarSignIcon className="h-4 w-4 mr-1" />
                          <span>Budget: {bid.budget}</span>
                        </div>
                        <div className="flex items-center text-green-600 font-medium">
                          <DollarSignIcon className="h-4 w-4 mr-1" />
                          <span>Your Bid: {bid.bidAmount}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>Due {bid.deadline}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">You don't have any active bids.</p>
              <Link
                to="/freelancer/browse-jobs"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
              >
                <SearchIcon className="h-5 w-5 mr-2" />
                Find Jobs to Bid On
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default FreelancerDashboard
