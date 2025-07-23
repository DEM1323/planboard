import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  getSnapshot,
  loadSnapshot,
  TLUiOverrides,
  TLComponents,
  StateNode,
  BaseBoxShapeUtil,
  TLBaseShape,
  HTMLContainer,
  Rectangle2d,
  useEditor,
  track,
  TLShapeId,
  TLShapePartial,
  DefaultToolbar,
  DefaultToolbarContent,
  TldrawUiMenuItem,
  T,
  RecordProps,
  ShapeUtil,
  Geometry2d,
  TLPointerEventInfo,
  DefaultColorStyle,
  DefaultSizeStyle,
  TLDefaultColorStyle,
  TLDefaultSizeStyle,
  useDefaultColorTheme,
} from "tldraw";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { EditShapeModal } from "./components/EditShapeModal";
import { PlanBoardKeyboardShortcuts } from "./components/PlanBoardKeyboardShortcuts";

import {
  Plus,
  Clock,
  MapPin,
  Users,
  Vote,
  Calendar,
  Edit3,
  Trash2,
  Share2,
  Settings,
  Layers,
  Grid3X3,
  Keyboard,
} from "lucide-react";
import "tldraw/tldraw.css";

// ============================================================================
// CUSTOM SHAPES
// ============================================================================

// Section Shape
export type SectionShape = TLBaseShape<
  "section",
  {
    title: string;
    startTime: string;
    endTime: string;
    emoji: string;
    details: string;
    color: TLDefaultColorStyle;
    size: TLDefaultSizeStyle;
    w: number;
    h: number;
  }
>;

// Activity Shape
type ActivityShape = TLBaseShape<
  "activity",
  {
    title: string;
    description: string;
    venue: string;
    isCustom: boolean;
    votes: number;
    color: TLDefaultColorStyle;
    size: TLDefaultSizeStyle;
    w: number;
    h: number;
  }
>;

// Section Shape Util
class SectionShapeUtil extends BaseBoxShapeUtil<SectionShape> {
  static override type = "section" as const;

  static override props: RecordProps<SectionShape> = {
    title: T.string,
    startTime: T.string,
    endTime: T.string,
    emoji: T.string,
    details: T.string,
    color: DefaultColorStyle,
    size: DefaultSizeStyle,
    w: T.number,
    h: T.number,
  };

  override getDefaultProps(): SectionShape["props"] {
    return {
      title: "New Section",
      startTime: "9:00 AM",
      endTime: "10:00 AM",
      emoji: "📅",
      details: "",
      color: "blue",
      size: "m",
      w: 300,
      h: 200,
    };
  }

  override canEdit = () => true;

  override component(shape: SectionShape) {
    const { title, startTime, endTime, emoji, details, color, size } =
      shape.props;

    const editor = useEditor();
    const theme = useDefaultColorTheme();
    const isEditing = editor.getEditingShapeId() === shape.id;
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [editingTimeField, setEditingTimeField] = useState<
      "start" | "end" | null
    >(null);

    // Emoji and time options
    const emojis = [
      "📅",
      "🎯",
      "💡",
      "🚀",
      "⭐",
      "🎉",
      "📝",
      "🔧",
      "🎨",
      "📊",
      "💼",
      "🎪",
      "🍽️",
      "🍺",
      "🎬",
      "🎭",
      "🏃",
      "🚶",
      "🚗",
      "✈️",
      "🏖️",
      "🏠",
      "🏢",
      "🏫",
      "🏥",
      "🏪",
      "🎯",
      "🎲",
      "🎮",
      "📚",
      "💻",
      "📱",
      "📷",
      "🎵",
      "🎤",
      "🎸",
      "🎹",
      "🎻",
      "🎺",
      "🥁",
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🎾",
      "🏐",
      "🏓",
      "🏸",
      "🏊",
      "🚴",
      "🧘",
      "💪",
      "🏋️",
      "🤸",
      "🤺",
      "🏇",
      "⛷️",
      "🏂",
      "🏄",
      "🚣",
    ];

    const timeOptions = [
      "12:00 AM",
      "12:30 AM",
      "1:00 AM",
      "1:30 AM",
      "2:00 AM",
      "2:30 AM",
      "3:00 AM",
      "3:30 AM",
      "4:00 AM",
      "4:30 AM",
      "5:00 AM",
      "5:30 AM",
      "6:00 AM",
      "6:30 AM",
      "7:00 AM",
      "7:30 AM",
      "8:00 AM",
      "8:30 AM",
      "9:00 AM",
      "9:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
      "1:00 PM",
      "1:30 PM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
      "5:00 PM",
      "5:30 PM",
      "6:00 PM",
      "6:30 PM",
      "7:00 PM",
      "7:30 PM",
      "8:00 PM",
      "8:30 PM",
      "9:00 PM",
      "9:30 PM",
      "10:00 PM",
      "10:30 PM",
      "11:00 PM",
      "11:30 PM",
    ];

    // Update shape prop
    const updateShape = (updates: Partial<SectionShape["props"]>) => {
      editor.updateShape<SectionShape>({
        id: shape.id,
        type: "section",
        props: { ...shape.props, ...updates },
      });
    };

    const sizeStyles = {
      s: { fontSize: "14px", padding: "8px" },
      m: { fontSize: "16px", padding: "12px" },
      l: { fontSize: "18px", padding: "16px" },
      xl: { fontSize: "20px", padding: "20px" },
    };

    const currentSizeStyle = sizeStyles[size] || sizeStyles.m;

    return (
      <HTMLContainer>
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: theme[color].light,
            border: `2px dashed ${theme[color].solid}`,
            borderRadius: "8px",
            padding: currentSizeStyle.padding,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            position: "relative",
            fontFamily: "var(--tl-font-ui)",
            fontSize: currentSizeStyle.fontSize,
            pointerEvents: "all",
            overflow: "visible", // Ensure popups aren't clipped
          }}
        >
          {/* Header: Emoji, Title, Time */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              position: "relative",
              overflow: "visible",
            }}
          >
            {/* Emoji Picker */}
            <div style={{ position: "relative" }}>
              {isEditing ? (
                <>
                  <button
                    style={{
                      fontSize: "20px",
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                      padding: 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowTimePicker(false); // Close time picker when opening emoji picker
                    }}
                    title="Change emoji"
                  >
                    {emoji}
                  </button>
                  {showEmojiPicker && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        background: "white",
                        border: "2px solid #333",
                        borderRadius: 8,
                        padding: 8,
                        zIndex: 1000,
                        display: "grid",
                        gridTemplateColumns: "repeat(8, 1fr)",
                        gap: 4,
                        maxHeight: 120,
                        overflowY: "auto",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      }}
                    >
                      {emojis.map((e) => (
                        <button
                          key={e}
                          style={{
                            fontSize: 18,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                            borderRadius: 4,
                            outline: "none",
                          }}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            updateShape({ emoji: e });
                            setShowEmojiPicker(false);
                          }}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <span style={{ fontSize: "20px" }}>{emoji}</span>
              )}
            </div>

            {/* Title Field */}
            <div style={{ flex: 1, position: "relative" }}>
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => updateShape({ title: e.target.value })}
                  style={{
                    width: "100%",
                    fontSize: currentSizeStyle.fontSize,
                    fontWeight: "bold",
                    color: theme[color].solid,
                    border: `1px solid ${theme[color].solid}`,
                    padding: "4px 6px",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    outline: "none",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: currentSizeStyle.fontSize,
                    fontWeight: "bold",
                    color: theme[color].solid,
                    border: "1px dashed #aaa",
                    padding: "4px 6px",
                    borderRadius: "4px",
                    minHeight: "24px",
                    cursor: "text",
                    backgroundColor: "rgba(255,255,255,0.8)",
                  }}
                >
                  {title}
                </div>
              )}
            </div>

            {/* Time Display/Picker */}
            <div style={{ position: "relative" }}>
              <button
                style={{
                  fontSize: "12px",
                  color: theme[color].solid,
                  border: isEditing
                    ? `2px solid ${theme[color].solid}`
                    : "1px dashed #aaa",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: isEditing
                    ? "white"
                    : "rgba(255,255,255,0.8)",
                  minWidth: "80px",
                  fontWeight: isEditing ? "bold" : "normal",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("Time button clicked, isEditing:", isEditing); // Debug log
                  if (isEditing) {
                    setShowTimePicker(!showTimePicker);
                    setShowEmojiPicker(false); // Close emoji picker when opening time picker
                    console.log("Setting showTimePicker to:", !showTimePicker); // Debug log
                  }
                }}
                title={isEditing ? "Change time range" : "Click to edit time"}
              >
                🕐 {startTime}
              </button>

              {/* Time Picker Popup - positioned outside the container if needed */}
              {showTimePicker && isEditing && (
                <div
                  style={{
                    position: "fixed", // Use fixed positioning to avoid clipping
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "white",
                    border: "3px solid #333",
                    borderRadius: 12,
                    padding: 16,
                    zIndex: 9999,
                    minWidth: 220,
                    maxWidth: 300,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      marginBottom: 12,
                      fontSize: "14px",
                      fontWeight: "bold",
                      textAlign: "center",
                      borderBottom: "1px solid #eee",
                      paddingBottom: 8,
                    }}
                  >
                    Set Time Range
                  </div>

                  {/* Start Time */}
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      start:
                      <div
                        style={{
                          border: "2px dashed #ccc",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: "11px",
                          backgroundColor: "#f9f9f9",
                          fontFamily: "monospace",
                        }}
                      >
                        {startTime}
                      </div>
                    </div>
                    <select
                      value={startTime}
                      onChange={(e) => {
                        console.log("Start time changed to:", e.target.value); // Debug log
                        updateShape({ startTime: e.target.value });
                      }}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: "12px",
                        border: "2px solid #ddd",
                        borderRadius: 6,
                        backgroundColor: "white",
                        cursor: "pointer",
                      }}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* End Time */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      end:
                      <div
                        style={{
                          border: "2px dashed #ccc",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: "11px",
                          backgroundColor: "#f9f9f9",
                          fontFamily: "monospace",
                        }}
                      >
                        {endTime}
                      </div>
                    </div>
                    <select
                      value={endTime}
                      onChange={(e) => {
                        console.log("End time changed to:", e.target.value); // Debug log
                        updateShape({ endTime: e.target.value });
                      }}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: "12px",
                        border: "2px solid #ddd",
                        borderRadius: 6,
                        backgroundColor: "white",
                        cursor: "pointer",
                      }}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTimePicker(false);
                        console.log("Time picker closed"); // Debug log
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        fontSize: "12px",
                        backgroundColor: theme[color].solid,
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Done
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTimePicker(false);
                      }}
                      style={{
                        padding: "8px 12px",
                        fontSize: "12px",
                        backgroundColor: "#f5f5f5",
                        color: "#666",
                        border: "1px solid #ddd",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: theme[color].solid,
              }}
            >
              Details:
            </div>
            {isEditing ? (
              <textarea
                value={details}
                onChange={(e) => updateShape({ details: e.target.value })}
                style={{
                  width: "100%",
                  fontSize: "12px",
                  color: theme[color].solid,
                  border: `1px solid ${theme[color].solid}`,
                  padding: "6px",
                  borderRadius: "4px",
                  minHeight: "50px",
                  backgroundColor: "white",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: "12px",
                  color: theme[color].solid,
                  border: "1px dashed #aaa",
                  padding: "6px",
                  borderRadius: "4px",
                  minHeight: "50px",
                  backgroundColor: "rgba(255,255,255,0.8)",
                  cursor: "text",
                  whiteSpace: "pre-wrap",
                }}
              >
                {details || "Type details here..."}
              </div>
            )}
          </div>
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: SectionShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
        strokeDasharray="5,5"
        strokeWidth={2}
      />
    );
  }
}

// Activity Shape Util
class ActivityShapeUtil extends BaseBoxShapeUtil<ActivityShape> {
  static override type = "activity" as const;

  static override props: RecordProps<ActivityShape> = {
    title: T.string,
    description: T.string,
    venue: T.string,
    isCustom: T.boolean,
    votes: T.number,
    color: DefaultColorStyle,
    size: DefaultSizeStyle,
    w: T.number,
    h: T.number,
  };

  override getDefaultProps(): ActivityShape["props"] {
    return {
      title: "New Activity",
      description: "Activity description",
      venue: "",
      isCustom: true,
      votes: 0,
      color: "green",
      size: "m",
      w: 180,
      h: 100,
    };
  }

  override component(shape: ActivityShape) {
    const { title, description, venue, votes, color, size } = shape.props;

    const theme = useDefaultColorTheme();

    const sizeStyles = {
      s: { fontSize: "12px", padding: "8px" },
      m: { fontSize: "14px", padding: "12px" },
      l: { fontSize: "16px", padding: "16px" },
      xl: { fontSize: "18px", padding: "20px" },
    };

    const currentSizeStyle = sizeStyles[size] || sizeStyles.m;

    return (
      <HTMLContainer>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: currentSizeStyle.padding,
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            backgroundColor: theme[color].light,
            border: `2px solid ${theme[color].solid}`,
            fontSize: currentSizeStyle.fontSize,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "start",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <h4
              style={{
                fontWeight: "500",
                fontSize: currentSizeStyle.fontSize,
                lineHeight: "1.2",
                flex: 1,
                color: theme[color].solid,
                margin: 0,
              }}
            >
              {title}
            </h4>
            {votes > 0 && (
              <div
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <Vote style={{ width: "10px", height: "10px" }} />
                {votes}
              </div>
            )}
          </div>
          {description && (
            <p
              style={{
                fontSize: "10px",
                color: "#666",
                marginBottom: "8px",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {description}
            </p>
          )}
          {venue && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "10px",
                color: "#888",
                marginTop: "auto",
                gap: "4px",
              }}
            >
              <MapPin style={{ width: "10px", height: "10px" }} />
              {venue}
            </div>
          )}
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: ActivityShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
        strokeWidth={2}
      />
    );
  }
}

// ============================================================================
// CUSTOM TOOLS
// ============================================================================

// Section Tool
class SectionTool extends StateNode {
  static override id = "section";

  override onPointerDown = (info: TLPointerEventInfo) => {
    const { currentPagePoint } = this.editor.inputs;

    this.editor.createShape({
      type: "section",
      x: currentPagePoint.x - 150,
      y: currentPagePoint.y - 100,
      props: {
        title: "New Section",
        startTime: "9:00 AM",
        endTime: "10:00 AM",
        emoji: "📅",
        details: "",
        color: "blue",
        size: "m",
        w: 300,
        h: 200,
      },
    });

    this.editor.setCurrentTool("select");
  };
}

// Activity Tool
class ActivityTool extends StateNode {
  static override id = "activity";

  override onPointerDown = (info: TLPointerEventInfo) => {
    const { currentPagePoint } = this.editor.inputs;

    this.editor.createShape({
      type: "activity",
      x: currentPagePoint.x - 90,
      y: currentPagePoint.y - 50,
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

    this.editor.setCurrentTool("select");
  };
}

// ============================================================================
// CUSTOM UI COMPONENTS
// ============================================================================

// Plan Board Panel Component
const PlanBoardPanel = track(() => {
  const editor = useEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "sections" | "activities" | "settings"
  >("sections");
  const [editingShape, setEditingShape] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button onClick={() => setIsOpen(true)} size="sm" className="shadow-lg">
          <Layers className="h-4 w-4 mr-2" />
          Plan Board
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Plan Board</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            ×
          </Button>
        </div>
      </div>

      <div className="flex border-b">
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === "sections"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("sections")}
        >
          Sections
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === "activities"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("activities")}
        >
          Activities
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === "settings"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === "sections" && (
          <SectionsTab
            editor={editor}
            onEditShape={(shape) => {
              setEditingShape(shape);
              setEditModalOpen(true);
            }}
          />
        )}
        {activeTab === "activities" && (
          <ActivitiesTab
            editor={editor}
            onEditShape={(shape) => {
              setEditingShape(shape);
              setEditModalOpen(true);
            }}
          />
        )}
        {activeTab === "settings" && <SettingsTab editor={editor} />}
      </div>

      {/* Edit Shape Modal */}
      <EditShapeModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingShape(null);
        }}
        shape={editingShape}
        onUpdate={(updates) => {
          if (updates && editor) {
            editor.updateShape(updates);
          }
          setEditModalOpen(false);
          setEditingShape(null);
        }}
      />

      {/* Keyboard Shortcuts Modal */}
      <PlanBoardKeyboardShortcuts
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
});

// Sections Tab Component
const SectionsTab = track(
  ({
    editor,
    onEditShape,
  }: {
    editor: any;
    onEditShape: (shape: any) => void;
  }) => {
    const sections = editor
      .getCurrentPageShapes()
      .filter((shape: any) => shape.type === "section");

    const addSection = () => {
      const center = editor.getViewportScreenCenter();
      const pagePoint = editor.screenToPage(center);

      editor.createShape({
        type: "section",
        x: pagePoint.x - 100,
        y: pagePoint.y - 60,
        props: {
          title: "New Section",
          startTime: "9:00 AM",
          endTime: "10:00 AM",
          emoji: "📅",
          details: "",
          color: "blue",
          size: "m",
          w: 200,
          h: 120,
        },
      });
    };

    return (
      <div className="space-y-4">
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
                      {section.props.startTime} - {section.props.endTime}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditShape(section)}
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
  }
);

// Activities Tab Component
const ActivitiesTab = track(
  ({
    editor,
    onEditShape,
  }: {
    editor: any;
    onEditShape: (shape: any) => void;
  }) => {
    const activities = editor
      .getCurrentPageShapes()
      .filter((shape: any) => shape.type === "activity");

    const addActivity = () => {
      const center = editor.getViewportScreenCenter();
      const pagePoint = editor.screenToPage(center);

      editor.createShape({
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
    };

    return (
      <div className="space-y-4">
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
                    <p className="text-sm font-medium">
                      {activity.props.title}
                    </p>
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
                    onClick={() => onEditShape(activity)}
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
  }
);

// Settings Tab Component
const SettingsTab = track(({ editor }: { editor: any }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Plan Settings</h4>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Auto-save</span>
          <div className="w-10 h-6 bg-gray-200 rounded-full relative">
            <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Show grid</span>
          <div className="w-10 h-6 bg-blue-500 rounded-full relative">
            <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Collaboration</span>
          <div className="w-10 h-6 bg-blue-500 rounded-full relative">
            <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button variant="outline" size="sm" className="w-full">
          <Share2 className="h-4 w-4 mr-2" />
          Share Plan
        </Button>
      </div>
    </div>
  );
});

// ============================================================================
// TLDRAW OVERRIDES
// ============================================================================

const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    // Add custom tools to the toolbar
    tools.section = {
      id: "section",
      icon: "color",
      label: "Section",
      kbd: "s",
      onSelect: () => {
        editor.setCurrentTool("section");
      },
    };

    tools.activity = {
      id: "activity",
      icon: "color",
      label: "Activity",
      kbd: "a",
      onSelect: () => {
        editor.setCurrentTool("activity");
      },
    };

    return tools;
  },

  actions(editor, actions) {
    // Add custom actions
    actions["add-section"] = {
      id: "add-section",
      label: "Add Section",
      readonlyOk: false,
      kbd: "ctrl+shift+s",
      onSelect: () => {
        const center = editor.getViewportScreenCenter();
        const pagePoint = editor.screenToPage(center);

        editor.createShape({
          type: "section",
          x: pagePoint.x - 100,
          y: pagePoint.y - 60,
          props: {
            title: "New Section",
            startTime: "9:00 AM",
            endTime: "10:00 AM",
            emoji: "📅",
            details: "",
            color: "blue",
            size: "m",
            w: 200,
            h: 120,
          },
        });
      },
    };

    actions["add-activity"] = {
      id: "add-activity",
      label: "Add Activity",
      readonlyOk: false,
      kbd: "ctrl+shift+a",
      onSelect: () => {
        const center = editor.getViewportScreenCenter();
        const pagePoint = editor.screenToPage(center);

        editor.createShape({
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
      },
    };

    return actions;
  },

  translations: {
    en: {
      "tools.section": "Section",
      "tools.activity": "Activity",
      "actions.add-section": "Add Section",
      "actions.add-activity": "Add Activity",
    },
  },
};

// Custom Toolbar Component with Plan Board Tools
const CustomToolbar = track(() => {
  const editor = useEditor();
  const currentToolId = editor.getCurrentToolId();

  return (
    <DefaultToolbar>
      <DefaultToolbarContent />
      <TldrawUiMenuItem
        id="section"
        icon="color"
        label="Section"
        kbd="s"
        isSelected={currentToolId === "section"}
        onSelect={() => {
          editor.setCurrentTool("section");
        }}
      />
      <TldrawUiMenuItem
        id="activity"
        icon="color"
        label="Activity"
        kbd="a"
        isSelected={currentToolId === "activity"}
        onSelect={() => {
          editor.setCurrentTool("activity");
        }}
      />
    </DefaultToolbar>
  );
});

// Custom components to add the plan board panel
const components: TLComponents = {
  // Add the plan board panel to the UI
  TopPanel: () => <PlanBoardPanel />,
  // Override the toolbar to include custom tools
  Toolbar: CustomToolbar,
};

// ============================================================================
// MAIN WHITEBOARD COMPONENT
// ============================================================================

interface WhiteboardProps {
  planId: Id<"plans">;
  onMount?: (editor: any) => void;
}

export default function Whiteboard({ planId, onMount }: WhiteboardProps) {
  const board = useQuery(api.boards.getBoardByPlan, { planId });
  const updateBoard = useMutation(api.boards.updateBoard);

  const [store] = useState(() =>
    createTLStore({
      shapeUtils: [...defaultShapeUtils, SectionShapeUtil, ActivityShapeUtil],
    })
  );

  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Load board state from Convex when available
  useEffect(() => {
    if (board?.state && store && !isInitialized) {
      try {
        const snapshot = JSON.parse(board.state);

        // Migrate old section shapes to new format
        if (snapshot.store && snapshot.store.records) {
          Object.values(snapshot.store.records).forEach((record: any) => {
            if (record.typeName === "shape" && record.type === "section") {
              // Migrate old time property to startTime/endTime
              if (record.props.time && !record.props.startTime) {
                record.props.startTime = record.props.time;
                record.props.endTime = getDefaultEndTime(record.props.time);
                delete record.props.time;
              }
            }
          });
        }

        loadSnapshot(store, snapshot);
        console.log("Successfully loaded board state with migration");
        setIsInitialized(true);
      } catch (e) {
        console.error("Failed to parse or load board state:", e);
        try {
          console.log("Starting with fresh whiteboard state");
          setIsInitialized(true);
        } catch (secondError) {
          console.error(
            "Failed to recover from board state error:",
            secondError
          );
          setHasError(true);
        }
      }
    } else if (board?.state === undefined && board !== undefined) {
      console.log("No board state available, starting fresh");
      setIsInitialized(true);
    }
  }, [board?.state, store, isInitialized]);

  // Helper function to calculate default end time (1 hour after start)
  const getDefaultEndTime = (startTime: string): string => {
    const timeOptions = [
      "12:00 AM",
      "12:30 AM",
      "1:00 AM",
      "1:30 AM",
      "2:00 AM",
      "2:30 AM",
      "3:00 AM",
      "3:30 AM",
      "4:00 AM",
      "4:30 AM",
      "5:00 AM",
      "5:30 AM",
      "6:00 AM",
      "6:30 AM",
      "7:00 AM",
      "7:30 AM",
      "8:00 AM",
      "8:30 AM",
      "9:00 AM",
      "9:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
      "1:00 PM",
      "1:30 PM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
      "5:00 PM",
      "5:30 PM",
      "6:00 PM",
      "6:30 PM",
      "7:00 PM",
      "7:30 PM",
      "8:00 PM",
      "8:30 PM",
      "9:00 PM",
      "9:30 PM",
      "10:00 PM",
      "10:30 PM",
      "11:00 PM",
      "11:30 PM",
    ];

    const currentIndex = timeOptions.indexOf(startTime);
    if (currentIndex === -1) return "10:00 AM"; // fallback

    // Add 2 slots (1 hour) to get end time
    const endIndex = Math.min(currentIndex + 2, timeOptions.length - 1);
    return timeOptions[endIndex];
  };

  // Debounced save to prevent excessive API calls
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const saveState = useCallback(async () => {
    if (!store || !isInitialized) return;

    try {
      const snapshot = getSnapshot(store);
      const stateString = JSON.stringify(snapshot);

      await updateBoard({
        planId,
        state: stateString,
      });

      console.log("Board state saved successfully");
    } catch (error) {
      console.error("Failed to save board state:", error);
    }
  }, [store, updateBoard, planId, isInitialized]);

  // Handle store changes with debouncing
  useEffect(() => {
    if (!store || !isInitialized) return;

    const handleChange = () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      const timeout = setTimeout(saveState, 1000);
      setSaveTimeout(timeout);
    };

    const unsubscribe = store.listen(handleChange, {
      source: "user",
      scope: "document",
    });

    return () => {
      unsubscribe();
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [store, saveState, saveTimeout, isInitialized]);

  const handleMount = (editor: any) => {
    if (onMount) {
      onMount(editor);
    }
  };

  if (board === undefined || !isInitialized) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-orange-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load whiteboard
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading your saved whiteboard state.
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsInitialized(true);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Start Drawing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Tldraw
        store={store}
        onMount={handleMount}
        overrides={uiOverrides}
        components={components}
        shapeUtils={[SectionShapeUtil, ActivityShapeUtil]}
        tools={[SectionTool, ActivityTool]}
      />
    </div>
  );
}
