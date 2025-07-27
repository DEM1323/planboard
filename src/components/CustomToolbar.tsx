import {
  track,
  DefaultToolbar,
  DefaultToolbarContent,
  TldrawUiMenuItem,
  useTools,
  useIsToolSelected,
} from "tldraw";

interface CustomToolbarProps {
  editor: any;
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
}

export const CustomToolbar = track(
  ({
    editor,
    users,
    currentSessionId,
    isOnline,
    ...props
  }: CustomToolbarProps) => {
    const tools = useTools();
    const isPlanBoardSelected = useIsToolSelected(tools["plan-board"]);

    return (
      <DefaultToolbar {...props}>
        {/* Add the plan board tool as the first item */}
        <TldrawUiMenuItem
          {...tools["plan-board"]}
          isSelected={isPlanBoardSelected}
        />
        {/* Default toolbar content includes all other tools */}
        <DefaultToolbarContent />
      </DefaultToolbar>
    );
  }
);
