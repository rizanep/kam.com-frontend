import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Send, Search, MoreVertical, Phone, Video, Paperclip, 
  Smile, ArrowLeft, MessageSquare, Users, Clock, 
  Check, CheckCheck, X, Edit2, Trash2, Reply,
  UserPlus, Settings, Circle, AlertCircle, Loader
} from 'lucide-react';

const token = localStorage.getItem("access_token");

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]; // JWT payload
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Invalid token", e);
    return null;
  }
}

const payload = parseJwt(token);
const currentUserId = payload?.user_id;
const currentUsername = payload?.username;

const MessagingSystem = ({ 
  apiBaseUrl = 'http://localhost:8003/api',
  wsBaseUrl = 'ws://localhost:8003/ws',
  initialConversationId = null,
  onNewMessage = null,
  onConversationChange = null,
  showSidebar = true,
  showHeader = true,
  allowNewConversations = true,
  customUserRenderer = null,
  theme = 'default',
  onStartJobConversation = null,
  // New props for handling external message requests
  messageRecipient = null, // { userId, name, profilePicture? }
  messageJobContext = null, // { jobId, bidId, projectId? }
  messageType = 'direct', // 'direct', 'job', 'project'
  autoStartConversation = false, // Whether to automatically start conversation
  initialMessage = null, // Pre-filled message content
  onConversationStarted = null, // Callback when conversation is created
}) => {
  const userId = currentUserId;
  const token = localStorage.getItem("access_token");

  // Core state
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState(initialMessage || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  // User and status management
  const [userProfiles, setUserProfiles] = useState(new Map());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // UI state
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  
  // Refs
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const userFetchCache = useRef(new Set());

  // Enhanced user profile fetching with caching
  const fetchUserProfile = useCallback(async (userIdToFetch) => {
    if (!userIdToFetch || userProfiles.has(userIdToFetch) || userFetchCache.current.has(userIdToFetch)) {
      return userProfiles.get(userIdToFetch);
    }

    userFetchCache.current.add(userIdToFetch);

    try {
      // Call the real users API
      const response = await fetch(`http://localhost:8000/api/auth/users/${userIdToFetch}/profile/`, {
        headers: {
          'Authorization': "Bearer secure-service-token-123",
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const profile = {
          id: userIdToFetch,
          username: userData.username || `User ${userIdToFetch}`,
          full_name: userData.full_name || userData.first_name && userData.last_name ? 
            `${userData.first_name} ${userData.last_name}` : userData.username,
          profile_picture: userData.profile_picture,
          is_online: userData.is_online || false,
          last_seen: userData.last_seen,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name
        };

        setUserProfiles(prev => new Map(prev.set(userIdToFetch, profile)));
        
        if (profile.is_online) {
          setOnlineUsers(prev => new Set([...prev, userIdToFetch]));
        }

        return profile;
      } else {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Return fallback profile
      const fallbackProfile = {
        id: userIdToFetch,
        username: `User ${userIdToFetch}`,
        full_name: `User ${userIdToFetch}`,
        profile_picture: null,
        is_online: false,
        last_seen: null
      };
      
      setUserProfiles(prev => new Map(prev.set(userIdToFetch, fallbackProfile)));
      return fallbackProfile;
    }
  }, [userProfiles, token]);

  // Bulk fetch user profiles for conversations
  const fetchConversationUsers = useCallback(async (conversationsList) => {
    const userIds = new Set();
    
    conversationsList.forEach(conv => {
      if (conv.participants && Array.isArray(conv.participants)) {
        conv.participants.forEach(id => userIds.add(String(id)));
      }
    });

    // Fetch profiles for users we don't have yet
    const promises = Array.from(userIds).map(id => fetchUserProfile(id));
    await Promise.all(promises);
  }, [fetchUserProfile]);

  // Enhanced API call with better error handling
  const apiCall = useCallback(async (endpoint, options = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${apiBaseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please login again');
        } else if (response.status === 403) {
          throw new Error('Access denied');
        } else if (response.status === 404) {
          throw new Error('Resource not found');
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }, [apiBaseUrl, token]);

  // Enhanced start conversation function
  const startConversation = useCallback(async (participantIds, conversationOptions = {}) => {
    try {
      setStartingConversation(true);
      
      const {
        type = messageType,
        title = '',
        jobId = messageJobContext?.jobId,
        bidId = messageJobContext?.bidId,
        projectId = messageJobContext?.projectId,
        initialMessage: initialMsg = null
      } = conversationOptions;

      // Ensure current user is included
      const allParticipants = [...new Set([String(userId), ...participantIds.map(id => String(id))])];

      // Check if conversation already exists for direct messages
      if (type === 'direct' && allParticipants.length === 2) {
        const existingConversation = conversations.find(conv => 
          conv.conversation_type === 'direct' &&
          conv.participants.length === 2 &&
          conv.participants.every(p => allParticipants.includes(String(p)))
        );

        if (existingConversation) {
          setActiveConversation(existingConversation);
          if (onConversationStarted) {
            onConversationStarted(existingConversation);
          }
          return existingConversation;
        }
      }

      // Create new conversation
      const requestData = {
        participant_ids: allParticipants,
        type: type,
        title: title || generateConversationTitle(type, allParticipants),
        job_id: jobId || null,
        bid_id: bidId || null,
        project_id: projectId || null,
      };

      console.log('Creating conversation with data:', requestData);

      const response = await apiCall('/notifications/conversations/start/', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      console.log('Conversation created:', response);

      // Update conversations list
      setConversations(prev => {
        const existing = prev.find(c => c.id === response.id);
        if (existing) {
          return prev.map(c => c.id === response.id ? response : c);
        }
        return [response, ...prev];
      });

      // Set as active conversation
      setActiveConversation(response);

      // Fetch user profiles for participants
      await Promise.all(response.participants.map(id => fetchUserProfile(String(id))));

      // Send initial message if provided
      if (initialMsg) {
        setMessageText(initialMsg);
      }

      // Call callback if provided
      if (onConversationStarted) {
        onConversationStarted(response);
      }

      return response;

    } catch (error) {
      console.error('Failed to start conversation:', error);
      setConnectionError(`Failed to start conversation: ${error.message}`);
      throw error;
    } finally {
      setStartingConversation(false);
    }
  }, [userId, messageType, messageJobContext, conversations, apiCall, fetchUserProfile, onConversationStarted]);

  // Generate conversation title based on type and participants
  const generateConversationTitle = useCallback((type, participantIds) => {
    switch (type) {
      case 'job':
        return messageJobContext?.jobTitle ? 
          `Job: ${messageJobContext.jobTitle}` : 
          'Job Discussion';
      case 'project':
        return messageJobContext?.projectName ? 
          `Project: ${messageJobContext.projectName}` : 
          'Project Discussion';
      case 'direct':
      default:
        if (participantIds.length === 2) {
          const otherUserId = participantIds.find(id => String(id) !== String(userId));
          const otherUser = userProfiles.get(String(otherUserId));
          return otherUser ? `Chat with ${otherUser.username}` : 'Direct Message';
        }
        return `Group Chat (${participantIds.length} members)`;
    }
  }, [messageJobContext, userProfiles, userId]);

  // Handle auto-start conversation when messageRecipient prop changes
  useEffect(() => {
    if (autoStartConversation && messageRecipient && messageRecipient.userId && !startingConversation) {
      console.log('Auto-starting conversation with:', messageRecipient);
      
      // Check if we already have an active conversation with this user
      const existingConversation = conversations.find(conv => 
        conv.conversation_type === (messageType || 'direct') &&
        conv.participants.includes(String(messageRecipient.userId)) &&
        conv.participants.includes(String(userId))
      );

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation);
        setActiveConversation(existingConversation);
        if (onConversationStarted) {
          onConversationStarted(existingConversation);
        }
      } else {
        console.log('Starting new conversation...');
        startConversation([messageRecipient.userId], {
          type: messageType,
          title: messageRecipient.name ? `Chat with ${messageRecipient.name}` : undefined,
          initialMessage: initialMessage
        }).catch(error => {
          console.error('Failed to auto-start conversation:', error);
        });
      }
    }
  }, [autoStartConversation, messageRecipient, messageType, conversations, userId, startConversation, onConversationStarted, initialMessage, startingConversation]);

  // Set initial message when initialMessage prop changes
  useEffect(() => {
    if (initialMessage && initialMessage !== messageText) {
      setMessageText(initialMessage);
    }
  }, [initialMessage]);

  // WebSocket connection with enhanced error handling
  useEffect(() => {
    if (!token || !userId) {
      setConnectionError('Token or userId missing');
      return;
    }

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connectWebSocket = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        setConnectionError('Failed to connect after multiple attempts');
        return;
      }

      try {
        console.log('Attempting WebSocket connection...');
        const ws = new WebSocket(`${wsBaseUrl}/messaging/?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          setWsConnected(true);
          setConnectionError(null);
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          setWsConnected(false);
          
          if (event.code === 4001) {
            setConnectionError('Authentication failed: Token missing');
          } else if (event.code === 4002) {
            setConnectionError('Authentication failed: Invalid token');
          } else if (event.code !== 1000 && token && userId) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionError('WebSocket connection error');
          setWsConnected(false);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionError('Failed to create WebSocket connection');
        setWsConnected(false);
        
        reconnectAttempts++;
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        }
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000);
      }
    };
  }, [token, userId, wsBaseUrl]);

  const handleNewMessage = useCallback((message) => {
    console.log('Handling new message:', message);
    
    // Ensure we have sender profile
    fetchUserProfile(String(message.sender_id));
    
    setMessages(prev => {
      // Check for duplicates by ID first
      if (prev.some(msg => msg.id === message.id)) {
        console.log('Duplicate message detected by ID, ignoring:', message.id);
        return prev;
      }
      
      // If this is our own message (sender matches current user), look for temp message to replace
      if (String(message.sender_id) === String(userId)) {
        const tempIndex = prev.findIndex(
          msg => msg.tempId && 
          msg.conversation === (message.conversation || message.conversation_id) &&
          msg.sender_id === String(message.sender_id) &&
          msg.content === message.content &&
          Math.abs(new Date(msg.created_at) - new Date(message.created_at)) < 30000
        );
        
        if (tempIndex !== -1) {
          console.log('Replacing temp message with real message:', message.id);
          const newMessages = [...prev];
          // Preserve sender_info from temp message if it exists
          const tempSenderInfo = newMessages[tempIndex].sender_info;
          newMessages[tempIndex] = { 
            ...message, 
            tempId: undefined,
            sending: false,
            failed: false,
            sender_info: message.sender_info || tempSenderInfo
          };
          return newMessages;
        }
      }
      
      // For messages from others, add directly (no temp message exists)
      if (String(message.sender_id) !== String(userId)) {
        console.log('Adding new message from other user:', message.id);
        return [...prev, message];
      }
      
      // If we reach here, it might be our own message but no temp found
      // This can happen if WebSocket is faster than optimistic update
      console.log('Own message received but no temp found, checking for near-duplicates');
      const nearDuplicate = prev.find(
        msg => !msg.tempId &&
        msg.sender_id === String(message.sender_id) &&
        msg.content === message.content &&
        Math.abs(new Date(msg.created_at) - new Date(message.created_at)) < 5000
      );
      
      if (nearDuplicate) {
        console.log('Near-duplicate detected, ignoring:', message.id);
        return prev;
      }
      
      // Safe to add
      console.log('Adding new own message (no temp found):', message.id);
      return [...prev, message];
    });
    
    // Update conversation list only for messages from others or confirmed sent messages
    if (String(message.sender_id) !== String(userId) || message.id) {
      setConversations(prev => prev.map(conv =>
        conv.id === (message.conversation || message.conversation_id)
          ? {
              ...conv,
              last_message: {
                content: message.content,
                sender_id: message.sender_id,
                created_at: message.created_at
              },
              last_message_at: message.created_at
            }
          : conv
      ));
    }
    
    // Update unread count only for messages from others
    const messageConvId = message.conversation || message.conversation_id;
    if (String(message.sender_id) !== String(userId) && 
        (!activeConversation || activeConversation.id !== messageConvId)) {
      setUnreadCounts(prev => ({
        ...prev,
        [messageConvId]: (prev[messageConvId] || 0) + 1
      }));
    }

    scrollToBottom();
  }, [activeConversation, userId, fetchUserProfile]);

  // Enhanced typing indicator with user context
  const handleTypingIndicator = useCallback(({ user_id, conversation_id, is_typing }) => {
    if (activeConversation?.id === conversation_id && String(user_id) !== String(userId)) {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (is_typing) {
          // Ensure we have user profile
          fetchUserProfile(String(user_id));
          newMap.set(String(user_id), {
            user_id: String(user_id),
            conversation_id,
            timestamp: Date.now()
          });
        } else {
          newMap.delete(String(user_id));
        }
        return newMap;
      });
    }
  }, [activeConversation, userId, fetchUserProfile]);

  // Enhanced read receipt handler
  const handleReadReceipt = useCallback(({ user_id, conversation_id }) => {
    setMessages(prev => prev.map(msg => {
      if (msg.conversation === conversation_id || msg.conversation_id === conversation_id) {
        const readBy = msg.read_by || [];
        if (!readBy.some(r => r.user_id === String(user_id))) {
          return {
            ...msg,
            read_by: [...readBy, { user_id: String(user_id), read_at: new Date().toISOString() }]
          };
        }
      }
      return msg;
    }));
  }, []);
  
  // User status update handler
  const handleUserStatusUpdate = useCallback((statusData) => {
    const userIdStr = String(statusData.user_id);
    
    if (statusData.is_online) {
      setOnlineUsers(prev => new Set([...prev, userIdStr]));
    } else {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userIdStr);
        return newSet;
      });
    }

    // Update user profile
    setUserProfiles(prev => {
      const existing = prev.get(userIdStr);
      if (existing) {
        return new Map(prev.set(userIdStr, {
          ...existing,
          is_online: statusData.is_online,
          last_seen: statusData.last_seen
        }));
      }
      return prev;
    });
  }, []);

  // Enhanced WebSocket message handler
  const handleWebSocketMessage = useCallback((data) => {
    console.log('WebSocket message received:', data);
    
    switch (data.type) {
      case 'message':
        // Only handle messages from others or confirmed sent messages
        if (data.data && (String(data.data.sender_id) !== String(userId) || data.data.id)) {
          handleNewMessage(data.data);
        }
        break;
      case 'message_sent':
        // Handle message sent confirmation (replace temp message)
        if (data.data && String(data.data.sender_id) === String(userId)) {
          console.log('Message sent confirmation received:', data.data);
          setMessages(prev => prev.map(msg => {
            // Find matching temp message by content and timestamp proximity
            if (msg.tempId && 
                msg.content === data.data.content &&
                msg.sender_id === String(data.data.sender_id) &&
                Math.abs(new Date(msg.created_at) - new Date(data.data.created_at)) < 30000) {
              return {
                ...data.data,
                tempId: undefined,
                sending: false,
                failed: false
              };
            }
            return msg;
          }));
        }
        break;
      case 'typing':
        handleTypingIndicator(data.data);
        break;
      case 'read_receipt':
        handleReadReceipt(data.data);
        break;
      case 'user_status':
        handleUserStatusUpdate(data.data);
        break;
      case 'error':
        console.error('WebSocket error:', data.message);
        setConnectionError(data.message);
        break;
      case 'success':
        console.log('WebSocket success:', data.message);
        break;
      case 'connection_established':
        console.log('WebSocket connection established for user:', data.user_id);
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }, [userId, handleNewMessage, handleTypingIndicator, handleReadReceipt, handleUserStatusUpdate]);

  // Enhanced conversation fetching
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/notifications/conversations/');
      console.log('Conversations fetched:', data);
      
      const conversationsArray = data.results || data || [];
      setConversations(conversationsArray);
      
      // Fetch user profiles for all participants
      await fetchConversationUsers(conversationsArray);
      
      // Calculate unread counts
      const counts = {};
      conversationsArray.forEach(conv => {
        counts[conv.id] = conv.unread_count || 0;
      });
      setUnreadCounts(counts);
      
      // Set initial conversation if provided
      if (initialConversationId && conversationsArray.length > 0) {
        const initialConv = conversationsArray.find(c => c.id === initialConversationId);
        if (initialConv) {
          setActiveConversation(initialConv);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConnectionError(`Failed to fetch conversations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced message fetching
  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const data = await apiCall(`/notifications/conversations/${conversationId}/messages/`);
      console.log('Messages fetched:', data);
      
      const messagesArray = data.results || data || [];
      const sortedMessages = messagesArray.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(sortedMessages);

      // Fetch user profiles for message senders
      const senderIds = [...new Set(messagesArray.map(msg => String(msg.sender_id)))];
      await Promise.all(senderIds.map(id => fetchUserProfile(id)));

      // TODO: Handle pagination if needed
      if (data.next) {
        console.log('More messages available:', data.next);
        // Could implement load more functionality here
      }

    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setConnectionError(`Failed to fetch messages: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced send message with proper user context
  const sendMessage = async () => {
    if (!messageText.trim() || !activeConversation) return;

    const messageContent = messageText.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Ensure we have current user profile before sending
    await fetchUserProfile(String(userId));
    const currentUser = userProfiles.get(String(userId));
    
    if (!currentUser) {
      console.error('Current user profile not found');
      setConnectionError('User profile not loaded');
      return;
    }

    // Create optimistic message with current user info
    const tempMessage = {
      id: tempId, // Use tempId as id initially
      tempId: tempId,
      conversation: activeConversation.id,
      conversation_id: activeConversation.id, // Add both formats
      sender_id: String(userId),
      sender_info: {
        id: currentUser.id,
        username: currentUser.username || `User ${userId}`,
        profile_picture: currentUser.profile_picture || null
      },
      content: messageContent,
      created_at: new Date().toISOString(),
      is_edited: false,
      sending: true,
      read_by: [],
      reply_to: replyToMessage?.id || null,
      reply_to_message: replyToMessage || null,
      message_type: 'text'
    };

    // Optimistic UI update
    setMessages(prev => [...prev, tempMessage]);
    setMessageText('');
    setReplyToMessage(null);
    
    // Update conversation list optimistically (for our own message)
    setConversations(prev => prev.map(conv =>
      conv.id === activeConversation.id
        ? {
            ...conv,
            last_message: {
              content: messageContent,
              sender_id: String(userId),
              created_at: tempMessage.created_at
            },
            last_message_at: tempMessage.created_at
          }
        : conv
    ));
    
    // Clear typing indicator
    handleTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const messageData = {
      type: 'send_message',
      conversation_id: activeConversation.id,
      content: messageContent,
      reply_to: replyToMessage?.id || null,
    };

    try {
      if (wsRef.current && wsConnected) {
        console.log('Sending message via WebSocket:', messageData);
        wsRef.current.send(JSON.stringify(messageData));
        
        // Set a timeout to mark as sent if no confirmation received
        setTimeout(() => {
          setMessages(prev => prev.map(msg =>
            msg.tempId === tempId ? { ...msg, sending: false } : msg
          ));
        }, 3000);
        
      } else {
        // Fallback to API
        console.log('WebSocket not connected, using API fallback');
        const response = await apiCall(`/notifications/conversations/${activeConversation.id}/send/`, {
          method: 'POST',
          body: JSON.stringify({
            content: messageContent,
            reply_to: replyToMessage?.id || null,
          }),
        });
        
        // Update with real message from API response
        setMessages(prev => prev.map(msg =>
          msg.tempId === tempId ? { 
            ...response, 
            tempId: undefined, 
            sending: false,
            failed: false,
            sender_info: currentUser // Ensure sender info is preserved
          } : msg
        ));
      }

      // Call callback if provided
      if (onNewMessage) {
        onNewMessage(tempMessage, activeConversation);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark the message as failed
      setMessages(prev => prev.map(msg =>
        msg.tempId === tempId ? { ...msg, sending: false, failed: true } : msg
      ));
      setConnectionError(`Failed to send message: ${error.message}`);
    }
  };

  // Enhanced conversation selection with user profile loading
  const selectConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    
    // Ensure we have user profiles for all participants
    if (conversation.participants) {
      await Promise.all(conversation.participants.map(id => fetchUserProfile(String(id))));
    }

    // Call callback if provided
    if (onConversationChange) {
      onConversationChange(conversation);
    }
  }, [fetchUserProfile, onConversationChange]);

  // Utility functions
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get user display info
  const getUserInfo = useCallback((userIdToGet) => {
    const profile = userProfiles.get(String(userIdToGet));
    return profile || {
      id: userIdToGet,
      username: `User ${userIdToGet}`,
      full_name: `User ${userIdToGet}`,
      profile_picture: null,
      is_online: false
    };
  }, [userProfiles]);

  // Get conversation display info with enhanced support for different conversation types
  const getConversationInfo = useCallback((conversation) => {
    if (!conversation) return null;

    // For job-related conversations
    if (conversation.conversation_type === 'job' || conversation.job_id) {
      const title = conversation.title || `Job Discussion`;
      const subtitle = conversation.job_id ? `Job ID: ${conversation.job_id}` : 'Job-related chat';
      
      return {
        title,
        subtitle,
        avatar: null,
        isOnline: false,
        userId: null,
        conversationType: 'job'
      };
    }

    // For project-related conversations
    if (conversation.conversation_type === 'project' || conversation.project_id) {
      const title = conversation.title || `Project Discussion`;
      const subtitle = conversation.project_id ? `Project ID: ${conversation.project_id}` : 'Project chat';
      
      return {
        title,
        subtitle,
        avatar: null,
        isOnline: false,
        userId: null,
        conversationType: 'project'
      };
    }

    // For direct conversations
    if (conversation.conversation_type === 'direct' && conversation.participants) {
      const otherUserId = conversation.participants.find(id => String(id) !== String(userId));
      if (otherUserId) {
        const otherUser = getUserInfo(otherUserId);
        return {
          title: otherUser.full_name || otherUser.username,
          subtitle: onlineUsers.has(String(otherUserId)) ? 'Online' : 'Offline',
          avatar: otherUser.profile_picture,
          isOnline: onlineUsers.has(String(otherUserId)),
          userId: otherUserId,
          conversationType: 'direct'
        };
      }
    }

    // For group conversations
    return {
      title: conversation.title || 'Group Chat',
      subtitle: `${conversation.participants?.length || 0} members`,
      avatar: null,
      isOnline: false,
      userId: null,
      conversationType: 'group'
    };
  }, [getUserInfo, onlineUsers, userId]);

  // Enhanced input change handler
  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    // Send typing indicator
    handleTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 1000);
  };

  // WebSocket actions
  const joinConversation = (conversationId) => {
    if (wsRef.current && wsConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'join_conversation',
        conversation_id: conversationId
      }));
    }
  };

  const markConversationRead = async (conversationId) => {
    try {
      await apiCall(`/notifications/conversations/${conversationId}/read/`, {
        method: 'POST'
      });

      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0
      }));

      if (wsRef.current && wsConnected) {
        wsRef.current.send(JSON.stringify({
          type: 'mark_read',
          conversation_id: conversationId
        }));
      }
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  const handleTyping = (isTyping) => {
    if (!activeConversation) return;

    if (wsRef.current && wsConnected) {
      wsRef.current.send(JSON.stringify({
        type: isTyping ? 'typing_start' : 'typing_stop',
        conversation_id: activeConversation.id
      }));
    }
  };

  // Load initial data
  useEffect(() => {
    if (token && userId) {
      // First ensure we have the current user's profile
      fetchUserProfile(String(userId)).then(() => {
        fetchConversations();
      });
    }
  }, [token, userId, fetchUserProfile]);

  // Handle active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      markConversationRead(activeConversation.id);
      joinConversation(activeConversation.id);
    }
  }, [activeConversation]);

  // Auto-scroll effect
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up typing timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Memoized filtered conversations with enhanced filtering for different types
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const convInfo = getConversationInfo(conv);
      const searchLower = searchQuery.toLowerCase();
      
      // Search in title
      if (convInfo?.title?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in conversation type
      if (convInfo?.conversationType?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search in job/project IDs if available
      if (conv.job_id && conv.job_id.toString().includes(searchLower)) {
        return true;
      }
      
      if (conv.project_id && conv.project_id.toString().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
  }, [conversations, searchQuery, getConversationInfo]);

  // Connection status
  const getConnectionStatus = () => {
    if (!token) return { color: 'bg-red-500', text: 'Not authenticated' };
    if (connectionError) return { color: 'bg-red-500', text: 'Connection error' };
    if (wsConnected) return { color: 'bg-green-500', text: 'Connected' };
    return { color: 'bg-yellow-500', text: 'Connecting...' };
  };

  const connectionStatus = getConnectionStatus();

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;

    const typingUsersList = Array.from(typingUsers.keys()).map(uid => {
      const user = getUserInfo(uid);
      return user.username;
    });

    return (
      <div className="flex justify-start mb-4">
        <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Loader className="w-3 h-3 animate-spin" />
          {typingUsersList.join(', ')} {typingUsersList.length > 1 ? 'are' : 'is'} typing...
        </div>
      </div>
    );
  };

  // Enhanced conversation type badge
  const getConversationTypeBadge = (conversation) => {
    if (conversation.job_id) {
      return (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          Job
        </span>
      );
    }
    if (conversation.project_id) {
      return (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
          Project
        </span>
      );
    }
    if (conversation.conversation_type === 'group') {
      return (
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
          Group
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          {showHeader && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-2 h-2 rounded-full ${connectionStatus.color}`}
                    title={connectionStatus.text}
                  ></div>
                  {allowNewConversations && (
                    <button
                      onClick={() => setShowNewConversation(true)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      disabled={startingConversation}
                    >
                      {startingConversation ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserPlus className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Connection Error Alert */}
              {connectionError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-700">{connectionError}</span>
                </div>
              )}

              {/* Starting Conversation Alert */}
              {startingConversation && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <Loader className="w-4 h-4 text-blue-500 flex-shrink-0 animate-spin" />
                  <span className="text-xs text-blue-700">Starting conversation...</span>
                </div>
              )}
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
                {!searchQuery && allowNewConversations && (
                  <button
                    onClick={() => setShowNewConversation(true)}
                    className="block mx-auto mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    disabled={startingConversation}
                  >
                    {startingConversation ? 'Starting conversation...' : 'Start a conversation'}
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const convInfo = getConversationInfo(conversation);
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                      activeConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="relative mr-3">
                      {customUserRenderer ? (
                        customUserRenderer(convInfo, conversation)
                      ) : (
                        <>
                          {convInfo?.avatar ? (
                            <img
                              src={convInfo.avatar}
                              alt={convInfo.title}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-lg">
                              {convInfo?.title?.[0]?.toUpperCase() || 'C'}
                            </div>
                          )}
                          {convInfo?.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {convInfo?.title || 'Conversation'}
                          </h3>
                          {getConversationTypeBadge(conversation)}
                        </div>
                        <div className="flex items-center gap-1">
                          {conversation.last_message_at && (
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          )}
                          {unreadCounts[conversation.id] > 0 && (
                            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">
                              {unreadCounts[conversation.id]}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {conversation.last_message && (
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {String(conversation.last_message.sender_id) === String(userId) ? 'You: ' : ''}
                          {conversation.last_message.content}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        {convInfo?.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            {showHeader && (
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {!showSidebar && (
                      <button
                        onClick={() => setActiveConversation(null)}
                        className="mr-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    
                    <div className="relative mr-3">
                      {(() => {
                        const convInfo = getConversationInfo(activeConversation);
                        return customUserRenderer ? (
                          customUserRenderer(convInfo, activeConversation)
                        ) : (
                          <>
                            {convInfo?.avatar ? (
                              <img
                                src={convInfo.avatar}
                                alt={convInfo.title}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                                {convInfo?.title?.[0]?.toUpperCase() || 'C'}
                              </div>
                            )}
                            {convInfo?.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    <div>
                      {(() => {
                        const convInfo = getConversationInfo(activeConversation);
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-semibold text-gray-900">
                                {convInfo?.title || 'Conversation'}
                              </h2>
                              {getConversationTypeBadge(activeConversation)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {convInfo?.subtitle || 'Chat'}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading && messages.length === 0 ? (
                <div className="text-center text-gray-500 flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  No messages yet. 
                  {messageRecipient ? (
                    <span> Start chatting with {messageRecipient.name}!</span>
                  ) : (
                    <span> Start the conversation!</span>
                  )}
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwnMessage = String(message.sender_id) === String(userId);
                  const showDate = index === 0 || 
                    formatDate(message.created_at) !== formatDate(messages[index - 1]?.created_at);
                  
                  const senderInfo = getUserInfo(message.sender_id);
                  const messageKey = message.id || message.tempId || `${message.sender_id}-${message.created_at}-${index}`;
                  
                  return (
                    <React.Fragment key={`fragment-${messageKey}`}>
                      {showDate && (
                        <div key={`date-${formatDate(message.created_at)}-${index}`} className="text-center">
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                      )}
                      
                      <div key={`message-${messageKey}`} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        {!isOwnMessage && (
                          <div className="mr-2 flex-shrink-0">
                            
                              
                              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                                {senderInfo.username?.[0]?.toUpperCase() || 'U'}
                              </div>
                          
                          </div>
                        )}
                        
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-900'
                        } ${message.sending ? 'opacity-60' : ''} ${message.failed ? 'border-2 border-red-300' : ''}`}>
                          
                          {!isOwnMessage && (
                            <div className="text-xs font-medium mb-1 opacity-75">
                              {senderInfo.full_name || senderInfo.username || `User ${message.sender_id}`}
                            </div>
                          )}
                          
                          {message.reply_to_message && (
                            <div className={`text-xs mb-2 p-2 rounded border-l-2 ${
                              isOwnMessage 
                                ? 'bg-blue-600 border-blue-300' 
                                : 'bg-gray-300 border-gray-400'
                            }`}>
                              <div className="font-medium">Replying to:</div>
                              <div className="truncate">{message.reply_to_message.content}</div>
                            </div>
                          )}
                          
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          <div className={`flex items-center justify-between mt-1 text-xs ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span>{formatTime(message.created_at)}</span>
                            
                            <div className="flex items-center gap-1">
                              {message.is_edited && <span>edited</span>}
                              {message.sending && <span>sending...</span>}
                              {message.failed && <span className="text-red-300">failed</span>}
                              
                              {isOwnMessage && !message.sending && !message.failed && (
                                <>
                                  {message.read_by && message.read_by.length > 0 ? (
                                    <CheckCheck className="w-3 h-3" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          {message.failed && (
                            <button
                              onClick={() => {
                                // Retry message logic could go here
                                console.log('Retry message:', message.id);
                              }}
                              className="mt-1 text-xs text-red-300 hover:text-red-100 underline"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                        
                        {isOwnMessage && (
                          <div className="ml-2 flex-shrink-0">
                            {(() => {
                              const currentUser = getUserInfo(userId);
                              return (
                                <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-blue-800 font-medium text-sm">
                                  {currentUser.username?.[0]?.toUpperCase() }
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              
              {/* Typing indicator */}
              {renderTypingIndicator()}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyToMessage && (
              <div className="bg-gray-100 border-t border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Reply className="w-4 h-4 mr-2" />
                    Replying to: <span className="ml-1 font-medium">{replyToMessage.content.slice(0, 50)}...</span>
                  </div>
                  <button
                    onClick={() => setReplyToMessage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end gap-3">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={messageText}
                    onChange={handleInputChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={
                      messageRecipient 
                        ? `Message ${messageRecipient.name}...` 
                        : "Type a message..."
                    }
                    className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                    rows="1"
                    disabled={!wsConnected && connectionError}
                    style={{
                      minHeight: '40px',
                      height: 'auto',
                    }}
                  />
                </div>
                
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Smile className="w-5 h-5" />
                </button>
                
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || loading || (!wsConnected && connectionError)}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              {messageRecipient ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to chat with {messageRecipient.name}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {startingConversation 
                      ? 'Setting up your conversation...' 
                      : 'Start a conversation or select an existing one from the sidebar'
                    }
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                  <p className="text-gray-500 mb-4">Choose a conversation from the sidebar to start messaging</p>
                </>
              )}
              
              {connectionError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Connection Issues</span>
                  </div>
                  <p>{connectionError}</p>
                  <div className="mt-2 text-xs text-red-600">
                    <p>Make sure:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Django server is running on correct port</li>
                      <li>Redis server is running</li>
                      <li>Your JWT token is valid and not expired</li>
                      <li>WebSocket URL is accessible</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {!connectionError && !wsConnected && token && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 flex-shrink-0 animate-spin" />
                    <span>Connecting to messaging server...</span>
                  </div>
                </div>
              )}

              {startingConversation && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 flex-shrink-0 animate-spin" />
                    <span>Starting conversation with {messageRecipient?.name}...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && allowNewConversations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">New Conversation</h3>
              <button
                onClick={() => setShowNewConversation(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Conversation Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversation Type
                </label>
                <select
                  defaultValue="direct"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    // Handle conversation type change
                    console.log('Conversation type changed to:', e.target.value);
                  }}
                >
                  <option value="direct">Direct Message</option>
                  <option value="job">Job Discussion</option>
                  <option value="project">Project Chat</option>
                  <option value="group">Group Chat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID or Username
                </label>
                <input
                  type="text"
                  placeholder="Enter user ID (e.g., 2, 3, 4, etc.)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const participantId = e.target.value.trim();
                      if (participantId !== userId) {
                        try {
                          const conversationType = e.target.parentElement.parentElement.querySelector('select').value;
                          await startConversation([participantId], { type: conversationType });
                          setShowNewConversation(false);
                          e.target.value = '';
                        } catch (error) {
                          alert('Failed to start conversation: ' + error.message);
                        }
                      } else {
                        alert("You can't start a conversation with yourself!");
                      }
                    }
                  }}
                  disabled={startingConversation}
                />
              </div>

              {/* Job/Project Context (shown for job/project conversations) */}
              <div id="contextFields" style={{ display: 'none' }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job/Project ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter job or project ID"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conversation Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter conversation title"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Press Enter to start a conversation</p>
                <p className="mt-1">Available test user IDs: 2, 3, 4, 5, 6</p>
              </div>

              {/* Current Message Context Display */}
              {messageRecipient && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  <div className="font-medium mb-1">Current Context:</div>
                  <ul className="text-xs space-y-1">
                    <li>• Recipient: {messageRecipient.name} (ID: {messageRecipient.userId})</li>
                    <li>• Type: {messageType}</li>
                    {messageJobContext && (
                      <>
                        {messageJobContext.jobId && <li>• Job ID: {messageJobContext.jobId}</li>}
                        {messageJobContext.bidId && <li>• Bid ID: {messageJobContext.bidId}</li>}
                        {messageJobContext.projectId && <li>• Project ID: {messageJobContext.projectId}</li>}
                      </>
                    )}
                  </ul>
                </div>
              )}

              {/* Test Data Info */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <div className="font-medium mb-1">Test Data Available:</div>
                <ul className="text-xs space-y-1">
                  <li>• Direct conversations between users</li>
                  <li>• Job discussions with context</li>
                  <li>• Project-based conversations</li>
                  <li>• Group chats with multiple participants</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={startingConversation}
                >
                  Cancel
                </button>
                {messageRecipient && autoStartConversation && (
                  <button
                    onClick={async () => {
                      try {
                        await startConversation([messageRecipient.userId], {
                          type: messageType,
                          title: `Chat with ${messageRecipient.name}`,
                          ...messageJobContext
                        });
                        setShowNewConversation(false);
                      } catch (error) {
                        alert('Failed to start conversation: ' + error.message);
                      }
                    }}
                    disabled={startingConversation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {startingConversation && <Loader className="w-4 h-4 animate-spin" />}
                    Start Chat with {messageRecipient.name}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

  

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const typeSelect = document.querySelector('select');
            const contextFields = document.getElementById('contextFields');
            
            if (typeSelect && contextFields) {
              typeSelect.addEventListener('change', function(e) {
                if (e.target.value === 'job' || e.target.value === 'project') {
                  contextFields.style.display = 'block';
                } else {
                  contextFields.style.display = 'none';
                }
              });
            }
          });
        `
      }} />
    </div>
  );
};

export default MessagingSystem;