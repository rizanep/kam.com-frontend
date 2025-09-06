import React from 'react'
import { Link } from 'react-router-dom'
const Footer = () => {
  return (
    <footer className="bg-white ">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900">BidWork</h3>
            <p className="mt-2 text-sm text-gray-500">
              The reverse auction platform where clients post jobs with a fixed
              budget, and freelancers bid to win the work.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">For Clients</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/how-it-works-clients"
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  How it Works
                </Link>
              </li>
              <li>
                <Link
                  to="/post-job"
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  Post a Job
                </Link>
              </li>
              <li>
                <Link
                  to="/find-freelancers"
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  Find Freelancers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              For Freelancers
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/how-it-works-freelancers"
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  How it Works
                </Link>
              </li>
              <li>
                <Link
                  to="/find-jobs"
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link
                  to="/success-stories"
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} BidWork. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
export default Footer
