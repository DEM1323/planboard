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
  createShapeId,
} from "tldraw";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { PlanBoardKeyboardShortcuts } from "./components/PlanBoardKeyboardShortcuts";
import { useUserPresence } from "./lib/use-user-presence";
import { useBoardPresence } from "./lib/use-board-presence";
import { useIsOnline } from "./lib/use-online-status";

import {
  planBoardComponents,
  PlanBoardActionPanel,
} from "./components/PlanBoardPanel";
import { OnlineUsers } from "./components/OnlineUsers";
import { CustomToolbar } from "./components/CustomToolbar";
import {
  ActiveUsersList,
  PresencePanel,
  UserCursor,
  CollaboratorCursor,
  ActivityIndicator,
  TypingIndicator,
} from "./components/PresenceComponents";

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
  MessageCircle,
} from "lucide-react";
import "tldraw/tldraw.css";

// ============================================================================
// CUSTOM SHAPES
// ============================================================================

// Updated Section Shape Type
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

// Updated Section Shape Util
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
  override canResize = () => true;

  override component(shape: SectionShape) {
    const { title, startTime, endTime, emoji, details, color, size } =
      shape.props;

    const editor = useEditor();
    const theme = useDefaultColorTheme();
    const isSelected = editor.getSelectedShapeIds().includes(shape.id);
    const isEditing = editor.getEditingShapeId() === shape.id;

    const sizeStyles = {
      s: { fontSize: "14px", padding: "8px" },
      m: { fontSize: "16px", padding: "12px" },
      l: { fontSize: "18px", padding: "16px" },
      xl: { fontSize: "20px", padding: "20px" },
    };
    const currentSizeStyle = sizeStyles[size] || sizeStyles.m;

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

    const updateShapeProps = useCallback(
      (updates: Partial<SectionShape["props"]>) => {
        editor.updateShape({
          id: shape.id,
          type: shape.type,
          props: { ...shape.props, ...updates },
        });
      },
      [editor, shape.id, shape.type, shape.props]
    );

    const handleInputChange = useCallback(
      (field: keyof SectionShape["props"], value: any) => {
        updateShapeProps({ [field]: value });
      },
      [updateShapeProps]
    );

    const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === "Tab") {
        e.stopPropagation();
      }
    }, []);

    const handleInputFocus = useCallback(
      (e: React.FocusEvent) => {
        editor.setEditingShape(shape.id);
      },
      [editor, shape.id]
    );

    const handleInputBlur = useCallback(
      (e: React.FocusEvent) => {
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (!activeElement || !e.currentTarget.contains(activeElement)) {
            editor.setEditingShape(null);
          }
        }, 100);
      },
      [editor]
    );

    // Render time display - simple logic based on whether end time is empty
    const renderTimeDisplay = () => {
      const hasEndTime = endTime && endTime.trim() !== "";

      if (hasEndTime) {
        return (
          <span
            style={{
              fontSize: "12px",
              color: theme[color].solid,
              border: "1px dashed transparent",
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: "rgba(255,255,255,0.8)",
              cursor: "pointer",
              display: "inline-block",
            }}
            onClick={() => editor.setEditingShape(shape.id)}
          >
            🕒 {startTime} - {endTime}
          </span>
        );
      }

      // Just start time if no end time
      return (
        <span
          style={{
            fontSize: "12px",
            color: theme[color].solid,
            border: "1px dashed transparent",
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            display: "inline-block",
          }}
          onClick={() => editor.setEditingShape(shape.id)}
        >
          🕒 {startTime}
        </span>
      );
    };

    return (
      <HTMLContainer>
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: theme[color].solid + "22",
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
            overflow: "visible",
          }}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        >
          {/* Header: Emoji + Section Name */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            {/* Emoji */}
            <div>
              {isSelected || isEditing ? (
                <input
                  type="text"
                  value={emoji || ""}
                  maxLength={2}
                  onChange={(e) => {
                    const value = e.target.value;
                    const emojiRegex =
                      /^(?:\p{Emoji}|\p{Extended_Pictographic})$/u;
                    if (value === "" || emojiRegex.test(value)) {
                      handleInputChange("emoji", value);
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      handleInputChange("emoji", "");
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  style={{
                    fontSize: "20px",
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    backgroundColor: "white",
                    width: "2.5em",
                    textAlign: "center",
                    outline: "none",
                  }}
                  placeholder="📅"
                />
              ) : (
                <span
                  style={{ fontSize: "20px", cursor: "pointer" }}
                  onClick={() => editor.setEditingShape(shape.id)}
                >
                  {emoji || "📅"}
                </span>
              )}
            </div>

            {/* Section Name */}
            <div style={{ flex: 1 }}>
              {isSelected || isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  onKeyDown={handleInputKeyDown}
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
                  placeholder="Section Name"
                  autoFocus={isEditing}
                />
              ) : (
                <div
                  style={{
                    fontSize: currentSizeStyle.fontSize,
                    fontWeight: "bold",
                    color: theme[color].solid,
                    border: "1px dashed transparent",
                    padding: "4px 6px",
                    borderRadius: "4px",
                    minHeight: "24px",
                    cursor: "text",
                    backgroundColor: "rgba(255,255,255,0.8)",
                  }}
                  onClick={() => editor.setEditingShape(shape.id)}
                >
                  {title}
                </div>
              )}
            </div>
          </div>

          {/* Time Section */}
          <div style={{ marginBottom: "12px" }}>
            {isSelected || isEditing ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  padding: "8px",
                  border: `1px solid ${theme[color].solid}`,
                  borderRadius: "4px",
                  backgroundColor: "white",
                }}
              >
                {/* Time inputs row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      flex: 1,
                    }}
                  >
                    <label
                      style={{
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#666",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      start time
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleInputChange("startTime", e.target.value);
                      }}
                      onKeyDown={handleInputKeyDown}
                      style={{
                        fontSize: "12px",
                        borderRadius: 4,
                        border: "1px solid #ccc",
                        backgroundColor: "white",
                        padding: "6px 4px",
                        width: "100%",
                        outline: "none",
                      }}
                    >
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      flex: 1,
                    }}
                  >
                    <label
                      style={{
                        fontSize: "10px",
                      }}
                    >
                      end time
                    </label>
                    <select
                      value={endTime}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleInputChange("endTime", e.target.value);
                      }}
                      onKeyDown={handleInputKeyDown}
                      style={{
                        fontSize: "12px",
                        borderRadius: 4,
                        border: "1px solid #ccc",
                        backgroundColor: "white",
                        padding: "6px 4px",
                        width: "100%",
                        outline: "none",
                      }}
                    >
                      <option value="">No end time</option>
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              renderTimeDisplay()
            )}
          </div>

          {/* Details Section */}
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: theme[color].solid,
                marginBottom: "4px",
              }}
            >
              Details:
            </div>
            {isSelected || isEditing ? (
              <textarea
                value={details}
                onChange={(e) => handleInputChange("details", e.target.value)}
                onKeyDown={handleInputKeyDown}
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
                placeholder="Type details here..."
              />
            ) : (
              <div
                style={{
                  fontSize: "12px",
                  color: theme[color].solid,
                  border: "1px solid #000",
                  padding: "6px",
                  borderRadius: "4px",
                  minHeight: "50px",
                  backgroundColor: "white",
                  cursor: "text",
                  whiteSpace: "pre-wrap",
                }}
                onClick={() => editor.setEditingShape(shape.id)}
              >
                {details || "Type details here..."}
              </div>
            )}
          </div>

          {/* Activities Section */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: theme[color].solid,
                marginBottom: "4px",
              }}
            >
              Activities:
            </div>
            <div
              style={{
                border: "2px dashed #000",
                borderRadius: "4px",
                minHeight: "80px",
                backgroundColor: "white",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: "16px",
              }}
              onClick={() => editor.setEditingShape(shape.id)}
            >
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>+</div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Add an Activity
              </div>
            </div>
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

  override onDoubleClick = (shape: SectionShape) => {
    this.editor.setEditingShape(shape.id);
  };
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

  override canEdit = () => true;
  override canResize = () => true;

  override component(shape: ActivityShape) {
    const { title, description, venue, votes, color, size } = shape.props;

    const editor = useEditor();
    const theme = useDefaultColorTheme();
    const isSelected = editor.getSelectedShapeIds().includes(shape.id);
    const isEditing = editor.getEditingShapeId() === shape.id;

    const sizeStyles = {
      s: { fontSize: "12px", padding: "8px" },
      m: { fontSize: "14px", padding: "12px" },
      l: { fontSize: "16px", padding: "16px" },
      xl: { fontSize: "18px", padding: "20px" },
    };

    const currentSizeStyle = sizeStyles[size] || sizeStyles.m;

    const updateShapeProps = useCallback(
      (updates: Partial<ActivityShape["props"]>) => {
        editor.updateShape({
          id: shape.id,
          type: shape.type,
          props: { ...shape.props, ...updates },
        });
      },
      [editor, shape.id, shape.type, shape.props]
    );

    const handleInputChange = useCallback(
      (field: keyof ActivityShape["props"], value: any) => {
        updateShapeProps({ [field]: value });
      },
      [updateShapeProps]
    );

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === "Tab") {
        e.stopPropagation();
      }
    }, []);

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
            backgroundColor: theme[color].solid + "22",
            border: `2px solid ${theme[color].solid}`,
            fontSize: currentSizeStyle.fontSize,
            pointerEvents: "all",
          }}
          onClick={() => {
            if (!isEditing) {
              editor.setEditingShape(shape.id);
            }
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
            {isSelected || isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  fontWeight: "500",
                  fontSize: currentSizeStyle.fontSize,
                  lineHeight: "1.2",
                  flex: 1,
                  color: theme[color].solid,
                  margin: 0,
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "2px 4px",
                  backgroundColor: "white",
                  outline: "none",
                }}
                placeholder="Activity Title"
                autoFocus={isEditing}
              />
            ) : (
              <h4
                style={{
                  fontWeight: "500",
                  fontSize: currentSizeStyle.fontSize,
                  lineHeight: "1.2",
                  flex: 1,
                  color: theme[color].solid,
                  margin: 0,
                  cursor: "text",
                }}
              >
                {title}
              </h4>
            )}
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
                  marginLeft: "8px",
                }}
              >
                <Vote style={{ width: "10px", height: "10px" }} />
                {votes}
              </div>
            )}
          </div>

          {/* Description */}
          {isSelected || isEditing ? (
            <textarea
              value={description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                fontSize: "10px",
                color: "#666",
                marginBottom: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "4px",
                backgroundColor: "white",
                outline: "none",
                resize: "vertical",
                minHeight: "30px",
                fontFamily: "inherit",
              }}
              placeholder="Activity description..."
            />
          ) : (
            description && (
              <p
                style={{
                  fontSize: "10px",
                  color: "#666",
                  marginBottom: "8px",
                  margin: "0 0 8px 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  cursor: "text",
                }}
              >
                {description}
              </p>
            )
          )}

          {/* Venue */}
          {isSelected || isEditing ? (
            <input
              type="text"
              value={venue}
              onChange={(e) => handleInputChange("venue", e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                fontSize: "10px",
                color: "#888",
                marginTop: "auto",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "2px 4px",
                backgroundColor: "white",
                outline: "none",
              }}
              placeholder="Venue (optional)"
            />
          ) : (
            venue && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "10px",
                  color: "#888",
                  marginTop: "auto",
                  gap: "4px",
                  cursor: "text",
                }}
              >
                <MapPin style={{ width: "10px", height: "10px" }} />
                {venue}
              </div>
            )
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

  override onDoubleClick = (shape: ActivityShape) => {
    this.editor.setEditingShape(shape.id);
  };
}

// ============================================================================
// CUSTOM TOOLS
// ============================================================================

// Plan Board Tool - Main tool for plan board functionality
class PlanBoardTool extends StateNode {
  static override id = "plan-board" as const;
  static override initial = "idle" as const;

  // Idle state for the plan board tool
  static IdleState = class extends StateNode {
    static override id = "idle";

    override onPointerDown = () => {
      // Plan board tool doesn't create shapes on click
      // All creation happens through the action panel
      return;
    };
  };

  static override children() {
    return [PlanBoardTool.IdleState];
  }
}

// UI overrides to add Plan Board tool to the toolbar
const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    // Add plan board tool
    tools["plan-board"] = {
      id: "plan-board",
      icon: "plus", // Using a built-in icon
      label: "Plan Board",
      kbd: "p",
      onSelect: () => {
        editor.setCurrentTool("plan-board");
      },
    };

    return tools;
  },
  translations: {
    en: {
      "tools.plan-board": "Plan Board",
    },
  },
};

// MAIN WHITEBOARD COMPONENT
// ============================================================================

interface WhiteboardProps {
  planId: Id<"plans">;
  onMount?: (editor: any) => void;
}

export default function Whiteboard({ planId, onMount }: WhiteboardProps) {
  const board = useQuery(api.boards.getBoardByPlan, { planId });
  const updateBoard = useMutation(api.boards.updateBoard);

  // Presence management
  const { userPresence, isOnline, updateActivity } = useUserPresence();
  const boardPresence = useQuery(api.presence.getBoardPresence, { planId });
  const joinBoard = useMutation(api.presence.joinBoard);
  const leaveBoard = useMutation(api.presence.leaveBoard);
  const updatePresence = useMutation(api.presence.updatePresence);
  const userCount = useQuery(api.presence.getBoardUserCount, { planId });
  const heartbeat = useMutation(api.presence.heartbeat);

  const [store] = useState(() =>
    createTLStore({
      shapeUtils: [...defaultShapeUtils, SectionShapeUtil, ActivityShapeUtil],
    })
  );

  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Merge the planBoard components with any other custom components
  const components: TLComponents = useMemo(
    () => ({
      ...planBoardComponents,
      Toolbar: (props: any) => {
        const editor = useEditor();
        const userPresence = useUserPresence();
        const boardPresence = useBoardPresence(planId);
        const isOnline = useIsOnline();

        return (
          <CustomToolbar
            editor={editor}
            users={boardPresence || []}
            currentSessionId={userPresence?.userPresence?.id}
            isOnline={isOnline}
            {...props}
          />
        );
      },
      // Add the action panel component to be rendered in the top panel area
      TopPanel: () => <PlanBoardActionPanel />,
    }),
    [planId]
  );

  // Join board presence when component mounts and user is available
  useEffect(() => {
    if (userPresence && isOnline) {
      joinBoard({
        planId,
        sessionId: userPresence.sessionId,
        userName: userPresence.name,
        userColor: userPresence.color,
        userInitials: userPresence.initials,
        userId: undefined, // For now, using anonymous users
      }).catch(console.error);
    }
  }, [userPresence, isOnline, planId, joinBoard]);

  // Add heartbeat to keep session alive
  useEffect(() => {
    if (!userPresence || !isOnline) return;

    const heartbeatInterval = setInterval(() => {
      heartbeat({ 
        planId, 
        sessionId: userPresence.sessionId 
      }).catch(console.error);
    }, 30000); // 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [userPresence, isOnline, planId, heartbeat]);

  // Leave board presence when component unmounts or user goes offline
  useEffect(() => {
    return () => {
      if (userPresence) {
        leaveBoard({
          planId,
          sessionId: userPresence.sessionId,
        }).catch(console.error);
      }
    };
  }, [userPresence, planId, leaveBoard]);

  // Update presence with editor state changes
  useEffect(() => {
    if (!editorInstance || !userPresence || !isOnline) return;

    const updatePresenceData = () => {
      const camera = editorInstance.getCamera();
      const selectedShapeIds = editorInstance.getSelectedShapeIds();
      const editingShapeId = editorInstance.getEditingShapeId();
      const pointer = editorInstance.inputs.currentPagePoint;

      updatePresence({
        planId,
        sessionId: userPresence.sessionId,
        cursor: pointer ? { x: pointer.x, y: pointer.y } : undefined,
        camera: { x: camera.x, y: camera.y, z: camera.z },
        selectedShapes: selectedShapeIds,
        isEditing: Boolean(editingShapeId),
        editingShapeId: editingShapeId || undefined,
        isTyping: false, // TODO: Implement typing detection
      }).catch(console.error);

      updateActivity();
    };

    // Update presence on various editor events
    const unsubscribePointer = editorInstance.store.listen(
      () => {
        updatePresenceData();
      },
      { scope: "session", source: "user" }
    );

    // Set up periodic presence updates (every 5 seconds)
    const presenceInterval = setInterval(updatePresenceData, 5000);

    return () => {
      unsubscribePointer();
      clearInterval(presenceInterval);
    };
  }, [
    editorInstance,
    userPresence,
    isOnline,
    planId,
    updatePresence,
    updateActivity,
  ]);

  // Attach presence data to editor for PlanBoardPanel access
  useEffect(() => {
    if (editorInstance && boardPresence) {
      (editorInstance as any).presenceData = {
        users: boardPresence || [],
        currentSessionId: userPresence?.sessionId || null,
        isOnline,
        userCount: userCount || 0,
      };
    }
  }, [editorInstance, boardPresence, userPresence, isOnline, userCount]);

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

  // Load board state from Convex when available with comprehensive migration
  useEffect(() => {
    if (board?.state && store && !isInitialized) {
      try {
        const snapshot = JSON.parse(board.state);

        // Migrate old section shapes to new format
        if (snapshot.store && snapshot.store.records) {
          const idMapping = new Map(); // Track old ID -> new ID mapping

          // Pre-cleanup: Remove any old properties that are no longer in the schema
          Object.values(snapshot.store.records).forEach((record: any) => {
            if (
              record.typeName === "shape" &&
              record.type === "section" &&
              record.props
            ) {
              // Remove old boolean properties that are no longer in the schema
              delete record.props.hasTimeRange;
              delete record.props.hasNoTime;
            }
          });

          // First pass: Fix shape IDs and collect mapping, and clean up old properties
          Object.values(snapshot.store.records).forEach((record: any) => {
            if (record.typeName === "shape") {
              // Ensure shape ID has correct prefix
              if (!record.id.startsWith("shape:")) {
                const newId = `shape:${record.id}`;
                idMapping.set(record.id, newId);
                record.id = newId;
              }

              // Handle section-specific migrations
              if (record.type === "section") {
                // Migrate old time property to startTime/endTime
                if (record.props.time && !record.props.startTime) {
                  record.props.startTime = record.props.time;
                  record.props.endTime = getDefaultEndTime(record.props.time);
                  delete record.props.time;
                }

                // Ensure endTime is empty string if not set
                if (record.props.endTime === undefined) {
                  record.props.endTime = "";
                }
              }
            }
          });

          // Second pass: Update all references to old shape IDs and ensure all shape IDs are prefixed
          Object.values(snapshot.store.records).forEach((record: any) => {
            // Fix selectedShapeIds in page states
            if (
              record.typeName === "instance_page_state" &&
              record.selectedShapeIds
            ) {
              record.selectedShapeIds = record.selectedShapeIds.map(
                (id: string) => {
                  let fixedId = id;
                  if (idMapping.has(id)) {
                    fixedId = idMapping.get(id);
                  } else if (!id.startsWith("shape:")) {
                    fixedId = `shape:${id}`;
                  }
                  return fixedId;
                }
              );
            }

            // Fix editingShapeId
            if (
              record.typeName === "instance_page_state" &&
              record.editingShapeId
            ) {
              let eid = record.editingShapeId;
              if (idMapping.has(eid)) {
                eid = idMapping.get(eid);
              } else if (!eid.startsWith("shape:")) {
                eid = `shape:${eid}`;
              }
              record.editingShapeId = eid;
            }

            // Fix any other shape references in instance or instance_page_state
            if (
              record.typeName === "instance" ||
              record.typeName === "instance_page_state"
            ) {
              Object.keys(record).forEach((key) => {
                if (typeof record[key] === "string") {
                  const val = record[key];
                  if (idMapping.has(val)) {
                    record[key] = idMapping.get(val);
                  } else if (
                    (key.endsWith("Id") || key.endsWith("Shape")) &&
                    val &&
                    !val.startsWith("shape:") &&
                    /^([a-zA-Z0-9_-]+)$/.test(val)
                  ) {
                    record[key] = `shape:${val}`;
                  }
                } else if (Array.isArray(record[key])) {
                  // For arrays of IDs, ensure all are prefixed
                  record[key] = record[key].map((item: any) => {
                    if (typeof item === "string") {
                      if (idMapping.has(item)) {
                        return idMapping.get(item);
                      } else if (
                        !item.startsWith("shape:") &&
                        /^([a-zA-Z0-9_-]+)$/.test(item)
                      ) {
                        return `shape:${item}`;
                      }
                    }
                    return item;
                  });
                }
              });
            }
          });
        }

        loadSnapshot(store, snapshot);
        console.log("Successfully loaded board state with migration");
        setIsInitialized(true);
      } catch (e) {
        console.error("Failed to parse or load board state:", e);
        // If migration fails due to schema changes, start fresh
        console.log(
          "Starting with fresh whiteboard state due to schema changes"
        );
        setIsInitialized(true);
      }
    } else if (board?.state === undefined && board !== undefined) {
      console.log("No board state available, starting fresh");
      setIsInitialized(true);
    }
  }, [board?.state, store, isInitialized]);

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
    setEditorInstance(editor);

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
        components={components}
        shapeUtils={[SectionShapeUtil, ActivityShapeUtil]}
        tools={[PlanBoardTool]}
        overrides={uiOverrides}
      />
      <OnlineUsers
        users={boardPresence || []}
        currentSessionId={userPresence?.sessionId}
        isOnline={isOnline}
      />
    </div>
  );
}
