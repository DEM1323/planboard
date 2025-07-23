import { useState, useEffect } from "react";
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

interface Plan {
  _id: string;
  title: string;
  date?: string;
  shareCode?: string;
  createdBy?: string;
  createdAt?: number;
  updatedAt: number;
}

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlan: (planId: string, title: string, date?: string) => void;
  isUpdating: boolean;
  plan: Plan | null;
}

export function EditPlanModal({
  isOpen,
  onClose,
  onUpdatePlan,
  isUpdating,
  plan,
}: EditPlanModalProps) {
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Update form values when plan changes
  useEffect(() => {
    if (plan && isOpen) {
      setTitle(plan.title);

      // Parse YYYY-MM-DD date string to Date object
      if (plan.date) {
        const [year, month, day] = plan.date
          .split("-")
          .map((num) => parseInt(num, 10));
        setSelectedDate(new Date(year, month - 1, day));
      } else {
        setSelectedDate(undefined);
      }
    }
  }, [plan, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && plan) {
      // Convert Date to YYYY-MM-DD string format if date is selected
      const dateString = selectedDate
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
        : undefined;
      onUpdatePlan(plan._id, title.trim(), dateString);
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

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Plan</DialogTitle>
          <DialogDescription>
            Update the title and date for your plan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <label
                htmlFor="edit-title"
                className="text-sm font-medium mb-2 block"
              >
                Plan Title *
              </label>
              <Input
                id="edit-title"
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
            <Button type="submit" disabled={!title.trim() || isUpdating}>
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
