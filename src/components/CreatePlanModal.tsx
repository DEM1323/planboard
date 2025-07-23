import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { EmbeddedCalendar } from "./EmbeddedCalendar";

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlan: (title: string, date?: string) => void;
  isCreating: boolean;
}

export function CreatePlanModal({
  isOpen,
  onClose,
  onCreatePlan,
  isCreating,
}: CreatePlanModalProps) {
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      // Convert Date to YYYY-MM-DD string format if date is selected
      const dateString = selectedDate
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
        : undefined;
      onCreatePlan(title.trim(), dateString);
      setTitle("");
      setSelectedDate(undefined);
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setTitle("");
      setSelectedDate(undefined);
      onClose();
    }
  };

  const handleCancelClick = () => {
    setTitle("");
    setSelectedDate(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Plan</DialogTitle>
          <DialogDescription>
            Give your planboard a title and select a date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium mb-2 block">
                Plan Title *
              </label>
              <Input
                id="title"
                placeholder="Enter plan title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <EmbeddedCalendar
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancelClick}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
