import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
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

interface AddSectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    emoji: string;
    startTime: string;
    endTime?: string;
    notes?: string;
  }) => void;
}

const EMOJI_OPTIONS = [
  "🍽️",
  "🍺",
  "🎬",
  "🎭",
  "🎨",
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
  "🎪",
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

export function AddSectionModal({
  open,
  onOpenChange,
  onSubmit,
}: AddSectionModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍽️");
  const [startTime, setStartTime] = useState("12:00 PM");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isOpenEnded, setIsOpenEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        emoji,
        startTime,
        endTime: isOpenEnded ? undefined : endTime || undefined,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setName("");
      setEmoji("🍽️");
      setStartTime("12:00 PM");
      setEndTime("");
      setNotes("");
      setIsOpenEnded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Time Block</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">What's happening?</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dinner, Meeting, Workout"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Emoji</Label>
            <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
              {EMOJI_OPTIONS.map((emojiOption) => (
                <button
                  key={emojiOption}
                  type="button"
                  onClick={() => setEmoji(emojiOption)}
                  className={`p-2 text-lg rounded hover:bg-gray-100 ${
                    emoji === emojiOption
                      ? "bg-blue-100 border-2 border-blue-300"
                      : ""
                  }`}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="openEnded"
                checked={isOpenEnded}
                onChange={(e) => setIsOpenEnded(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="openEnded">Open-ended</Label>
            </div>

            {!isOpenEnded && (
              <div>
                <Label htmlFor="endTime">End Time (optional)</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Adding..." : "Add Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
