import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Clock, MapPin, Vote, Smile } from "lucide-react";

interface EditShapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shape: any;
  onUpdate: (updates: any) => void;
}

const EMOJI_OPTIONS = [
  "📅",
  "⏰",
  "🌅",
  "🌞",
  "🌆",
  "🌙",
  "🎯",
  "🎪",
  "🎨",
  "🎭",
  "🎵",
  "🎬",
  "🎮",
  "🏃",
  "🚴",
  "🏊",
  "🧘",
  "🍽️",
  "☕",
  "🍕",
  "🎉",
  "🎊",
  "🎈",
  "🎁",
  "💝",
  "💡",
  "🔍",
  "📚",
  "✏️",
  "💻",
  "🚀",
  "⭐",
  "💼",
  "🎲",
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
  "🏋️",
  "🤸",
  "🤺",
  "🏇",
  "⛷️",
  "🏂",
  "🏄",
  "🚣",
  "💪",
];

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "purple", label: "Purple" },
  { value: "yellow", label: "Yellow" },
  { value: "pink", label: "Pink" },
  { value: "grey", label: "Grey" },
  { value: "black", label: "Black" },
];

const SIZE_OPTIONS = [
  { value: "s", label: "Small" },
  { value: "m", label: "Medium" },
  { value: "l", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

export function EditShapeModal({
  isOpen,
  onClose,
  shape,
  onUpdate,
}: EditShapeModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    emoji: string;
    details: string;
    venue: string;
    color: string;
    size: string;
    votes: number;
    isCustom: boolean;
  }>({
    title: "",
    description: "",
    startTime: "9:00 AM",
    endTime: "10:00 AM",
    emoji: "📅",
    details: "",
    venue: "",
    color: "blue",
    size: "m",
    votes: 0,
    isCustom: true,
  });

  useEffect(() => {
    if (shape) {
      console.log("Loading shape data:", shape); // Debug log
      setFormData({
        title: shape.props.title || "",
        description: shape.props.description || "",
        startTime: shape.props.startTime || shape.props.time || "9:00 AM", // Handle legacy time property
        endTime:
          shape.props.endTime ||
          getDefaultEndTime(
            shape.props.startTime || shape.props.time || "9:00 AM"
          ),
        emoji: shape.props.emoji || "📅",
        details: shape.props.details || "",
        venue: shape.props.venue || "",
        color: shape.props.color || "blue",
        size: shape.props.size || "m",
        votes: shape.props.votes || 0,
        isCustom: shape.props.isCustom ?? true,
      });
    }
  }, [shape]);

  // Helper function to calculate default end time (1 hour after start)
  const getDefaultEndTime = (startTime: string): string => {
    const timeOptions = TIME_OPTIONS;
    const currentIndex = timeOptions.indexOf(startTime);
    if (currentIndex === -1) return "10:00 AM"; // fallback

    // Add 2 slots (1 hour) to get end time
    const endIndex = Math.min(currentIndex + 2, timeOptions.length - 1);
    return timeOptions[endIndex];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shape) {
      console.log("Updating shape with data:", formData); // Debug log

      // Prepare the update object based on shape type
      const updateData = {
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          ...formData,
        },
      };

      // Remove properties that don't belong to this shape type
      if (shape.type === "section") {
        delete updateData.props.description;
        delete updateData.props.venue;
        delete updateData.props.votes;
        delete updateData.props.isCustom;
      } else if (shape.type === "activity") {
        delete updateData.props.startTime;
        delete updateData.props.endTime;
        delete updateData.props.details;
        delete updateData.props.emoji;
      }

      console.log("Final update data:", updateData); // Debug log
      onUpdate(updateData);
    }
    onClose();
  };

  const handleVoteToggle = () => {
    const newVotes = formData.votes > 0 ? 0 : 1;
    setFormData((prev) => ({ ...prev, votes: newVotes }));
  };

  if (!shape) return null;

  const isSection = shape.type === "section";
  const isActivity = shape.type === "activity";

  // Time options (matches Whiteboard component)
  const TIME_OPTIONS = [
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSection ? (
              <>
                <Clock className="h-5 w-5" />
                Edit Section
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5" />
                Edit Activity
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter title..."
              required
            />
          </div>

          {/* Emoji (for sections) */}
          {isSection && (
            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={formData.emoji}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, emoji: e.target.value }))
                  }
                  placeholder="Enter emoji..."
                  maxLength={2}
                  className="w-20"
                />
                <div className="text-2xl">{formData.emoji}</div>
              </div>
              <div className="grid grid-cols-10 gap-1 p-2 border rounded max-h-20 overflow-y-auto">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-lg hover:bg-gray-100 p-1 rounded"
                    onClick={() => setFormData((prev) => ({ ...prev, emoji }))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time Range (for sections) */}
          {isSection && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Range
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startTime" className="text-sm text-gray-600">
                    Start Time
                  </Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, startTime: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endTime" className="text-sm text-gray-600">
                    End Time
                  </Label>
                  <Select
                    value={formData.endTime}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, endTime: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                Duration: {formData.startTime} - {formData.endTime}
              </div>
            </div>
          )}

          {/* Details (for sections) */}
          {isSection && (
            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, details: e.target.value }))
                }
                placeholder="Add any additional details..."
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Description (for activities) */}
          {isActivity && (
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter description..."
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Venue (for activities) */}
          {isActivity && (
            <div className="space-y-2">
              <Label htmlFor="venue" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Venue
              </Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, venue: e.target.value }))
                }
                placeholder="Enter venue..."
              />
            </div>
          )}

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <Select
              value={formData.color}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, color: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{
                          backgroundColor: `var(--color-${color.value}-500, ${color.value})`,
                        }}
                      />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label>Size</Label>
            <Select
              value={formData.size}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, size: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Votes (for activities) */}
          {isActivity && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Vote className="h-4 w-4" />
                Votes
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={formData.votes > 0 ? "default" : "outline"}
                  onClick={handleVoteToggle}
                  className="flex items-center gap-2"
                >
                  <Vote className="h-4 w-4" />
                  {formData.votes > 0 ? "Voted" : "Vote"}
                </Button>
                {formData.votes > 0 && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {formData.votes} vote{formData.votes !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
