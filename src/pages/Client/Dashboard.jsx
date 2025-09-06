import React from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  ArrowRightIcon,
  UserIcon,
  ClockIcon,
  DollarSignIcon,
} from 'lucide-react'
const ClientDashboard = () => {
  // Mock data
  const activeJobs = [
    {
      id: 1,
      title: 'Website Redesign for E-commerce Store',
      budget: '$1,500',
      deadline: 'Aug 30, 2023',
      bids: 8,
      status: 'active',
    },
    {
      id: 2,
      title: 'Mobile App UI Design',
      budget: '$2,000',
      deadline: 'Sep 15, 2023',
      bids: 5,
      status: 'active',
    },
  ]
  const completedJobs = [
    {
      id: 3,
      title: 'Logo Design for Tech Startup',
      budget: '$500',
      completedDate: 'Jul 10, 2023',
      freelancer: 'Alex Johnson',
      rating: 4.8,
    },
  ]
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your projects and find talented freelancers
          </p>
        </div>
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/client/post-job"
            className="flex items-center justify-between bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700"
          >
            <div>
              <h3 className="text-lg font-medium">Post a New Job</h3>
              <p className="text-blue-100 text-sm">Create a new project</p>
            </div>
            <PlusIcon className="h-6 w-6" />
          </Link>
          <Link
            to="/client/my-jobs"
            className="flex items-center justify-between bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900">My Jobs</h3>
              <p className="text-gray-500 text-sm">View all your projects</p>
            </div>
            <ArrowRightIcon className="h-6 w-6 text-gray-400" />
          </Link>
          <Link
            to="/client/find-freelancers"
            className="flex items-center justify-between bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Find Freelancers
              </h3>
              <p className="text-gray-500 text-sm">Browse top talent</p>
            </div>
            <ArrowRightIcon className="h-6 w-6 text-gray-400" />
          </Link>
        </div>
        {/* Active Jobs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-medium text-gray-900">Active Jobs</h2>
          </div>
          {activeJobs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {activeJobs.map((job) => (
                <div key={job.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <Link
                        to={`/client/jobs/${job.id}`}
                        className="text-lg font-medium text-blue-600 hover:text-blue-700"
                      >
                        {job.title}
                      </Link>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center text-gray-500">
                          <DollarSignIcon className="h-4 w-4 mr-1" />
                          <span>{job.budget}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>Due {job.deadline}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <UserIcon className="h-4 w-4 mr-1" />
                          <span>{job.bids} bids</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex">
                      <Link
                        to={`/client/jobs/${job.id}`}
                        className="px-4 py-2 bg-blue-100 text-blue-600 rounded-md font-medium hover:bg-blue-200"
                      >
                        View Bids
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">You don't have any active jobs.</p>
              <Link
                to="/client/post-job"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Post a Job
              </Link>
            </div>
          )}
        </div>
        {/* Recently Completed */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-medium text-gray-900">
              Recently Completed
            </h2>
          </div>
          {completedJobs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {completedJobs.map((job) => (
                <div key={job.id} className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <Link
                        to={`/client/jobs/${job.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600"
                      >
                        {job.title}
                      </Link>
                      <div className="flex flex-wrap gap-4 mt-2">
                        <div className="flex items-center text-gray-500">
                          <DollarSignIcon className="h-4 w-4 mr-1" />
                          <span>{job.budget}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>Completed {job.completedDate}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <UserIcon className="h-4 w-4 mr-1" />
                          <span>{job.freelancer}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                You don't have any completed jobs yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default ClientDashboard
