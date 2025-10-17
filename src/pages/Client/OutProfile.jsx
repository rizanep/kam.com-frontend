import React, { useState, useEffect, useContext } from 'react';
import { Star, MapPin, Calendar, ExternalLink, ChevronDown, ChevronUp, Globe, Linkedin, Github, Award, Briefcase, GraduationCap, Building, User, Shield, MessageCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext'; // Adjust path as needed

const PublicProfile = ({ apiBaseUrl = 'https://kamcomuser.duckdns.org:30443/api/auth' }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeAccountType, setActiveAccountType] = useState('freelancer');
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Get current logged-in user
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/profile/${userId}/`);
      
      if (!response.ok) {
        throw new Error('User not found');
      }
      
      const data = await response.json();
      setProfile(data);
      
      // Set initial active account type based on available types
      if (data.account_types && data.account_types.length > 0) {
        if (data.account_types.includes('freelancer')) {
          setActiveAccountType('freelancer');
        } else if (data.account_types.includes('client')) {
          setActiveAccountType('client');
        } else {
          setActiveAccountType(data.account_types[0]);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle message button click
  const handleMessageUser = () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/profile/${userId}` } });
      return;
    }

    // Build full name or username
    const recipientName = profile.full_name || 
                         (profile.first_name && profile.last_name 
                           ? `${profile.first_name} ${profile.last_name}` 
                           : profile.username);

    // Navigate to messages with profile context
    const params = new URLSearchParams({
      recipient: userId,
      name: recipientName,
      profilePicture: profile.profile_picture || '',
      messageType: 'direct',
      autoStart: 'true'
    });
    
    navigate(`/messages?${params.toString()}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'github': return <Github className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'freelancer': return <Briefcase className="w-4 h-4" />;
      case 'client': return <Building className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getAccountTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white min-h-screen p-6">
        <div className="animate-pulse">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-300 rounded mb-2 w-1/3"></div>
              <div className="h-6 bg-gray-300 rounded mb-2 w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-300 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-white min-h-screen p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-xl mb-2">Profile Not Found</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // Mock reviews data
  const mockReviews = [
    {
      id: 1,
      name: "John Smith",
      rating: 5,
      comment: `${profile.full_name || profile.username} is an excellent professional with outstanding attention to detail and exceptional communication skills.`,
      date: "2 days ago"
    },
    {
      id: 2,
      name: "Emily Chen", 
      rating: 4,
      comment: "Really responsive and professional. There were a few minor revisions needed, but overall we were very satisfied with the final deliverable.",
      date: "1 week ago"
    },
    {
      id: 3,
      name: "Mark Johnson",
      rating: 5,
      comment: "One of the most extraordinary professionals I've worked with. Exceeded expectations and delivered remarkable quality work on time.",
      date: "2 weeks ago"
    }
  ];

  const displayedReviews = showAllReviews ? mockReviews : mockReviews.slice(0, 2);

  // Get current profile data based on active account type
  const getCurrentProfileData = () => {
    switch (activeAccountType) {
      case 'freelancer':
        return profile.freelancer_profile || {};
      case 'client':
        return profile.client_profile || {};
      case 'admin':
        return profile.admin_profile || {};
      default:
        return {};
    }
  };

  const currentProfileData = getCurrentProfileData();
  const professionalProfile = profile.professional_profile || {};

  // Check if viewing own profile
  const isOwnProfile = user && String(user.id) === String(userId);

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            Public Profile
          </h1>
          <div className="flex items-center gap-2">
            {profile.is_verified && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Verified
              </span>
            )}
            {profile.is_premium && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                Premium
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Account Type Switcher */}
        {profile.account_types && profile.account_types.length > 1 && (
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              {profile.account_types.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveAccountType(type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeAccountType === type
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {getAccountTypeIcon(type)}
                  {getAccountTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {profile.profile_picture ? (
              <img
                src={`https://kamcomuser.duckdns.org:30443${profile.profile_picture}`}
                alt={profile.full_name || profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xl">
                {(profile.full_name || profile.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {profile.full_name || profile.username}
            </h2>
            {professionalProfile.title && (
              <p className="text-lg text-gray-600 mb-2">{professionalProfile.title}</p>
            )}
            
            <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-3">
              {(profile.city || profile.country) && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {profile.created_at && (
                <span>SINCE {new Date(profile.created_at).getFullYear()}</span>
              )}
              {profile.timezone && (
                <span>TIMEZONE: {profile.timezone}</span>
              )}
              {profile.last_activity && (
                <span>LAST SEEN: {getTimeAgo(profile.last_activity)}</span>
              )}
            </div>

            {/* Availability Status - Only for freelancers */}
            {activeAccountType === 'freelancer' && currentProfileData.availability_status && (
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${
                  currentProfileData.availability_status === 'available' ? 'bg-green-500' :
                  currentProfileData.availability_status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm capitalize text-gray-600">
                  {currentProfileData.availability_status}
                  {currentProfileData.availability_hours_per_week && (
                    ` • ${currentProfileData.availability_hours_per_week}h/week`
                  )}
                </span>
              </div>
            )}

            {/* Account Types Display */}
            <div className="flex items-center gap-2 mb-3">
              {profile.account_types?.map((type) => (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    type === 'freelancer' ? 'bg-blue-100 text-blue-800' :
                    type === 'client' ? 'bg-green-100 text-green-800' :
                    type === 'admin' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {getAccountTypeIcon(type)}
                  {getAccountTypeLabel(type)}
                </span>
              ))}
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            {activeAccountType === 'freelancer' && currentProfileData.hourly_rate && (
              <>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${currentProfileData.hourly_rate}/{currentProfileData.currency === 'USD' ? 'hr' : currentProfileData.currency}
                </div>
                <div className="text-sm text-gray-500">Starting at</div>
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
            <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Professional Information */}
        {(professionalProfile.company_name || professionalProfile.website) && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {professionalProfile.company_name && (
                <div>
                  <span className="text-sm text-gray-500">Company</span>
                  <p className="font-medium">{professionalProfile.company_name}</p>
                </div>
              )}
              {professionalProfile.website && (
                <div>
                  <span className="text-sm text-gray-500">Website</span>
                  <p className="font-medium">
                    <a href={professionalProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      {professionalProfile.website}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Freelancer-specific content */}
        {activeAccountType === 'freelancer' && (
          <>
            {/* Skills */}
            {currentProfileData.skills && currentProfileData.skills.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProfileData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Level & Languages */}
            {(currentProfileData.experience_level || currentProfileData.years_of_experience || professionalProfile.languages_spoken?.length > 0) && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentProfileData.experience_level && (
                    <div>
                      <span className="text-sm text-gray-500">Experience Level</span>
                      <p className="font-medium capitalize">{currentProfileData.experience_level}</p>
                    </div>
                  )}
                  {currentProfileData.years_of_experience && (
                    <div>
                      <span className="text-sm text-gray-500">Years of Experience</span>
                      <p className="font-medium">{currentProfileData.years_of_experience} years</p>
                    </div>
                  )}
                  {professionalProfile.languages_spoken?.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500">Languages</span>
                      <p className="font-medium">{professionalProfile.languages_spoken.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Briefcase className="w-5 h-5 inline mr-2" />
                  Work Experience
                </h3>
                <div className="space-y-4">
                  {profile.experience.map((exp) => (
                    <div key={exp.id} className="flex items-start gap-3 border-l-2 border-blue-600 pl-4">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 -ml-5"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{exp.title}</p>
                        <p className="text-gray-700">{exp.company}</p>
                        {exp.location && <p className="text-sm text-gray-500">{exp.location}</p>}
                        <p className="text-sm text-gray-600">
                          {formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <GraduationCap className="w-5 h-5 inline mr-2" />
                  Education
                </h3>
                <div className="space-y-4">
                  {profile.education.map((edu) => (
                    <div key={edu.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">{edu.degree}</p>
                        <p className="text-gray-700">{edu.field_of_study}</p>
                        <p className="text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : 'Present'}
                        </p>
                        {edu.description && (
                          <p className="text-sm text-gray-700 mt-2">{edu.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Award className="w-5 inline mr-2" />
                  Certifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.certifications.map((cert) => (
                    <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-1">{cert.name}</h4>
                      <p className="text-gray-600 text-sm mb-2">{cert.issuing_organization}</p>
                      <p className="text-xs text-gray-500">
                        Issued {formatDate(cert.issue_date)}
                        {cert.expiry_date && ` • Expires ${formatDate(cert.expiry_date)}`}
                      </p>
                      {cert.credential_url && (
                        <a 
                          href={cert.credential_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-flex items-center"
                        >
                          View Credential <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {profile.portfolio && profile.portfolio.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile.portfolio.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors">
                      {item.image && (
                        <div className="aspect-video bg-gray-200">
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{item.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        {item.technologies_used && item.technologies_used.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.technologies_used.map((tech, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
                          >
                            View Project <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rating and Reviews */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Reviews & Rating</h3>
              </div>
              
              {/* Rating Summary */}
              <div className="flex items-center gap-8 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {parseFloat(currentProfileData.average_rating || 0).toFixed(1)}
                  </div>
                  <div className="flex justify-center mb-1">
                    {renderStars(currentProfileData.average_rating || 0)}
                  </div>
                  <div className="text-sm text-gray-600">{currentProfileData.total_reviews || 0} reviews</div>
                </div>
                
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Projects Completed</span>
                      <p className="font-semibold text-lg">{currentProfileData.total_projects_completed || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Profile Completion</span>
                      <p className="font-semibold text-lg">{profile.profile_completion_percentage || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              {mockReviews.length > 0 && (
                <>
                  <div className="space-y-6">
                    {displayedReviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {renderStars(review.rating)}
                            </div>
                            <div className="font-medium text-gray-900">{review.name}</div>
                          </div>
                          <div className="text-sm text-gray-500">{review.date}</div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    ))}
                  </div>

                  {/* Show More/Less Button */}
                  {mockReviews.length > 2 && (
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mt-4"
                    >
                      {showAllReviews ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show More Reviews ({mockReviews.length - 2} more)
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Client-specific content */}
        {activeAccountType === 'client' && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <Building className="w-5 h-5 inline mr-2" />
              Client Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
              {currentProfileData.industry && (
                <div>
                  <span className="text-sm text-gray-500">Industry</span>
                  <p className="font-medium">{currentProfileData.industry}</p>
                </div>
              )}
              {currentProfileData.company_size && (
                <div>
                  <span className="text-sm text-gray-500">Company Size</span>
                  <p className="font-medium capitalize">{currentProfileData.company_size}</p>
                </div>
              )}
              {currentProfileData.total_projects_posted !== undefined && (
                <div>
                  <span className="text-sm text-gray-500">Projects Posted</span>
                  <p className="font-semibold text-lg">{currentProfileData.total_projects_posted}</p>
                </div>
              )}
              {currentProfileData.total_spent !== undefined && (
                <div>
                  <span className="text-sm text-gray-500">Total Spent</span>
                  <p className="font-semibold text-lg">${currentProfileData.total_spent}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social Links */}
        {profile.social_links && profile.social_links.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect</h3>
            <div className="flex flex-wrap gap-3">
              {profile.social_links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {getSocialIcon(link.platform)}
                  <span className="capitalize">{link.platform}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Professional Links from professional profile */}
        {(professionalProfile.linkedin_url || professionalProfile.github_url || professionalProfile.portfolio_url) && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Links</h3>
            <div className="flex flex-wrap gap-3">
              {professionalProfile.linkedin_url && (
                <a
                  href={professionalProfile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              )}
              {professionalProfile.github_url && (
                <a
                  href={professionalProfile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              )}
              {professionalProfile.portfolio_url && (
                <a
                  href={professionalProfile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Portfolio
                </a>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleMessageUser}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Message {profile.first_name || profile.username}
            </button>
            <button className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors">
              Save Profile
            </button>
          </div>
        )}

        {/* Own Profile Message */}
        {isOwnProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800 font-medium mb-2">This is your public profile</p>
            <p className="text-blue-600 text-sm">This is how other users see your profile</p>
            <button 
              onClick={() => navigate('/profile/edit')}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;