import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Send, Search, MoreVertical, Phone, Video, Paperclip, 
  Smile, ArrowLeft, MessageSquare, Users, Clock, 
  Check, CheckCheck, X, Edit2, Trash2, Reply,
  UserPlus, Settings, Circle, AlertCircle, Loader, Menu,
  ChevronDown, Archive, Info
} from 'lucide-react';

const token = localStorage.getItem("access_token");

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
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
  apiBaseUrl = 'https://kamcomuser.duckdns.org',
  wsBaseUrl = 'wss://kamcomuser.duckdns.org/ws',
  initialConversationId = null,
  onNewMessage = null,
  onConversationChange = null,
  showSidebar: initialShowSidebar = true,
  showHeader = true,
  allowNewConversations = true,
  customUserRenderer = null,
  theme = 'default',
  messageRecipient = null,
  messageJobContext = null,
  messageType = 'direct',
  autoStartConversation = false,
  initialMessage = null,
  onConversationStarted = null,
}) => {
  const userId = currentUserId;
  const [showSidebar, setShowSidebar] = useState(initialShowSidebar);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [showMessageActions, setShowMessageActions] = useState(null);
  const [deletingConversation, setDeletingConversation] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Refs
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const userFetchCache = useRef(new Set());
  const conversationCreationInProgress = useRef(new Set()); // Track ongoing conversation creation

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !initialShowSidebar) {
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initialShowSidebar]);

  // Auto-hide sidebar on mobile when conversation is selected
  useEffect(() => {
    if (isMobile && activeConversation) {
      setShowSidebar(false);
    }
  }, [activeConversation, isMobile]);

  const fetchUserProfile = useCallback(async (userIdToFetch) => {
    if (!userIdToFetch || userProfiles.has(userIdToFetch) || userFetchCache.current.has(userIdToFetch)) {
      return userProfiles.get(userIdToFetch);
    }

    userFetchCache.current.add(userIdToFetch);

    try {
      const response = await fetch(`https://kamcomuser.duckdns.org/api/auth/users/${userIdToFetch}/profile/`, {
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
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
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
  }, [userProfiles]);

  const fetchConversationUsers = useCallback(async (conversationsList) => {
    const userIds = new Set();
    
    conversationsList.forEach(conv => {
      if (conv.participants && Array.isArray(conv.participants)) {
        conv.participants.forEach(id => userIds.add(String(id)));
      }
    });

    const promises = Array.from(userIds).map(id => fetchUserProfile(id));
    await Promise.all(promises);
  }, [fetchUserProfile]);

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
          throw new Error('Authentication failed');
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

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      setDeletingConversation(conversationId);
      
      await apiCall(`/notifications/conversations/${conversationId}/update/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: false }),
      });

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
        if (isMobile) {
          setShowSidebar(true);
        }
      }

      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation');
    } finally {
      setDeletingConversation(null);
    }
  }, [activeConversation, apiCall, isMobile]);

  // Edit message
  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      const response = await apiCall(`/messages/${messageId}/edit/`, {
        method: 'PATCH',
        body: JSON.stringify({ content: newContent }),
      });

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, ...response, is_edited: true } : msg
      ));

      setEditingMessage(null);
    } catch (error) {
      console.error('Failed to edit message:', error);
      alert('Failed to edit message');
    }
  }, [apiCall]);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await apiCall(`/messages/${messageId}/delete/`, {
        method: 'DELETE',
      });

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_deleted: true, content: 'Message deleted' } : msg
      ));

      setShowMessageActions(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message');
    }
  }, [apiCall]);

  const startConversation = useCallback(async (participantIds, conversationOptions = {}) => {
    try {
      const {
        type = messageType,
        title = '',
        jobId = messageJobContext?.jobId,
        bidId = messageJobContext?.bidId,
        projectId = messageJobContext?.projectId,
        initialMessage: initialMsg = null
      } = conversationOptions;

      const allParticipants = [...new Set([String(userId), ...participantIds.map(id => String(id))])];
      
      // Create a unique key for this conversation attempt
      const conversationKey = type === 'job' && jobId 
        ? `job-${jobId}-${allParticipants.sort().join('-')}`
        : type === 'project' && projectId
        ? `project-${projectId}-${allParticipants.sort().join('-')}`
        : `${type}-${allParticipants.sort().join('-')}`;

      // Check if we're already creating this conversation
      if (conversationCreationInProgress.current.has(conversationKey)) {
        console.log('Conversation creation already in progress for:', conversationKey);
        return;
      }

      setStartingConversation(true);

      // Check for existing conversation more thoroughly
      let existingConversation = null;
      
      if (type === 'direct' && allParticipants.length === 2) {
        // Check in local state first
        existingConversation = conversations.find(conv => 
          conv.conversation_type === 'direct' &&
          conv.participants.length === 2 &&
          conv.participants.every(p => allParticipants.includes(String(p)))
        );
      } else if (type === 'job' && jobId) {
        // For job conversations, check by job_id
        existingConversation = conversations.find(conv => 
          conv.job_id === jobId &&
          conv.participants.every(p => allParticipants.includes(String(p)))
        );
      } else if (type === 'project' && projectId) {
        // For project conversations, check by project_id
        existingConversation = conversations.find(conv => 
          conv.project_id === projectId &&
          conv.participants.every(p => allParticipants.includes(String(p)))
        );
      }

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        setActiveConversation(existingConversation);
        if (isMobile) setShowSidebar(false);
        
        // Set initial message if provided
        if (initialMsg) {
          setMessageText(initialMsg);
        }
        
        if (onConversationStarted) {
          onConversationStarted(existingConversation);
        }
        return existingConversation;
      }

      // Mark that we're creating this conversation
      conversationCreationInProgress.current.add(conversationKey);

      // Create new conversation
      const requestData = {
        participant_ids: allParticipants,
        type: type,
        title: title || generateConversationTitle(type, allParticipants),
        job_id: jobId || null,
        bid_id: bidId || null,
        project_id: projectId || null,
      };

      console.log('Creating new conversation:', requestData);

      const response = await apiCall('/notifications/conversations/start/', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      console.log('Conversation created:', response.id);

      // Add to conversations list only if not already present
      setConversations(prev => {
        const existing = prev.find(c => c.id === response.id);
        if (existing) {
          console.log('Conversation already exists in list, updating');
          return prev.map(c => c.id === response.id ? response : c);
        }
        console.log('Adding new conversation to list');
        return [response, ...prev];
      });

      setActiveConversation(response);
      if (isMobile) setShowSidebar(false);

      await Promise.all(response.participants.map(id => fetchUserProfile(String(id))));

      if (initialMsg) {
        setMessageText(initialMsg);
      }

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
      // Clear the in-progress flag after a short delay
      setTimeout(() => {
        const key = messageType === 'job' && messageJobContext?.jobId 
          ? `job-${messageJobContext.jobId}-${participantIds.sort().join('-')}`
          : messageType === 'project' && messageJobContext?.projectId
          ? `project-${messageJobContext.projectId}-${participantIds.sort().join('-')}`
          : `${messageType}-${participantIds.sort().join('-')}`;
        conversationCreationInProgress.current.delete(key);
      }, 2000);
    }
  }, [userId, messageType, messageJobContext, conversations, apiCall, fetchUserProfile, onConversationStarted, isMobile]);

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

  useEffect(() => {
    if (autoStartConversation && messageRecipient && messageRecipient.userId && !startingConversation) {
      const existingConversation = conversations.find(conv => 
        conv.conversation_type === (messageType || 'direct') &&
        conv.participants.includes(String(messageRecipient.userId)) &&
        conv.participants.includes(String(userId))
      );

      if (existingConversation) {
        setActiveConversation(existingConversation);
        if (isMobile) setShowSidebar(false);
        if (onConversationStarted) {
          onConversationStarted(existingConversation);
        }
      } else {
        startConversation([messageRecipient.userId], {
          type: messageType,
          title: messageRecipient.name ? `Chat with ${messageRecipient.name}` : undefined,
          initialMessage: initialMessage
        }).catch(error => {
          console.error('Failed to auto-start conversation:', error);
        });
      }
    }
  }, [autoStartConversation, messageRecipient, messageType, conversations, userId, startConversation, onConversationStarted, initialMessage, startingConversation, isMobile]);

  useEffect(() => {
    if (initialMessage && initialMessage !== messageText) {
      setMessageText(initialMessage);
    }
  }, [initialMessage]);

  // WebSocket setup
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
        const ws = new WebSocket(`${wsBaseUrl}/messaging/?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
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
          setWsConnected(false);
          
          if (event.code === 4001) {
            setConnectionError('Authentication failed: Token missing');
          } else if (event.code === 4002) {
            setConnectionError('Authentication failed: Invalid token');
          } else if (event.code !== 1000 && token && userId) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            
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
    fetchUserProfile(String(message.sender_id));
    
    setMessages(prev => {
      if (prev.some(msg => msg.id === message.id)) {
        return prev;
      }
      
      if (String(message.sender_id) === String(userId)) {
        const tempIndex = prev.findIndex(
          msg => msg.tempId && 
          msg.conversation === (message.conversation || message.conversation_id) &&
          msg.sender_id === String(message.sender_id) &&
          msg.content === message.content &&
          Math.abs(new Date(msg.created_at) - new Date(message.created_at)) < 30000
        );
        
        if (tempIndex !== -1) {
          const newMessages = [...prev];
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
      
      if (String(message.sender_id) !== String(userId)) {
        return [...prev, message];
      }
      
      const nearDuplicate = prev.find(
        msg => !msg.tempId &&
        msg.sender_id === String(message.sender_id) &&
        msg.content === message.content &&
        Math.abs(new Date(msg.created_at) - new Date(message.created_at)) < 5000
      );
      
      if (nearDuplicate) {
        return prev;
      }
      
      return [...prev, message];
    });
    
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

  const handleTypingIndicator = useCallback(({ user_id, conversation_id, is_typing }) => {
    if (activeConversation?.id === conversation_id && String(user_id) !== String(userId)) {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (is_typing) {
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

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'message':
        if (data.data && (String(data.data.sender_id) !== String(userId) || data.data.id)) {
          handleNewMessage(data.data);
        }
        break;
      case 'message_sent':
        if (data.data && String(data.data.sender_id) === String(userId)) {
          setMessages(prev => prev.map(msg => {
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
        break;
      case 'connection_established':
        break;
      default:
        break;
    }
  }, [userId, handleNewMessage, handleTypingIndicator, handleReadReceipt, handleUserStatusUpdate]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/notifications/conversations/');
      
      const conversationsArray = data.results || data || [];
      setConversations(conversationsArray);
      
      await fetchConversationUsers(conversationsArray);
      
      const counts = {};
      conversationsArray.forEach(conv => {
        counts[conv.id] = conv.unread_count || 0;
      });
      setUnreadCounts(counts);
      
      if (initialConversationId && conversationsArray.length > 0) {
        const initialConv = conversationsArray.find(c => c.id === initialConversationId);
        if (initialConv) {
          setActiveConversation(initialConv);
          if (isMobile) setShowSidebar(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConnectionError(`Failed to fetch conversations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const data = await apiCall(`/notifications/conversations/${conversationId}/messages/`);
      
      const messagesArray = data.results || data || [];
      const sortedMessages = messagesArray.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(sortedMessages);

      const senderIds = [...new Set(messagesArray.map(msg => String(msg.sender_id)))];
      await Promise.all(senderIds.map(id => fetchUserProfile(id)));

    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setConnectionError(`Failed to fetch messages: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !activeConversation) return;

    const messageContent = messageText.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await fetchUserProfile(String(userId));
    const currentUser = userProfiles.get(String(userId));
    
    if (!currentUser) {
      console.error('Current user profile not found');
      setConnectionError('User profile not loaded');
      return;
    }

    const tempMessage = {
      id: tempId,
      tempId: tempId,
      conversation: activeConversation.id,
      conversation_id: activeConversation.id,
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

    setMessages(prev => [...prev, tempMessage]);
    setMessageText('');
    setReplyToMessage(null);
    setEditingMessage(null);
    
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
        wsRef.current.send(JSON.stringify(messageData));
        
        setTimeout(() => {
          setMessages(prev => prev.map(msg =>
            msg.tempId === tempId ? { ...msg, sending: false } : msg
          ));
        }, 3000);
        
      } else {
        const response = await apiCall(`/notifications/conversations/${activeConversation.id}/send/`, {
          method: 'POST',
          body: JSON.stringify({
            content: messageContent,
            reply_to: replyToMessage?.id || null,
          }),
        });
        
        setMessages(prev => prev.map(msg =>
          msg.tempId === tempId ? { 
            ...response, 
            tempId: undefined, 
            sending: false,
            failed: false,
            sender_info: currentUser
          } : msg
        ));
      }

      if (onNewMessage) {
        onNewMessage(tempMessage, activeConversation);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(msg =>
        msg.tempId === tempId ? { ...msg, sending: false, failed: true } : msg
      ));
      setConnectionError(`Failed to send message: ${error.message}`);
    }
  };

  const selectConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    
    if (conversation.participants) {
      await Promise.all(conversation.participants.map(id => fetchUserProfile(String(id))));
    }

    if (isMobile) {
      setShowSidebar(false);
    }

    if (onConversationChange) {
      onConversationChange(conversation);
    }
  }, [fetchUserProfile, onConversationChange, isMobile]);

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

  const getConversationInfo = useCallback((conversation) => {
    if (!conversation) return null;

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

    return {
      title: conversation.title || 'Group Chat',
      subtitle: `${conversation.participants?.length || 0} members`,
      avatar: null,
      isOnline: false,
      userId: null,
      conversationType: 'group'
    };
  }, [getUserInfo, onlineUsers, userId]);

  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    handleTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 1000);
  };

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

  useEffect(() => {
    if (token && userId) {
      fetchUserProfile(String(userId)).then(() => {
        fetchConversations();
      });
    }
  }, [token, userId, fetchUserProfile]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      markConversationRead(activeConversation.id);
      joinConversation(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const convInfo = getConversationInfo(conv);
      const searchLower = searchQuery.toLowerCase();
      
      if (convInfo?.title?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      if (convInfo?.conversationType?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      if (conv.job_id && conv.job_id.toString().includes(searchLower)) {
        return true;
      }
      
      if (conv.project_id && conv.project_id.toString().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
  }, [conversations, searchQuery, getConversationInfo]);

  const getConnectionStatus = () => {
    if (!token) return { color: 'bg-red-500', text: 'Not authenticated' };
    if (connectionError) return { color: 'bg-red-500', text: 'Connection error' };
    if (wsConnected) return { color: 'bg-green-500', text: 'Connected' };
    return { color: 'bg-yellow-500', text: 'Connecting...' };
  };

  const connectionStatus = getConnectionStatus();

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
        <div className={`${isMobile ? 'fixed inset-0 z-50' : 'relative'} w-full md:w-80 bg-white border-r border-gray-200 flex flex-col`}>
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
              
              {connectionError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-700">{connectionError}</span>
                </div>
              )}

              {startingConversation && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <Loader className="w-4 h-4 text-blue-500 flex-shrink-0 animate-spin" />
                  <span className="text-xs text-blue-700">Starting conversation...</span>
                </div>
              )}
              
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
                    className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 relative group ${
                      activeConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div onClick={() => selectConversation(conversation)} className="flex items-center flex-1 min-w-0">
                      <div className="relative mr-3 flex-shrink-0">
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
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {convInfo?.title || 'Conversation'}
                            </h3>
                            {getConversationTypeBadge(conversation)}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
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

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(conversation.id);
                      }}
                      className="ml-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={deletingConversation === conversation.id}
                    >
                      {deletingConversation === conversation.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
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
                  <div className="flex items-center flex-1 min-w-0">
                    {(isMobile || !showSidebar) && (
                      <button
                        onClick={() => {
                          if (isMobile) {
                            setActiveConversation(null);
                            setShowSidebar(true);
                          } else {
                            setShowSidebar(!showSidebar);
                          }
                        }}
                        className="mr-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        {isMobile ? <ArrowLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                      </button>
                    )}
                    
                    <div className="relative mr-3 flex-shrink-0">
                      {(() => {
                        const convInfo = getConversationInfo(activeConversation);
                        return (
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
                    
                    <div className="flex-1 min-w-0">
                      {(() => {
                        const convInfo = getConversationInfo(activeConversation);
                        return (
                          <>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-semibold text-gray-900 truncate">
                                {convInfo?.title || 'Conversation'}
                              </h2>
                              {getConversationTypeBadge(activeConversation)}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {convInfo?.subtitle || 'Chat'}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowConversationMenu(!showConversationMenu)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative"
                    >
                      <MoreVertical className="w-5 h-5" />
                      
                      {showConversationMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(activeConversation.id);
                              setShowConversationMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Conversation
                          </button>
                        </div>
                      )}
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
                      
                      <div key={`message-${messageKey}`} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
                        {!isOwnMessage && (
                          <div className="mr-2 flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                              {senderInfo.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                          </div>
                        )}
                        
                        <div className="relative max-w-[75%] md:max-w-md">
                          <div className={`px-4 py-2 rounded-lg ${
                            isOwnMessage 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-900'
                          } ${message.sending ? 'opacity-60' : ''} ${message.failed ? 'border-2 border-red-300' : ''}
                          ${message.is_deleted ? 'italic opacity-50' : ''}`}>
                            
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
                            
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            
                            <div className={`flex items-center justify-between mt-1 text-xs ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span>{formatTime(message.created_at)}</span>
                              
                              <div className="flex items-center gap-1">
                                {message.is_edited && <span>edited</span>}
                                {message.sending && <span>sending...</span>}
                                {message.failed && <span className="text-red-300">failed</span>}
                                
                                {isOwnMessage && !message.sending && !message.failed && !message.is_deleted && (
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
                          </div>

                          {/* Message Actions */}
                          {isOwnMessage && !message.is_deleted && !message.sending && (
                            <div className="absolute right-0 top-0 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
                                <button
                                  onClick={() => {
                                    setEditingMessage(message);
                                    setMessageText(message.content);
                                    messageInputRef.current?.focus();
                                  }}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                  title="Edit message"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setReplyToMessage(message)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                  title="Reply"
                                >
                                  <Reply className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this message?')) {
                                      deleteMessage(message.id);
                                    }
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {!isOwnMessage && !message.is_deleted && (
                            <div className="absolute left-0 top-0 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
                                <button
                                  onClick={() => setReplyToMessage(message)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                  title="Reply"
                                >
                                  <Reply className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {isOwnMessage && (
                          <div className="ml-2 flex-shrink-0">
                            {(() => {
                              const currentUser = getUserInfo(userId);
                              return (
                                <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-blue-800 font-medium text-sm">
                                  {currentUser.username?.[0]?.toUpperCase()}
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
              
              {renderTypingIndicator()}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Edit/Reply Preview */}
            {(editingMessage || replyToMessage) && (
              <div className="bg-gray-100 border-t border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    {editingMessage ? (
                      <>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editing: <span className="ml-1 font-medium">{editingMessage.content.slice(0, 50)}...</span>
                      </>
                    ) : (
                      <>
                        <Reply className="w-4 h-4 mr-2" />
                        Replying to: <span className="ml-1 font-medium">{replyToMessage.content.slice(0, 50)}...</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingMessage(null);
                      setReplyToMessage(null);
                      setMessageText('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end gap-2 md:gap-3">
                <button className="hidden md:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
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
                        if (editingMessage) {
                          editMessage(editingMessage.id, messageText);
                        } else {
                          sendMessage();
                        }
                      }
                    }}
                    placeholder={
                      editingMessage ? 'Edit your message...' :
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
                
                <button className="hidden md:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Smile className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => {
                    if (editingMessage) {
                      editMessage(editingMessage.id, messageText);
                    } else {
                      sendMessage();
                    }
                  }}
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
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
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
              
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Conversations
                </button>
              )}
              
              {connectionError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Connection Issues</span>
                  </div>
                  <p>{connectionError}</p>
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

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Conversation</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this conversation? All messages will be permanently removed.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={deletingConversation}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConversation(confirmDelete)}
                disabled={deletingConversation}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deletingConversation && <Loader className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewConversation && allowNewConversations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversation Type
                </label>
                <select
                  id="conversationType"
                  defaultValue="direct"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    const contextFields = document.getElementById('contextFields');
                    if (contextFields) {
                      contextFields.style.display = ['job', 'project'].includes(e.target.value) ? 'block' : 'none';
                    }
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
                  id="userIdInput"
                  type="text"
                  placeholder="Enter user ID (e.g., 2, 3, 4, etc.)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const participantId = e.target.value.trim();
                      if (participantId !== userId) {
                        try {
                          const conversationType = document.getElementById('conversationType').value;
                          const jobId = document.getElementById('jobIdInput')?.value || null;
                          const title = document.getElementById('titleInput')?.value || null;
                          
                          await startConversation([participantId], { 
                            type: conversationType,
                            jobId: jobId,
                            title: title
                          });
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

              <div id="contextFields" style={{ display: 'none' }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job/Project ID (Optional)
                  </label>
                  <input
                    id="jobIdInput"
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
                    id="titleInput"
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

      {/* Click outside to close menus */}
      {showConversationMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowConversationMenu(false)}
        />
      )}
    </div>
  );
};

export default MessagingSystem;