// import React, { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import {
//   ArrowRight,
//   CheckCircle,
//   TrendingUp,
//   Zap,
//   Shield,
//   Star,
//   PlayCircle,
//   Users,
//   Briefcase,
//   DollarSign,
//   Clock,
//   ZapIcon,
//   ArrowRightIcon,
//   BriefcaseIcon,
//   CheckCircleIcon,
//   ShieldIcon,
//   TrendingUpIcon,
//   StarIcon,
//   UsersIcon,
//   DollarSignIcon,
//   PlayCircleIcon
// } from 'lucide-react'

// // Counter Animation Hook
// const useCounter = (end, duration = 2000, start = 0) => {
//   const [count, setCount] = useState(start)
  
//   useEffect(() => {
//     const startTime = Date.now()
//     const timer = setInterval(() => {
//       const elapsed = Date.now() - startTime
//       const progress = Math.min(elapsed / duration, 1)
//       const currentCount = Math.floor(progress * (end - start) + start)
//       setCount(currentCount)
      
//       if (progress === 1) {
//         clearInterval(timer)
//       }
//     }, 16)
    
//     return () => clearInterval(timer)
//   }, [end, duration, start])
  
//   return count
// }

// // Stats Counter Component
// const StatCounter = ({ icon: Icon, value, label, suffix = "", className = "" }) => {
//   const count = useCounter(value)
  
//   return (
//     <div className={`text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 ${className}`}>
//       <div className="flex justify-center mb-3">
//         <div className="p-3 bg-white/20 rounded-full">
//           <Icon className="h-8 w-8 text-white" />
//         </div>
//       </div>
//       <div className="text-3xl font-bold text-white mb-1">
//         {count.toLocaleString()}{suffix}
//       </div>
//       <div className="text-blue-100 text-sm font-medium">{label}</div>
//     </div>
//   )
// }

// // Testimonial Card Component
// const TestimonialCard = ({ name, role, company, content, rating, avatar }) => (
//   <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
//     <div className="flex items-center mb-4">
//       {[...Array(5)].map((_, i) => (
//         <StarIcon
//           key={i}
//           className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
//         />
//       ))}
//     </div>
//     <p className="text-gray-600 mb-6 leading-relaxed">"{content}"</p>
//     <div className="flex items-center">
//       <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
//         {avatar}
//       </div>
//       <div>
//         <div className="font-semibold text-gray-900">{name}</div>
//         <div className="text-sm text-gray-500">{role} at {company}</div>
//       </div>
//     </div>
//   </div>
// )

// // Feature Card with Animation
// const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
//   <div 
//     className="flex gap-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100 transform transition-all duration-500 hover:scale-105 hover:shadow-lg"
//     style={{ animationDelay: `${delay}ms` }}
//   >
//     <div className="flex-shrink-0">
//       <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-xl flex items-center justify-center transform transition-transform duration-300 hover:rotate-12">
//         <Icon className="h-6 w-6" />
//       </div>
//     </div>
//     <div>
//       <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
//       <p className="text-gray-600 leading-relaxed">{description}</p>
//     </div>
//   </div>
// )

// const LandingPage = () => {
//   const [isVisible, setIsVisible] = useState(false)

//   useEffect(() => {
//     setIsVisible(true)
//   }, [])

//   const testimonials = [
//     {
//       name: "Sarah Johnson",
//       role: "Marketing Director",
//       company: "TechCorp",
//       content: "kam.com helped us find amazing developers for our mobile app. The quality of freelancers and the bidding process made it easy to stay within budget.",
//       rating: 5,
//       avatar: "SJ"
//     },
//     {
//       name: "Michael Chen",
//       role: "Freelance Developer",
//       company: "Independent",
//       content: "I've completed over 50 projects on kam.com. The AI matching system consistently connects me with projects that match my skills perfectly.",
//       rating: 5,
//       avatar: "MC"
//     },
//     {
//       name: "Emily Rodriguez",
//       role: "Startup Founder",
//       company: "GrowthLab",
//       content: "The quality assurance and secure payment system gave us confidence to hire remotely. Our logo design project exceeded all expectations.",
//       rating: 5,
//       avatar: "ER"
//     }
//   ]

//   return (
//     <div className="w-full overflow-hidden">
//       {/* Hero Section with Enhanced Animations */}
//       <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white overflow-hidden">
//         {/* Animated Background Elements */}
//         <div className="absolute inset-0">
//           <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
//           <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
//           <div className="absolute -bottom-32 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
//         </div>

//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
//             <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
//               <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
//                 <ZapIcon className="h-4 w-4 mr-2" />
//                 AI-Powered Freelance Platform
//               </div>
              
//               <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
//                 Find the Perfect
//                 <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-300 animate-pulse">
//                   Freelancer
//                 </span>
//                 at Your Budget
//               </h1>
              
//               <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
//                 Post your project with a fixed budget and let qualified
//                 freelancers bid for your work. Our AI matches you with the best
//                 talent worldwide.
//               </p>
              
//               <div className="flex flex-col sm:flex-row gap-4 mb-8">
//                 <Link
//                   to="/register?role=client"
//                   className="group px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl text-center transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
//                 >
//                   <span className="flex items-center justify-center">
//                     Hire a Freelancer
//                     <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
//                   </span>
//                 </Link>
//                 <Link
//                   to="/register?role=freelancer"
//                   className="group px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-xl text-center border border-white/20 transform transition-all duration-300 hover:scale-105"
//                 >
//                   <span className="flex items-center justify-center">
//                     Find Work
//                     <BriefcaseIcon className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
//                   </span>
//                 </Link>
//               </div>

//               {/* Trust Indicators */}
//               <div className="flex flex-wrap items-center gap-6 text-sm text-blue-100">
//                 <div className="flex items-center">
//                   <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
//                   Verified Freelancers
//                 </div>
//                 <div className="flex items-center">
//                   <ShieldIcon className="h-5 w-5 mr-2 text-green-400" />
//                   Secure Payments
//                 </div>
//                 <div className="flex items-center">
//                   <StarIcon className="h-5 w-5 mr-2 text-green-400 fill-current" />
//                   5-Star Support
//                 </div>
//               </div>
//             </div>

//             <div className={`hidden md:block transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
//               <div className="relative">
//                 <img
//                   src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
//                   alt="Team collaboration"
//                   className="rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
//                 />
                
//                 {/* Floating Stats Cards */}
//                 <div className="absolute -top-6 -left-6 animate-bounce">
//                   <div className="bg-white p-4 rounded-xl shadow-lg">
//                     <div className="flex items-center">
//                       <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
//                         <CheckCircleIcon className="h-5 w-5 text-green-600" />
//                       </div>
//                       <div>
//                         <div className="text-sm font-semibold text-gray-900">Project Completed</div>
//                         <div className="text-xs text-gray-500">+$2,500 earned</div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="absolute -bottom-6 -right-6 animate-bounce" style={{animationDelay: '1s'}}>
//                   <div className="bg-white p-4 rounded-xl shadow-lg">
//                     <div className="flex items-center">
//                       <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
//                         <UsersIcon className="h-5 w-5 text-blue-600" />
//                       </div>
//                       <div>
//                         <div className="text-sm font-semibold text-gray-900">New Bid Received</div>
//                         <div className="text-xs text-gray-500">3 minutes ago</div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Statistics Section */}
//           <div className={`mt-20 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//               <StatCounter icon={BriefcaseIcon} value={15420} label="Projects Completed" />
//               <StatCounter icon={UsersIcon} value={8750} label="Active Freelancers" />
//               <StatCounter icon={DollarSignIcon} value={2.5} suffix="M" label="Total Paid Out" />
//               <StatCounter icon={StarIcon} value={4.9} suffix="/5" label="Average Rating" />
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* How It Works Section */}
//       <section className="py-20 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4">
//               How kam.com Works
//             </h2>
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//               Our reverse auction platform connects clients with talented
//               freelancers through a simple, transparent process.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {[
//               {
//                 step: 1,
//                 title: "Post a Project",
//                 description: "Describe your project needs and set your budget. Be specific about requirements and timeline to attract the right talent.",
//                 color: "from-blue-500 to-purple-600"
//               },
//               {
//                 step: 2,
//                 title: "Receive Smart Bids",
//                 description: "Qualified freelancers will bid on your project. Our AI helps match you with the best talent based on skills and experience.",
//                 color: "from-purple-500 to-pink-600"
//               },
//               {
//                 step: 3,
//                 title: "Hire & Collaborate",
//                 description: "Review bids, choose the best freelancer, and work together using our collaboration tools until the project is completed.",
//                 color: "from-pink-500 to-red-600"
//               }
//             ].map((item, index) => (
//               <div 
//                 key={index}
//                 className="relative group transform transition-all duration-500 hover:scale-105"
//                 style={{ animationDelay: `${index * 200}ms` }}
//               >
//                 <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
//                   <div className={`h-16 w-16 bg-gradient-to-br ${item.color} text-white rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-300`}>
//                     <span className="text-2xl font-bold">{item.step}</span>
//                   </div>
//                   <h3 className="text-2xl font-semibold text-gray-900 mb-4">
//                     {item.title}
//                   </h3>
//                   <p className="text-gray-600 leading-relaxed">
//                     {item.description}
//                   </p>
//                 </div>
                
//                 {/* Connection Line */}
//                 {index < 2 && (
//                   <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-20 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4">
//               Platform Features
//             </h2>
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//               kam.com combines the best of traditional freelancing with
//               cutting-edge AI technology and modern collaboration tools.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//             <FeatureCard
//               icon={ZapIcon}
//               title="AI-Powered Matching"
//               description="Our intelligent algorithm matches freelancers with projects based on skills, experience, past performance, and compatibility scores."
//               delay={0}
//             />
//             <FeatureCard
//               icon={TrendingUpIcon}
//               title="Smart Bid Suggestions"
//               description="Freelancers receive AI-generated bid suggestions based on market rates, project complexity, and their historical success rates."
//               delay={100}
//             />
//             <FeatureCard
//               icon={ShieldIcon}
//               title="Secure Payments & Escrow"
//               description="Our advanced escrow system ensures clients only pay for satisfactory work and freelancers always get paid on time."
//               delay={200}
//             />
//             <FeatureCard
//               icon={CheckCircleIcon}
//               title="Quality Assurance"
//               description="All freelancers are vetted through our comprehensive screening process, ensuring you always get professional, high-quality work."
//               delay={300}
//             />
//           </div>
//         </div>
//       </section>

//       {/* Testimonials Section */}
//       <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-gray-900 mb-4">
//               What Our Users Say
//             </h2>
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//               Join thousands of satisfied clients and freelancers who trust kam.com
//               for their project needs.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {testimonials.map((testimonial, index) => (
//               <TestimonialCard key={index} {...testimonial} />
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white relative overflow-hidden">
//         {/* Animated Background */}
//         <div className="absolute inset-0">
//           <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
//           <div className="absolute bottom-10 right-10 w-32 h-32 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
//         </div>

//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
//           <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
//             Join thousands of clients and freelancers already using kam.com to
//             connect, collaborate, and create amazing projects together.
//           </p>

//           <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
//             <Link
//               to="/register"
//               className="group px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-xl inline-flex items-center justify-center transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
//             >
//               Sign Up Now 
//               <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
//             </Link>
//             <Link
//               to="/how-it-works"
//               className="group px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-xl inline-flex items-center justify-center border border-white/20 transform transition-all duration-300 hover:scale-105"
//             >
//               <PlayCircleIcon className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
//               Watch Demo
//             </Link>
//           </div>

//           {/* Final Stats */}
//           <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
//             <div className="text-center">
//               <div className="text-2xl font-bold text-white">24/7</div>
//               <div className="text-sm text-blue-100">Support Available</div>
//             </div>
//             <div className="text-center">
//               <div className="text-2xl font-bold text-white">99.9%</div>
//               <div className="text-sm text-blue-100">Uptime Guarantee</div>
//             </div>
//             <div className="text-center">
//               <div className="text-2xl font-bold text-white">48hrs</div>
//               <div className="text-sm text-blue-100">Average Response</div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   )
// }

// export default LandingPage



import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Zap,
  Shield,
  Star,
  PlayCircle,
  Users,
  Briefcase,
  DollarSign,
  Clock
} from 'lucide-react'

// Counter Animation Hook
const useCounter = (end, duration = 2000, start = 0) => {
  const [count, setCount] = useState(start)
  
  useEffect(() => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentCount = Math.floor(progress * (end - start) + start)
      setCount(currentCount)
      
      if (progress === 1) {
        clearInterval(timer)
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [end, duration, start])
  
  return count
}

// Stats Counter Component
const StatCounter = ({ icon: Icon, value, label, suffix = "", className = "" }) => {
  const count = useCounter(value)
  
  return (
    <div className={`text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 ${className}`}>
      <div className="flex justify-center mb-3">
        <div className="p-3 bg-white/20 rounded-full">
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-blue-100 text-sm font-medium">{label}</div>
    </div>
  )
}

// Testimonial Card Component
const TestimonialCard = ({ name, role, company, content, rating, avatar }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
    <div className="flex items-center mb-4">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
    <p className="text-gray-600 mb-6 leading-relaxed">"{content}"</p>
    <div className="flex items-center">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
        {avatar}
      </div>
      <div>
        <div className="font-semibold text-gray-900">{name}</div>
        <div className="text-sm text-gray-500">{role} at {company}</div>
      </div>
    </div>
  </div>
)

// Feature Card with Animation
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <div 
    className="flex gap-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100 transform transition-all duration-500 hover:scale-105 hover:shadow-lg"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex-shrink-0">
      <div className="h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-xl flex items-center justify-center transform transition-transform duration-300 hover:rotate-12">
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
)

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechCorp",
      content: "kam.com helped us find amazing developers for our mobile app. The quality of freelancers and the bidding process made it easy to stay within budget.",
      rating: 5,
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "Freelance Developer",
      company: "Independent",
      content: "I've completed over 50 projects on kam.com. The AI matching system consistently connects me with projects that match my skills perfectly.",
      rating: 5,
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "Startup Founder",
      company: "GrowthLab",
      content: "The quality assurance and secure payment system gave us confidence to hire remotely. Our logo design project exceeded all expectations.",
      rating: 5,
      avatar: "ER"
    }
  ]

  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section with Enhanced Animations */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute -bottom-32 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20">
                <Zap className="h-4 w-4 mr-2" />
                AI-Powered Freelance Platform
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Find the Perfect
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-300 animate-pulse">
                  Freelancer
                </span>
                at Your Budget
              </h1>
              
              <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
                Post your project with a fixed budget and let qualified
                freelancers bid for your work. Our AI matches you with the best
                talent worldwide.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/register?role=client"
                  className="group px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl text-center transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center">
                    Hire a Freelancer
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link
                  to="/register?role=freelancer"
                  className="group px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-xl text-center border border-white/20 transform transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center justify-center">
                    Find Work
                    <Briefcase className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  </span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-blue-100">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                  Verified Freelancers
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-400" />
                  Secure Payments
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-green-400 fill-current" />
                  5-Star Support
                </div>
              </div>
            </div>

            <div className={`hidden md:block transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                  alt="Team collaboration"
                  className="rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
                
                {/* Floating Stats Cards */}
                <div className="absolute -top-6 -left-6 animate-bounce">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Project Completed</div>
                        <div className="text-xs text-gray-500">+$2,500 earned</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-6 -right-6 animate-bounce" style={{animationDelay: '1s'}}>
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">New Bid Received</div>
                        <div className="text-xs text-gray-500">3 minutes ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className={`mt-20 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCounter icon={Briefcase} value={15420} label="Projects Completed" />
              <StatCounter icon={Users} value={8750} label="Active Freelancers" />
              <StatCounter icon={DollarSign} value={2.5} suffix="M" label="Total Paid Out" />
              <StatCounter icon={Star} value={4.9} suffix="/5" label="Average Rating" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How kam.com Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our reverse auction platform connects clients with talented
              freelancers through a simple, transparent process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Post a Project",
                description: "Describe your project needs and set your budget. Be specific about requirements and timeline to attract the right talent.",
                color: "from-blue-500 to-purple-600"
              },
              {
                step: 2,
                title: "Receive Smart Bids",
                description: "Qualified freelancers will bid on your project. Our AI helps match you with the best talent based on skills and experience.",
                color: "from-purple-500 to-pink-600"
              },
              {
                step: 3,
                title: "Hire & Collaborate",
                description: "Review bids, choose the best freelancer, and work together using our collaboration tools until the project is completed.",
                color: "from-pink-500 to-red-600"
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="relative group transform transition-all duration-500 hover:scale-105"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className={`h-16 w-16 bg-gradient-to-br ${item.color} text-white rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-300`}>
                    <span className="text-2xl font-bold">{item.step}</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                
                {/* Connection Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              kam.com combines the best of traditional freelancing with
              cutting-edge AI technology and modern collaboration tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              icon={Zap}
              title="AI-Powered Matching"
              description="Our intelligent algorithm matches freelancers with projects based on skills, experience, past performance, and compatibility scores."
              delay={0}
            />
            <FeatureCard
              icon={TrendingUp}
              title="Smart Bid Suggestions"
              description="Freelancers receive AI-generated bid suggestions based on market rates, project complexity, and their historical success rates."
              delay={100}
            />
            <FeatureCard
              icon={Shield}
              title="Secure Payments & Escrow"
              description="Our advanced escrow system ensures clients only pay for satisfactory work and freelancers always get paid on time."
              delay={200}
            />
            <FeatureCard
              icon={CheckCircle}
              title="Quality Assurance"
              description="All freelancers are vetted through our comprehensive screening process, ensuring you always get professional, high-quality work."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied clients and freelancers who trust kam.com
              for their project needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-10">
            Join thousands of clients and freelancers already using kam.com to
            connect, collaborate, and create amazing projects together.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-12">
            <Link
              to="/register"
              className="group px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-xl inline-flex items-center justify-center transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Sign Up Now 
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/how-it-works"
              className="group px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-xl inline-flex items-center justify-center border border-white/20 transform transition-all duration-300 hover:scale-105"
            >
              <PlayCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Link>
          </div>

          {/* Final Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm text-blue-100">Support Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-sm text-blue-100">Uptime Guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">48hrs</div>
              <div className="text-sm text-blue-100">Average Response</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage