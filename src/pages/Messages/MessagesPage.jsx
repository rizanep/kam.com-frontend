// src/pages/MessagesPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import MessagingSystem from './MessagingSystem';

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // Extract parameters from URL
  const recipientId = searchParams.get('recipient');
  const recipientName = searchParams.get('name');
  const recipientProfilePicture = searchParams.get('profilePicture');
  const messageType = searchParams.get('messageType') || 'direct';
  const autoStart = searchParams.get('autoStart') === 'true';
  const jobId = searchParams.get('jobId');
  const jobTitle = searchParams.get('jobTitle');
  const bidId = searchParams.get('bidId');
  const projectId = searchParams.get('projectId');
  
  // Build messageRecipient object if we have recipient data
  const messageRecipient = recipientId ? {
    userId: recipientId,
    name: recipientName || `User ${recipientId}`,
    profilePicture: recipientProfilePicture || null
  } : null;
  
  // Build messageJobContext if we have job data
  const messageJobContext = (jobId || bidId || projectId) ? {
    jobId: jobId || null,
    jobTitle: jobTitle || null,
    bidId: bidId || null,
    projectId: projectId || null
  } : null;
  
  // Generate initial message based on context
  const generateInitialMessage = () => {
    if (messageType === 'job' && jobTitle) {
      return `Hi! I'm interested in your job "${jobTitle}". I have relevant experience and would love to discuss the project requirements with you.`;
    }
    return '';
  };
  
  const [initialMessage] = useState(generateInitialMessage());

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/messages' } });
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Optional: Add a header bar */}
     
      
      {/* Messaging System */}
      <div className="flex-1 overflow-hidden">
        <MessagingSystem
          apiBaseUrl="https://kamcomuser.duckdns.org:30443/api"
          wsBaseUrl="wss://kamcomuser.duckdns.org:30443/ws"
          messageRecipient={messageRecipient}
          messageJobContext={messageJobContext}
          messageType={messageType}
          autoStartConversation={autoStart}
          initialMessage={initialMessage}
          showSidebar={true}
          showHeader={true}
          allowNewConversations={true}
          onConversationStarted={(conversation) => {
            console.log('Conversation started:', conversation);
            // Optional: Update URL to remove query params after conversation starts
            if (autoStart) {
              navigate('/messages', { replace: true });
            }
          }}
          onNewMessage={(message, conversation) => {
            console.log('New message sent:', message);
          }}
          onConversationChange={(conversation) => {
            console.log('Active conversation changed:', conversation);
          }}
        />
      </div>
    </div>
  );
};

export default MessagesPage;