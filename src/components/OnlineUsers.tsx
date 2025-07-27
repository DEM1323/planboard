import { ActiveUsersList, PresencePanel } from "./PresenceComponents";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";

interface OnlineUsersProps {
  users: any[];
  currentSessionId: string | undefined;
  isOnline: boolean;
}

export const OnlineUsers = ({
  users,
  currentSessionId,
  isOnline,
}: OnlineUsersProps) => {
  // Filter out current user and ensure users array is valid
  const otherUsers =
    users?.filter((user) => user.sessionId !== currentSessionId) || [];

  if (otherUsers.length < 1) return null;

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="bg-white rounded-lg shadow-sm border p-2 cursor-pointer hover:bg-gray-50 transition-colors">
            <ActiveUsersList
              users={users}
              currentSessionId={currentSessionId}
              maxVisible={4}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-2" align="end">
          <DropdownMenuLabel className="font-semibold">
            Online Users ({users.length})
          </DropdownMenuLabel>
          <PresencePanel
            users={users}
            currentSessionId={currentSessionId}
            isOnline={isOnline}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
