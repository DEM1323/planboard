import { useState } from "react";
import { useEditor, track, createShapeId, TLComponents } from "tldraw";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { PlanBoardKeyboardShortcuts } from "./PlanBoardKeyboardShortcuts";
import { ActiveUsersList, PresencePanel } from "./PresenceComponents";
import {
  Layers,
  Keyboard,
  Users,
  Plus,
  Clock,
  Edit3,
  Trash2,
  Grid3X3,
  Settings,
  X,
} from "lucide-react";

// Prevent event propagation to tldraw
const stopEventPropagation = (e: React.MouseEvent | React.KeyboardEvent) => {
  e.stopPropagation();
};

const SectionsTab = track(({ editor }: { editor: any }) => {
  const sections = editor
    .getCurrentPageShapes()
    .filter((shape: any) => shape.type === "section");

  const addSection = () => {
    const center = editor.getViewportScreenCenter();
    const pagePoint = editor.screenToPage(center);
    const shapeId = createShapeId();

    editor.createShape({
      id: shapeId,
      type: "section",
      x: pagePoint.x - 150,
      y: pagePoint.y - 100,
      props: {
        title: "New Section",
        startTime: "9:00 AM",
        endTime: "",
        emoji: "📅",
        details: "",
        color: "blue",
        size: "m",
        w: 300,
        h: 200,
      },
    });

    editor.select(shapeId);
    setTimeout(() => {
      editor.setEditingShape(shapeId);
    }, 100);
  };

  const formatTimeDisplay = (section: any) => {
    const { startTime, endTime } = section.props;
    const hasEndTime = endTime && endTime.trim() !== "";
    if (hasEndTime) {
      return `${startTime} - ${endTime}`;
    }
    return startTime;
  };

  return (
    <div
      className="space-y-4"
      onMouseDown={stopEventPropagation}
      onKeyDown={stopEventPropagation}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Time Sections</h4>
        <Button size="sm" onClick={addSection}>
          <Plus className="h-4 w-4 mr-1" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No sections yet</p>
          <p className="text-xs">Add time sections to organize your plan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section: any) => (
            <div
              key={section.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{section.props.emoji}</span>
                <div>
                  <p className="text-sm font-medium">{section.props.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimeDisplay(section)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    editor.select(section.id);
                    editor.setEditingShape(section.id);
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.deleteShapes([section.id])}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const ActivitiesTab = track(({ editor }: { editor: any }) => {
  const activities = editor
    .getCurrentPageShapes()
    .filter((shape: any) => shape.type === "activity");

  const addActivity = () => {
    const center = editor.getViewportScreenCenter();
    const pagePoint = editor.screenToPage(center);
    const shapeId = createShapeId();

    editor.createShape({
      id: shapeId,
      type: "activity",
      x: pagePoint.x - 90,
      y: pagePoint.y - 50,
      props: {
        title: "New Activity",
        description: "Activity description",
        venue: "",
        isCustom: true,
        votes: 0,
        color: "green",
        size: "m",
        w: 180,
        h: 100,
      },
    });

    editor.select(shapeId);
    setTimeout(() => {
      editor.setEditingShape(shapeId);
    }, 100);
  };

  return (
    <div
      className="space-y-4"
      onMouseDown={stopEventPropagation}
      onKeyDown={stopEventPropagation}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Activities</h4>
        <Button size="sm" onClick={addActivity}>
          <Plus className="h-4 w-4 mr-1" />
          Add Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Grid3X3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activities yet</p>
          <p className="text-xs">Add activities to your plan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity: any) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded border"
            >
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-sm font-medium">{activity.props.title}</p>
                  {activity.props.venue && (
                    <p className="text-xs text-gray-500">
                      {activity.props.venue}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {activity.props.votes > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activity.props.votes}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    editor.select(activity.id);
                    editor.setEditingShape(activity.id);
                  }}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.deleteShapes([activity.id])}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const SettingsTab = track(({ editor }: { editor: any }) => {
  return (
    <div
      className="space-y-4"
      onMouseDown={stopEventPropagation}
      onKeyDown={stopEventPropagation}
    >
      <h4 className="font-medium">Plan Settings</h4>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Show grid</span>
          <button
            onClick={() =>
              editor.updateInstanceState({
                isGridMode: !editor.getInstanceState().isGridMode,
              })
            }
          >
            {editor.getInstanceState().isGridMode ? "On" : "Off"}
          </button>
        </div>
      </div>
    </div>
  );
});

// Plan Board Action Panel - shows when plan-board tool is active
export const PlanBoardActionPanel = track(() => {
  const editor = useEditor();
  const isActive = editor.getCurrentToolId() === "plan-board";

  const [activeTab, setActiveTab] = useState<
    "sections" | "activities" | "settings"
  >("sections");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);



  // Don't render if tool is not active
  if (!isActive) return null;

  return (
    <div
      className="tldraw__plan-board-action-panel"
      style={{
        position: "absolute",
        top: "64px", // Below the toolbar
        right: "16px",
        zIndex: 1000,
        width: "320px",
        backgroundColor: "var(--color-background)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        fontFamily: "var(--tl-font-ui)",
        pointerEvents: "all",
      }}
      onMouseDown={stopEventPropagation}
      onMouseUp={stopEventPropagation}
      onClick={stopEventPropagation}
      onKeyDown={stopEventPropagation}
      onWheel={stopEventPropagation}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-sm">Plan Board</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts"
            className="h-8 w-8 p-0"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.setCurrentTool("select")}
            className="h-8 w-8 p-0"
            title="Close plan board"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === "sections"
              ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("sections")}
          onMouseDown={stopEventPropagation}
        >
          Sections
        </button>
        <button
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === "activities"
              ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("activities")}
          onMouseDown={stopEventPropagation}
        >
          Activities
        </button>

        <button
          className={`flex-1 px-3 py-2 text-xs font-medium ${
            activeTab === "settings"
              ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          }`}
          onClick={() => setActiveTab("settings")}
          onMouseDown={stopEventPropagation}
        >
          Settings
        </button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === "sections" && <SectionsTab editor={editor} />}
        {activeTab === "activities" && <ActivitiesTab editor={editor} />}

        {activeTab === "settings" && <SettingsTab editor={editor} />}
      </div>

      <PlanBoardKeyboardShortcuts
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
});

// Keep the old PlanBoardPanel for backward compatibility but mark as deprecated
interface PlanBoardPanelProps {
  editor: any;
  users: any[];
  currentSessionId: string | undefined;
  isOnline: boolean;
  onClose: () => void;
}

/** @deprecated Use PlanBoardActionPanel instead */
export const PlanBoardPanel = track(
  ({
    editor,
    users,
    currentSessionId,
    isOnline,
    onClose,
  }: PlanBoardPanelProps) => {
    // ... existing code ...
    return null; // Deprecated, use PlanBoardActionPanel instead
  }
);

// Export the components object for use in Whiteboard.tsx
export const planBoardComponents: TLComponents = {
  // The action panel will be rendered as part of the UI
};
