import { useState, useRef } from "react";
import { ArrowLeft, Calendar, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { OnlineUsers } from "./OnlineUsers";
import { Id } from "../../convex/_generated/dataModel";

interface HeaderBarProps {
  // Plan data
  plan: {
    _id: Id<"plans">;
    title: string;
    date?: string;
    shareCode?: string;
  };
  shareCode: string;

  // Plan editing
  isOwner: boolean;
  isEditingTitle: boolean;
  editingTitle: string;
  planDate: string;
  isUpdating: boolean;

  // Online users data
  boardPresence: any[];
  currentSessionId: string | undefined;
  isOnline: boolean;

  // Event handlers
  onNavigateBack: () => void;
  onTitleEdit: () => void;
  onTitleSave: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent) => void;
  onTitleChange: (value: string) => void;
  onDateClick: (event: React.MouseEvent) => void; // Changed from onDateEdit
  onShareClick: () => void;
}

export function HeaderBar({
  plan,
  shareCode,
  isOwner,
  isEditingTitle,
  editingTitle,
  planDate,
  isUpdating,
  boardPresence,
  currentSessionId,
  isOnline,
  onNavigateBack,
  onTitleEdit,
  onTitleSave,
  onTitleKeyDown,
  onTitleChange,
  onDateClick,
  onShareClick,
}: HeaderBarProps) {
  const dateElementRef = useRef<HTMLSpanElement>(null);

  const handleDateClick = (e: React.MouseEvent) => {
    if (isOwner) {
      onDateClick(e);
    }
  };

  return (
    <header className="border-b bg-background z-10 shadow-sm">
      <div className="w-full px-4 py-3 flex items-center justify-between">
        {/* Left Section - Back button, title, and date */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateBack}
            className="flex items-center space-x-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          <div className="border-l border-gray-300 h-6 flex-shrink-0"></div>

          <div className="min-w-0 flex-1">
            {/* Editable Title */}
            {isEditingTitle ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={onTitleSave}
                onKeyDown={onTitleKeyDown}
                className="text-lg font-semibold bg-transparent border-b-2 border-primary focus:outline-none w-full"
                autoFocus
                disabled={isUpdating}
              />
            ) : (
              <h1
                className={`text-lg font-semibold truncate ${
                  isOwner
                    ? "cursor-pencil hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
                    : ""
                }`}
                onClick={isOwner ? onTitleEdit : undefined}
                style={{
                  cursor: isOwner
                    ? "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m18 2 4 4-14 14H4v-4L18 2z'/%3E%3Cpath d='m14.5 5.5 4 4'/%3E%3C/svg%3E\") 0 20, pointer"
                    : "default",
                }}
                title={isOwner ? "Click to edit plan title" : ""}
              >
                {plan.title}
              </h1>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {/* Calendar Date Display */}
              <div className="flex items-center relative">
                <Calendar className="h-3 w-3 mr-1" />
                {planDate ? (
                  <span
                    ref={dateElementRef}
                    className={`truncate ${
                      isOwner
                        ? "cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
                        : ""
                    }`}
                    onClick={handleDateClick}
                    title={isOwner ? "Click to change plan date" : ""}
                  >
                    {planDate}
                  </span>
                ) : isOwner ? (
                  <span
                    ref={dateElementRef}
                    className="text-muted-foreground/60 cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
                    onClick={handleDateClick}
                    title="Click to add plan date"
                  >
                    Add date
                  </span>
                ) : (
                  <span>No date set</span>
                )}
              </div>

              <div className="flex items-center">
                <span>Code: </span>
                <span className="font-mono font-semibold ml-1">
                  {shareCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-l border-gray-300 h-8 mx-4 flex-shrink-0"></div>

        {/* Right Section - Online users and share button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Online Users Widget - now inline instead of fixed positioned */}
          <div className="relative">
            <OnlineUsers
              users={boardPresence}
              currentSessionId={currentSessionId}
              isOnline={isOnline}
            />
          </div>

          <Button variant="outline" onClick={onShareClick}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </header>
  );
}
