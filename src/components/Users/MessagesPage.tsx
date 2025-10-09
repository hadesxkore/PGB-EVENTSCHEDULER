import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Users,
  Send, 
  Paperclip, 
  MoreVertical,
  Check,
  CheckCheck,
  Calendar,
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/hooks/useSocket';

interface User {
  id: string;
  name: string;
  email?: string;
  department: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'file';
}

interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  eventId?: string;
  eventTitle?: string;
}

const MessagesPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State for real event conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [unreadCounts, setUnreadCounts] = useState<{ [conversationId: string]: number }>({});

  // Initialize Socket.IO
  const { joinConversation, leaveConversation, onNewMessage, offNewMessage, onMessagesRead, offMessagesRead } = useSocket(currentUser?.id);

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('🔧 Current user data from localStorage:', user);
        
        const currentUserData = {
          id: user._id || '1',
          name: user.name || 'User',
          department: user.department || user.departmentName || 'Unknown',
          isOnline: true
        };
        
        console.log('🔧 Setting current user:', currentUserData);
        setCurrentUser(currentUserData);
        
        // Fetch events after setting current user
        fetchEventConversations(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch events and create conversations
  const fetchEventConversations = async (user: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const eventsData = await response.json();
      const events = eventsData.data || [];
      
      // Filter events where current user is involved
      const userDepartment = user.department || user.departmentName;
      const relevantEvents = events.filter((event: any) => {
        // Show events where user is requestor OR user's department is tagged
        return event.requestorDepartment === userDepartment || 
               (event.taggedDepartments && event.taggedDepartments.includes(userDepartment));
      });

      // Fetch users for tagged departments
      const conversationsPromises = relevantEvents.map(async (event: any) => {
        const participants: User[] = [];
        
        // Determine who the current user should see based on their role in the event
        const isRequestor = event.requestorDepartment === userDepartment;
        
        if (isRequestor) {
          // If current user is the requestor, show users from tagged departments
          console.log(`User is requestor for event: ${event.eventTitle}. Showing tagged department users.`);
          
          if (event.taggedDepartments) {
            for (const deptName of event.taggedDepartments) {
              try {
                // Fetch users from this department
                console.log(`Fetching users for department: ${deptName}`);
                const usersResponse = await fetch(`http://localhost:5000/api/users/department/${deptName}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (usersResponse.ok) {
                  const usersData = await usersResponse.json();
                  const deptUsers = usersData.data || usersData || [];
                  console.log(`Found ${deptUsers.length} users in department ${deptName}:`, deptUsers);
                  
                  // Add department users to participants
                  deptUsers.forEach((deptUser: any) => {
                    if (!participants.find(p => p.id === deptUser._id)) {
                      console.log(`Adding user: ${deptUser.email} from ${deptUser.department}`);
                      participants.push({
                        id: deptUser._id,
                        name: deptUser.email,
                        department: deptUser.department || deptUser.departmentName || deptName,
                        isOnline: Math.random() > 0.5, // Mock online status
                        lastSeen: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000)
                      });
                    }
                  });
                } else {
                  console.error(`Failed to fetch users for department ${deptName}:`, usersResponse.status, usersResponse.statusText);
                }
              } catch (error) {
                console.error(`Error fetching users for department ${deptName}:`, error);
              }
            }
          }
        } else {
          // If current user is from tagged department, show the requestor
          console.log(`User is from tagged department for event: ${event.eventTitle}. Showing requestor.`);
          
          participants.push({
            id: event.createdBy || 'unknown',
            name: event.requestor || 'Unknown Requestor',
            department: event.requestorDepartment || 'Unknown',
            isOnline: Math.random() > 0.5, // Mock online status
            lastSeen: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000)
          });
          
          // Also add other users from the same tagged department (colleagues)
          try {
            console.log(`Fetching colleagues from department: ${userDepartment}`);
            const usersResponse = await fetch(`http://localhost:5000/api/users/department/${userDepartment}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (usersResponse.ok) {
              const usersData = await usersResponse.json();
              const deptUsers = usersData.data || [];
              
              // Add department colleagues (excluding current user)
              deptUsers.forEach((deptUser: any) => {
                if (deptUser._id !== user._id && !participants.find(p => p.id === deptUser._id)) {
                  participants.push({
                    id: deptUser._id,
                    name: deptUser.email,
                    department: deptUser.department || deptUser.departmentName || userDepartment,
                    isOnline: Math.random() > 0.5, // Mock online status
                    lastSeen: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000)
                  });
                }
              });
            }
          } catch (error) {
            console.error(`Error fetching colleagues from department ${userDepartment}:`, error);
          }
        }

        console.log(`Final participants for event "${event.eventTitle}":`, participants.length, participants);
        console.log(`Current user department: ${userDepartment}, Event requestor department: ${event.requestorDepartment}`);
        console.log(`Is current user requestor: ${isRequestor}`);
        
        return {
          id: event._id,
          participants,
          lastMessage: {
            id: 'placeholder',
            senderId: event.createdBy || 'unknown',
            content: `Event "${event.eventTitle}" has been created. Let's coordinate the requirements!`,
            timestamp: new Date(event.createdAt || Date.now()),
            isRead: true,
            type: 'text' as const
          },
          unreadCount: 0, // Will be updated when real messages are implemented
          isGroup: true,
          groupName: event.eventTitle,
          eventId: event._id,
          eventTitle: event.eventTitle
        };
      });

      const conversations = await Promise.all(conversationsPromises);
      setConversations(conversations);
      setLoading(false);
      
      // Conversation data will be fetched by useEffect when conversations state updates
      
    } catch (error) {
      console.error('Error fetching event conversations:', error);
      setConversations([]);
      setLoading(false);
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation, messages]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.participants.some(p => p.name.toLowerCase().includes(searchLower)) ||
      conv.groupName?.toLowerCase().includes(searchLower) ||
      conv.eventTitle?.toLowerCase().includes(searchLower) ||
      conv.lastMessage.content.toLowerCase().includes(searchLower)
    );
  });

  // Get selected conversation data
  const selectedConv = conversations.find(c => c.id === selectedConversation?.split('-')[0]);
  const selectedUserId = selectedConversation?.split('-')[1];
  const selectedUser = selectedConv?.participants.find(p => {
    // Handle both string and object ID cases
    const participantId = typeof p.id === 'object' ? (p.id as any)._id : p.id;
    return participantId === selectedUserId;
  });
  const conversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];
  
  console.log('🔍 Selected conversation debug:', {
    selectedConversation,
    selectedConvId: selectedConversation?.split('-')[0],
    selectedUserId,
    selectedUserIdType: typeof selectedUserId,
    selectedUser,
    selectedUserName: selectedUser?.name,
    participants: selectedConv?.participants
  });

  // Fetch messages and unread counts for all conversations
  const fetchAllConversationDataForConversations = async (conversationsToFetch: Conversation[]) => {
    if (!currentUser) {
      console.log('❌ No current user, skipping conversation data fetch');
      return;
    }
    
    console.log('🔄 Fetching all conversation data for', conversationsToFetch.length, 'conversations');
    
    try {
      const token = localStorage.getItem('authToken');
      const counts: { [conversationId: string]: number } = {};
      const allMessages: { [conversationId: string]: Message[] } = {};
      
      for (const conv of conversationsToFetch) {
        for (const participant of conv.participants) {
          if (participant.id !== currentUser.id) {
            const participantId = typeof participant.id === 'object' ? (participant.id as any)._id : participant.id;
            const conversationId = `${conv.id}-${participantId}`;
            console.log(`🔄 Fetching data for conversation: ${conversationId}`);
            
            try {
              // Fetch messages for this conversation
              const messagesResponse = await fetch(`http://localhost:5000/api/messages/conversation/${conv.eventId || conv.id}/${participantId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (messagesResponse.ok) {
                const messagesData = await messagesResponse.json();
                allMessages[conversationId] = messagesData.data || [];
                console.log(`✅ Loaded ${messagesData.data?.length || 0} messages for ${conversationId}`);
              } else {
                console.log(`❌ Failed to fetch messages for ${conversationId}:`, messagesResponse.status);
              }
              
              // Fetch unread count for this conversation
              const unreadResponse = await fetch(`http://localhost:5000/api/messages/unread-count/${conv.eventId || conv.id}/${participantId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (unreadResponse.ok) {
                const unreadData = await unreadResponse.json();
                counts[conversationId] = unreadData.data.unreadCount;
                console.log(`✅ Unread count for ${conversationId}: ${unreadData.data.unreadCount}`);
              } else {
                console.log(`❌ Failed to fetch unread count for ${conversationId}:`, unreadResponse.status);
              }
            } catch (error) {
              console.error(`❌ Error fetching data for ${conversationId}:`, error);
            }
          }
        }
      }
      
      setMessages(allMessages);
      setUnreadCounts(counts);
      console.log('📊 Loaded all conversation data:', { messageCount: Object.keys(allMessages).length, unreadCounts: counts });
    } catch (error) {
      console.error('Error fetching all conversation data:', error);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (eventId: string, userId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      console.log(`🔍 Fetching messages for eventId: ${eventId}, userId: ${userId}, currentUser: ${currentUser?.id}`);
      
      const response = await fetch(`http://localhost:5000/api/messages/conversation/${eventId}/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const messagesData = await response.json();
        console.log(`📨 Fetched ${messagesData.data?.length || 0} messages:`, messagesData.data);
        setMessages(prev => ({
          ...prev,
          [`${eventId}-${userId}`]: messagesData.data || []
        }));
      } else {
        console.error('Failed to fetch messages:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && selectedConv && selectedUserId && typeof selectedUserId === 'string') {
      console.log('🔍 About to fetch messages with:', {
        eventId: selectedConv.eventId || selectedConv.id,
        userId: selectedUserId,
        userIdType: typeof selectedUserId
      });
      fetchMessages(selectedConv.eventId || selectedConv.id, selectedUserId);
    } else {
      console.log('🚨 Cannot fetch messages - invalid parameters:', {
        selectedConversation,
        selectedConv: !!selectedConv,
        selectedUserId,
        selectedUserIdType: typeof selectedUserId
      });
    }
  }, [selectedConversation, selectedConv, selectedUserId]);

  // Set up real-time message listener
  useEffect(() => {
    onNewMessage((data: any) => {
      console.log('🔔 Received new message:', data);
      const { message, conversationId } = data;
      
      // Add message to the appropriate conversation
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), message]
      }));
      
      // Update unread count if not in current conversation
      if (conversationId !== selectedConversation) {
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1
        }));
      }
      
      // Don't refresh all conversation data on every new message to avoid performance issues
      // The message is already added to the local state above
    });

    // Cleanup listener on unmount
    return () => {
      offNewMessage();
    };
  }, [onNewMessage, offNewMessage, selectedConversation]);

  // Set up real-time seen status listener
  useEffect(() => {
    console.log('🔧 Setting up messages-seen listener for user:', currentUser?.id);
    
    onMessagesRead((data: any) => {
      console.log('👀 Received seen status update:', data);
      console.log('👀 Current user ID:', currentUser?.id);
      console.log('👀 Current messages state:', Object.keys(messages));
      const { eventId, readerId } = data;
      
      // Update messages to mark them as read
      setMessages(prev => {
        const updatedMessages = { ...prev };
        
        // Find the conversation and mark sender's messages as read
        Object.keys(updatedMessages).forEach(convId => {
          if (convId.startsWith(eventId)) {
            updatedMessages[convId] = updatedMessages[convId].map(message => {
              // Mark as read if current user sent the message and it was read by the reader
              if (message.senderId === currentUser?.id || (message.senderId as any)?._id === currentUser?.id) {
                return { ...message, isRead: true };
              }
              return message;
            });
          }
        });
        
        return updatedMessages;
      });
      
      console.log(`👀 Updated seen status for messages in event ${eventId} seen by ${readerId}`);
    });

    // Cleanup listener on unmount
    return () => {
      offMessagesRead();
    };
  }, [onMessagesRead, offMessagesRead, currentUser?.id]);

  // Fetch all conversation data when conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && currentUser) {
      console.log('🔄 Conversations loaded, fetching all conversation data...');
      fetchAllConversationDataForConversations(conversations);
    }
  }, [conversations.length, currentUser?.id]);

  // Join/leave conversation rooms when selection changes
  useEffect(() => {
    if (selectedConversation && selectedConv && selectedUserId) {
      const conversationRoomId = `${selectedConv.eventId || selectedConv.id}-${currentUser?.id}-${selectedUserId}`;
      joinConversation(conversationRoomId);
      
      return () => {
        leaveConversation(conversationRoomId);
      };
    }
  }, [selectedConversation, selectedConv, selectedUserId, currentUser?.id, joinConversation, leaveConversation]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !selectedConv || !selectedUserId) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: selectedConv.eventId || selectedConv.id,
          receiverId: selectedUserId,
          content: newMessage.trim(),
          messageType: 'text'
        })
      });

      if (response.ok) {
        const messageData = await response.json();
        console.log('Message sent successfully:', messageData);
        
        // Add the new message to local state
        setMessages(prev => ({
          ...prev,
          [selectedConversation]: [...(prev[selectedConversation] || []), messageData.data]
        }));
        
        setNewMessage('');
      } else {
        console.error('Failed to send message:', response.status);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Get conversation display name
  const getConversationName = (conv: Conversation) => {
    if (conv.isGroup) {
      return conv.groupName || 'Group Chat';
    }
    const otherParticipant = conv.participants.find(p => p.id !== currentUser?.id);
    return otherParticipant?.name || 'Unknown User';
  };

  // Get conversation avatar
  const getConversationAvatar = (conv: Conversation) => {
    if (conv.isGroup) {
      return conv.groupName?.charAt(0) || 'G';
    }
    const otherParticipant = conv.participants.find(p => p.id !== currentUser?.id);
    return otherParticipant?.name.charAt(0) || 'U';
  };

  // Format time
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };

  // Get latest message for a conversation
  const getLatestMessage = (conversationId: string) => {
    const conversationMessages = messages[conversationId] || [];
    if (conversationMessages.length === 0) return null;
    
    // Get the most recent message
    const latestMessage = conversationMessages[conversationMessages.length - 1];
    return latestMessage;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-7xl mx-auto h-[calc(100vh-3rem)] flex bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col rounded-l-lg">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Messages
            </h1>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Event Groups with Expandable Users */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-500 text-sm">
                Create or get tagged in events to start messaging with other departments
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
            const isExpanded = expandedEvents.has(conv.eventId || conv.id);
            const taggedDepartments = [...new Set(conv.participants.map(p => p.department))];
            const onlineCount = conv.participants.filter(p => p.isOnline).length;
            const totalParticipants = conv.participants.length;
            
            const toggleExpanded = (e: React.MouseEvent) => {
              e.stopPropagation();
              const eventKey = conv.eventId || conv.id;
              const newExpanded = new Set(expandedEvents);
              if (isExpanded) {
                newExpanded.delete(eventKey);
              } else {
                newExpanded.add(eventKey);
              }
              setExpandedEvents(newExpanded);
            };
            
            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border-b border-gray-100"
              >
                {/* Event Group Header */}
                <div 
                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={toggleExpanded}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate text-gray-900">
                          {conv.eventTitle}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(conv.lastMessage.timestamp)}
                        </span>
                      </div>
                      
                      {/* Tagged Departments */}
                      <div className="flex flex-wrap gap-1 mb-1">
                        {taggedDepartments.slice(0, 2).map((dept) => (
                          <Badge key={dept} variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                            {dept}
                          </Badge>
                        ))}
                        {taggedDepartments.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-600 border-gray-200">
                            +{taggedDepartments.length - 2}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Participants Count */}
                      <p className="text-xs text-gray-500">
                        👥 {totalParticipants} participants • {onlineCount} online
                      </p>
                    </div>
                    
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Expanded Users List */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50"
                  >
                    {conv.participants.map((user) => {
                      const actualUserId = typeof user.id === 'object' ? (user.id as any)._id : user.id;
                      const isUserSelected = selectedConversation === `${conv.id}-${actualUserId}`;
                      const isCurrentUser = actualUserId === currentUser?.id;
                      
                      return (
                        <div
                          key={user.id}
                          className={`pl-12 pr-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors border-l-2 ${
                            isUserSelected ? 'bg-blue-50 border-l-blue-600' : 'border-l-transparent'
                          }`}
                          onClick={() => {
                            console.log('🔍 Clicking user:', user);
                            // Extract the actual user ID - handle both string and object cases
                            const actualUserId = typeof user.id === 'object' ? (user.id as any)._id : user.id;
                            console.log('🔍 Actual User ID:', actualUserId, 'Type:', typeof actualUserId);
                            console.log('🔍 Conv ID:', conv.id, 'Type:', typeof conv.id);
                            const conversationId = `${conv.id}-${actualUserId}`;
                            console.log('🔍 Setting conversation ID:', conversationId);
                            setSelectedConversation(conversationId);
                            
                            // Clear unread count for this conversation
                            setUnreadCounts(prev => ({
                              ...prev,
                              [conversationId]: 0
                            }));
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className={`text-xs ${
                                  isCurrentUser ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {user.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {user.name} {isCurrentUser && '(You)'}
                                </p>
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const actualUserId = typeof user.id === 'object' ? (user.id as any)._id : user.id;
                                    const conversationId = `${conv.id}-${actualUserId}`;
                                    const unreadCount = unreadCounts[conversationId] || 0;
                                    
                                    return (
                                      <>
                                        {unreadCount > 0 && !isCurrentUser && (
                                          <Badge className="bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                          </Badge>
                                        )}
                                        {!user.isOnline && user.lastSeen && (
                                          <span className="text-xs text-gray-400">
                                            {formatMessageTime(user.lastSeen)}
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                              {(() => {
                                const actualUserId = typeof user.id === 'object' ? (user.id as any)._id : user.id;
                                const conversationId = `${conv.id}-${actualUserId}`;
                                const latestMessage = getLatestMessage(conversationId);
                                
                                if (latestMessage) {
                                  const isOwnMessage = latestMessage.senderId === currentUser?.id || (latestMessage.senderId as any)?._id === currentUser?.id;
                                  const messagePreview = latestMessage.content.length > 30 
                                    ? latestMessage.content.substring(0, 30) + '...' 
                                    : latestMessage.content;
                                  
                                  return (
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-gray-500 truncate">
                                        {isOwnMessage ? 'You: ' : ''}{messagePreview}
                                      </p>
                                      <span className="text-xs text-gray-400 ml-2">
                                        {formatMessageTime(new Date(latestMessage.timestamp))}
                                      </span>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <p className="text-xs text-gray-500">{user.department}</p>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            );
          })
          )}
        </div>
      </div>

      {/* Right Side - Chat Interface */}
      <div className="flex-1 flex flex-col rounded-r-lg bg-gray-50">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {selectedUser?.name?.charAt(0) || selectedUser?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">
                      {selectedUser?.name || selectedUser?.email || 'Unknown User'}
                    </h2>
                    <p className="text-sm text-blue-600">📅 {selectedConv.eventTitle}</p>
                    <p className="text-xs text-gray-500">
                      {selectedUser?.department} • {selectedUser?.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 pt-8 bg-gray-50">
              {conversationMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                  <p className="text-gray-500 text-sm">
                    Send a message to {selectedUser?.name} about "{selectedConv.eventTitle}"
                  </p>
                </div>
              ) : (
                conversationMessages.map((message: any) => {
                  const isOwnMessage = message.senderId._id === currentUser?.id || message.senderId === currentUser?.id;
                  const senderInfo = message.senderId._id ? message.senderId : selectedUser;
                  
                  return (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                        {!isOwnMessage && (
                          <p className="text-xs text-gray-500 mb-1 ml-2">
                            {senderInfo?.department}
                          </p>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-500">
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </span>
                          {isOwnMessage && (
                            <div className="flex items-center gap-1">
                              {message.isRead ? (
                                <div className="flex items-center gap-1 text-blue-600" title="Seen">
                                  <CheckCheck className="w-3 h-3" />
                                  <span className="text-xs">Seen</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-gray-400" title="Delivered">
                                  <Check className="w-3 h-3" />
                                  <span className="text-xs">Delivered</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-10"
                  />
                  <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-r-lg">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default MessagesPage;
