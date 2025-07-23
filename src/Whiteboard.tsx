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
    hasTimeRange: boolean; // New: whether to show time range
    hasNoTime: boolean; // New: whether to show no time at all
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
    hasTimeRange: T.boolean,
    hasNoTime: T.boolean,
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
      hasTimeRange: false,
      hasNoTime: false,
    };
  }

  override canEdit = () => true;
  override canResize = () => true;

  override component(shape: SectionShape) {
    const {
      title,
      startTime,
      endTime,
      emoji,
      details,
      color,
      size,
      hasTimeRange,
      hasNoTime,
    } = shape.props;

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

    // Handle checkbox changes with mutual exclusivity and proper event handling
    const handleTimeRangeChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const checked = e.target.checked;
        if (checked) {
          updateShapeProps({ hasTimeRange: true, hasNoTime: false });
        } else {
          updateShapeProps({ hasTimeRange: false });
        }
      },
      [updateShapeProps]
    );

    const handleNoTimeChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const checked = e.target.checked;
        if (checked) {
          updateShapeProps({ hasNoTime: true, hasTimeRange: false });
        } else {
          updateShapeProps({ hasNoTime: false });
        }
      },
      [updateShapeProps]
    );

    // Render time display based on settings
    const renderTimeDisplay = () => {
      if (hasNoTime) {
        return (
          <span
            style={{
              fontSize: "16px",
              color: theme[color].solid,
              cursor: "pointer",
            }}
            onClick={() => editor.setEditingShape(shape.id)}
          >
            🕐
          </span>
        );
      }

      if (hasTimeRange) {
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
            🕐 {startTime} - {endTime}
          </span>
        );
      }

      // Default: just start time
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
          🕐 {startTime}
        </span>
      );
    };

    // Render time controls when editing - fixed positioning and sizing
    const renderTimeControls = () => {
      return (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: "0",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "8px",
            border: `1px solid ${theme[color].solid}`,
            borderRadius: "4px",
            backgroundColor: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            minWidth: "240px",
            marginTop: "4px",
          }}
        >
          {/* Time inputs row */}
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
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
                  fontWeight: "bold",
                  color: hasTimeRange ? "#666" : "#ccc",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
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
                disabled={!hasTimeRange}
                style={{
                  fontSize: "12px",
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  backgroundColor: hasTimeRange ? "white" : "#f5f5f5",
                  padding: "6px 4px",
                  width: "100%",
                  opacity: hasTimeRange ? 1 : 0.6,
                  cursor: hasTimeRange ? "pointer" : "not-allowed",
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
          </div>

          {/* Checkboxes */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              paddingTop: "4px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={hasTimeRange}
                onChange={handleTimeRangeChange}
                onClick={(e) => e.stopPropagation()}
                style={{
                  margin: 0,
                  cursor: "pointer",
                }}
              />
              <span style={{ color: "#666" }}>time range</span>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={hasNoTime}
                onChange={handleNoTimeChange}
                onClick={(e) => e.stopPropagation()}
                style={{
                  margin: 0,
                  cursor: "pointer",
                }}
              />
              <span style={{ color: "#666" }}>no time</span>
            </label>
          </div>
        </div>
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
          {/* Header: Emoji, Title, Time */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              position: "relative",
              overflow: "visible",
            }}
          >
            {/* Emoji Picker or Static */}
            <div
              style={{
                position: "relative",
                minWidth: "30px",
                paddingTop: "4px",
              }}
            >
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

            {/* Title */}
            <div style={{ flex: 1, position: "relative" }}>
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
                  placeholder="Section Title"
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

            {/* Time Section - Fixed positioning */}
            <div
              style={{
                position: "relative",
                minWidth: "60px",
                alignSelf: "flex-start",
                paddingTop: "4px",
              }}
            >
              {isSelected || isEditing ? (
                <>
                  {/* Time trigger button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Time controls are always visible when editing
                    }}
                    style={{
                      fontSize: "12px",
                      color: theme[color].solid,
                      border: `1px solid ${theme[color].solid}`,
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      outline: "none",
                    }}
                  >
                    🕐 Time
                  </button>
                  {/* Time controls panel */}
                  {renderTimeControls()}
                </>
              ) : (
                renderTimeDisplay()
              )}
            </div>
          </div>

          {/* Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: theme[color].solid,
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
                  flex: 1,
                }}
                placeholder="Section details..."
              />
            ) : (
              <div
                style={{
                  fontSize: "12px",
                  color: theme[color].solid,
                  border: "1px dashed transparent",
                  padding: "6px",
                  borderRadius: "4px",
                  minHeight: "50px",
                  backgroundColor: "rgba(255,255,255,0.8)",
                  cursor: "text",
                  whiteSpace: "pre-wrap",
                  flex: 1,
                }}
                onClick={() => editor.setEditingShape(shape.id)}
              >
                {details || "Click to add details..."}
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

// Section Tool
class SectionTool extends StateNode {
  static override id = "section";

  override onPointerDown = (info: TLPointerEventInfo) => {
    const { currentPagePoint } = this.editor.inputs;

    const shapeId = createShapeId();

    this.editor.createShape({
      id: shapeId,
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
        hasTimeRange: false,
        hasNoTime: false,
      },
    });

    this.editor.setCurrentTool("select");
    this.editor.select(shapeId);
    setTimeout(() => {
      this.editor.setEditingShape(shapeId);
    }, 100);
  };
}

// Activity Tool
class ActivityTool extends StateNode {
  static override id = "activity";

  override onPointerDown = (info: TLPointerEventInfo) => {
    const { currentPagePoint } = this.editor.inputs;

    const shapeId = createShapeId();

    this.editor.createShape({
      id: shapeId,
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

    // Select the newly created shape and start editing
    this.editor.setCurrentTool("select");
    this.editor.select(shapeId);
    // Start editing immediately
    setTimeout(() => {
      this.editor.setEditingShape(shapeId);
    }, 100);
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

      const shapeId = createShapeId();

      editor.createShape({
        id: shapeId,
        type: "section",
        x: pagePoint.x - 150,
        y: pagePoint.y - 100,
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
          hasTimeRange: false,
          hasNoTime: false,
        },
      });

      editor.select(shapeId);
      setTimeout(() => {
        editor.setEditingShape(shapeId);
      }, 100);
    };

    // Helper function to format time display
    const formatTimeDisplay = (section: any) => {
      const { startTime, endTime, hasTimeRange, hasNoTime } = section.props;

      if (hasNoTime) {
        return "No time";
      }

      if (hasTimeRange) {
        return `${startTime} - ${endTime}`;
      }

      return startTime;
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

      // Select and start editing
      editor.select(shapeId);
      setTimeout(() => {
        editor.setEditingShape(shapeId);
      }, 100);
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
    // Add custom actions with keyboard shortcuts
    actions["add-section"] = {
      id: "add-section",
      label: "Add Section",
      readonlyOk: false,
      kbd: "ctrl+shift+s",
      onSelect: () => {
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
            endTime: "10:00 AM",
            emoji: "📅",
            details: "",
            color: "blue",
            size: "m",
            w: 300,
            h: 200,
            hasTimeRange: false,
            hasNoTime: false,
          },
        });

        editor.select(shapeId);
        setTimeout(() => {
          editor.setEditingShape(shapeId);
        }, 100);
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

          // First pass: Fix shape IDs and collect mapping
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

                // Add new boolean properties if they don't exist
                if (record.props.hasTimeRange === undefined) {
                  record.props.hasTimeRange = false;
                }
                if (record.props.hasNoTime === undefined) {
                  record.props.hasNoTime = false;
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
