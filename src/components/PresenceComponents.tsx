import React, { useState, useEffect } from "react";
import { TLInstancePresence, track, useEditor } from "tldraw";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Users,
  MessageCircle,
  Edit3,
  Eye,
  Keyboard,
  Circle,
  WifiOff,
  Wifi,
  Clock,
} from "lucide-react";

// Individual user avatar component
interface UserAvatarProps {
  user: {
    sessionId: string;
    userName: string;
    userColor: string;
    userInitials: string;
    isEditing?: boolean;
    isTyping?: boolean;
    lastActivity: number;
  };
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  showTooltip?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = "md",
  showStatus = true,
  showTooltip = true,
}) => {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const isActive = Date.now() - user.lastActivity < 30000; // Active within 30 seconds

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white shadow-sm border-2 border-white transition-all duration-200 ${
          isActive ? "ring-2 ring-offset-1" : "opacity-75"
        }`}
        style={{
          backgroundColor: user.userColor,
          ...(isActive && ({ "--tw-ring-color": user.userColor } as any)),
        }}
        title={
          showTooltip
            ? `${user.userName}${user.isEditing ? " (editing)" : ""}${user.isTyping ? " (typing)" : ""}`
            : undefined
        }
      >
        {user.userInitials}
      </div>

      {showStatus && (
        <>
          {/* Editing indicator */}
          {user.isEditing && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white">
              <Edit3 className="w-2 h-2 text-white p-0.5" />
            </div>
          )}

          {/* Typing indicator */}
          {user.isTyping && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white">
              <Keyboard className="w-2 h-2 text-white p-0.5" />
            </div>
          )}

          {/* Activity status dot */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
              isActive ? "bg-green-400" : "bg-gray-400"
            }`}
          />
        </>
      )}
    </div>
  );
};

// Active users list component
interface ActiveUsersListProps {
  users: Array<{
    sessionId: string;
    userName: string;
    userColor: string;
    userInitials: string;
    isEditing?: boolean;
    isTyping?: boolean;
    lastActivity: number;
    joinedAt: number;
  }>;
  currentSessionId?: string;
  maxVisible?: number;
}

export const ActiveUsersList: React.FC<ActiveUsersListProps> = ({
  users,
  currentSessionId,
  maxVisible = 8,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const otherUsers = users.filter(
    (user) => user.sessionId !== currentSessionId
  );
  const visibleUsers = isExpanded
    ? otherUsers
    : otherUsers.slice(0, maxVisible);
  const hiddenCount = otherUsers.length - maxVisible;

  if (otherUsers.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Users className="w-4 h-4" />
        <span>You're the only one here</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="w-4 h-4 text-gray-600" />
      <div className="flex items-center gap-1">
        {visibleUsers.map((user) => (
          <UserAvatar
            key={user.sessionId}
            user={user}
            size="sm"
            showTooltip={true}
          />
        ))}

        {!isExpanded && hiddenCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0 text-xs bg-gray-100 hover:bg-gray-200 rounded-full"
            onClick={() => setIsExpanded(true)}
          >
            +{hiddenCount}
          </Button>
        )}

        {isExpanded && hiddenCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0 text-xs"
            onClick={() => setIsExpanded(false)}
          >
            <Circle className="w-3 h-3" />
          </Button>
        )}
      </div>

      <span className="text-sm text-gray-600">{otherUsers.length} online</span>
    </div>
  );
};

// User cursor component for TLDraw
interface UserCursorProps {
  user: {
    sessionId: string;
    userName: string;
    userColor: string;
    cursor?: { x: number; y: number };
    isEditing?: boolean;
    isTyping?: boolean;
  };
}

export const UserCursor: React.FC<UserCursorProps> = ({ user }) => {
  if (!user.cursor) return null;

  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-150"
      style={{
        left: user.cursor.x,
        top: user.cursor.y,
        transform: "translate(-2px, -2px)",
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="drop-shadow-sm"
      >
        <path
          d="M2 2L18 8L11 11L8 18L2 2Z"
          fill={user.userColor}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* User name label */}
      <div
        className="absolute left-5 top-0 px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-sm"
        style={{ backgroundColor: user.userColor }}
      >
        {user.userName}
        {user.isEditing && <Edit3 className="inline w-3 h-3 ml-1" />}
        {user.isTyping && <Keyboard className="inline w-3 h-3 ml-1" />}
      </div>
    </div>
  );
};

// Activity indicator component
interface ActivityIndicatorProps {
  isOnline: boolean;
  userCount: number;
  hasUnreadMessages?: boolean;
}

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  isOnline,
  userCount,
  hasUnreadMessages = false,
}) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Connection status */}
      <div className="flex items-center gap-1">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500" />
        )}
        <span className={isOnline ? "text-green-600" : "text-red-600"}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      {/* User count */}
      {userCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          <Users className="w-3 h-3 mr-1" />
          {userCount}
        </Badge>
      )}

      {/* Unread messages indicator */}
      {hasUnreadMessages && (
        <Badge variant="default" className="text-xs bg-blue-500">
          <MessageCircle className="w-3 h-3 mr-1" />
          New
        </Badge>
      )}
    </div>
  );
};

// Typing indicator component
interface TypingIndicatorProps {
  typingUsers: Array<{
    userName: string;
    userColor: string;
  }>;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
}) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`;
    } else {
      return `${typingUsers[0].userName} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 animate-pulse">
      <div className="flex gap-1">
        {typingUsers.slice(0, 3).map((user, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: user.userColor }}
          />
        ))}
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};

// Real-time activity feed component
interface ActivityFeedProps {
  activities: Array<{
    id: string;
    type: "join" | "leave" | "edit" | "message";
    userName: string;
    userColor: string;
    timestamp: number;
    details?: string;
  }>;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 5,
}) => {
  const recentActivities = activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxItems);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "join":
        return <Users className="w-3 h-3 text-green-500" />;
      case "leave":
        return <Users className="w-3 h-3 text-red-500" />;
      case "edit":
        return <Edit3 className="w-3 h-3 text-blue-500" />;
      case "message":
        return <MessageCircle className="w-3 h-3 text-purple-500" />;
      default:
        return <Circle className="w-3 h-3 text-gray-500" />;
    }
  };

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case "join":
        return `${activity.userName} joined`;
      case "leave":
        return `${activity.userName} left`;
      case "edit":
        return `${activity.userName} is editing`;
      case "message":
        return `${activity.userName}: ${activity.details}`;
      default:
        return `${activity.userName} did something`;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  if (recentActivities.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        <Clock className="w-4 h-4 mx-auto mb-1" />
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentActivities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-2 text-sm">
          {getActivityIcon(activity.type)}
          <div className="flex-1 min-w-0">
            <span className="text-gray-900">{getActivityText(activity)}</span>
            <div className="text-xs text-gray-500 mt-0.5">
              {formatTime(activity.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Custom TLDraw collaborator cursor component
export const CollaboratorCursor = track(
  (props: { presence: TLInstancePresence; className?: string }) => {
    const { presence } = props;
    const editor = useEditor();

    if (!presence.cursor) return null;

    const transform = editor.getCamera();
    const { x, y } = presence.cursor;

    // Transform cursor position to screen coordinates
    const screenPoint = editor.pageToScreen({ x, y });

    return (
      <div
        className="pointer-events-none absolute z-50"
        style={{
          left: screenPoint.x,
          top: screenPoint.y,
          transform: "translate(-2px, -2px)",
        }}
      >
        <UserCursor
          user={{
            sessionId: presence.userId,
            userName: presence.userName,
            userColor: presence.color,
            cursor: { x: 0, y: 0 }, // Already positioned by parent
            isEditing: false, // TODO: derive from presence
            isTyping: presence.chatMessage.length > 0,
          }}
        />
      </div>
    );
  }
);

// Enhanced presence panel component
interface PresencePanelProps {
  users: Array<{
    sessionId: string;
    userName: string;
    userColor: string;
    userInitials: string;
    isEditing?: boolean;
    isTyping?: boolean;
    lastActivity: number;
    joinedAt: number;
  }>;
  currentSessionId?: string;
  isOnline: boolean;
  onUserNameClick?: (sessionId: string) => void;
}

export const PresencePanel: React.FC<PresencePanelProps> = ({
  users,
  currentSessionId,
  isOnline,
  onUserNameClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeUsers = users.filter(
    (user) => Date.now() - user.lastActivity < 300000 // Active within 5 minutes
  );

  return (
    <div className="bg-white border rounded-lg shadow-sm p-3 min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">Active Users</h3>
        <Badge
          variant={isOnline ? "default" : "destructive"}
          className="text-xs"
        >
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {activeUsers.map((user) => (
          <div
            key={user.sessionId}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
              user.sessionId === currentSessionId
                ? "bg-blue-50 border border-blue-200"
                : "hover:bg-gray-50"
            }`}
            onClick={() => onUserNameClick?.(user.sessionId)}
          >
            <UserAvatar
              user={user}
              size="sm"
              showStatus={false}
              showTooltip={false}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {user.userName}
                  {user.sessionId === currentSessionId && " (you)"}
                </span>
                {user.isEditing && (
                  <Edit3 className="w-3 h-3 text-yellow-500" />
                )}
                {user.isTyping && (
                  <Keyboard className="w-3 h-3 text-green-500" />
                )}
              </div>
              <div className="text-xs text-gray-500">
                Joined {formatTimeAgo(user.joinedAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeUsers.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p>No active users</p>
        </div>
      )}
    </div>
  );
};

// Helper function
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
