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
  });

  useEffect(() => {
    if (shape) {
      setFormData({
        title: shape.props.title || "",
        description: shape.props.description || "",
        startTime: shape.props.startTime || "9:00 AM",
        endTime: shape.props.endTime || "10:00 AM",
        emoji: shape.props.emoji || "📅",
        details: shape.props.details || "",
        venue: shape.props.venue || "",
        color: shape.props.color || "blue",
        size: shape.props.size || "m",
        votes: shape.props.votes || 0,
      });
    }
  }, [shape]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shape) {
      onUpdate({
        id: shape.id,
        props: {
          ...shape.props,
          ...formData,
        },
      });
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

  // Time options (should match Whiteboard)
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {isSection ? "Section" : "Activity"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
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
              <Input
                value={formData.emoji}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, emoji: e.target.value }))
                }
                placeholder="Emoji"
                maxLength={2}
              />
            </div>
          )}

          {/* Time (for sections) */}
          {isSection && (
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <select
                id="startTime"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className="w-full border rounded px-2 py-1"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <Label htmlFor="endTime">End Time</Label>
              <select
                id="endTime"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                }
                className="w-full border rounded px-2 py-1"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
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
              />
            </div>
          )}

          {/* Venue (for activities) */}
          {isActivity && (
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
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
            <Input
              value={formData.color}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, color: e.target.value }))
              }
              placeholder="Color (e.g. blue, green, etc.)"
            />
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label>Size</Label>
            <Input
              value={formData.size}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, size: e.target.value }))
              }
              placeholder="Size (s, m, l, xl)"
            />
          </div>

          {/* Votes (for activities) */}
          {isActivity && (
            <div className="space-y-2">
              <Label>Votes</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant={formData.votes > 0 ? "default" : "outline"}
                  onClick={handleVoteToggle}
                  className="flex items-center gap-2"
                >
                  <span>Vote</span>
                </Button>
                {formData.votes > 0 && (
                  <span className="text-sm text-gray-600">
                    {formData.votes} vote{formData.votes !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
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
