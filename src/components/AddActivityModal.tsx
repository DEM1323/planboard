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
import { Badge } from "./ui/badge";

interface AddActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    type: "venue" | "custom";
    location?: string;
    description?: string;
    isReusable: boolean;
    price?: string;
    neighborhood?: string;
    category?: string;
  }) => void;
}

const VENUE_CATEGORIES = [
  "Restaurant",
  "Bar",
  "Cafe",
  "Entertainment",
  "Sports",
  "Shopping",
  "Outdoor",
  "Cultural",
  "Wellness",
  "Education",
  "Other",
];

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

export function AddActivityModal({
  open,
  onOpenChange,
  onSubmit,
}: AddActivityModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"venue" | "custom">("custom");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isReusable, setIsReusable] = useState(true);
  const [price, setPrice] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        isReusable,
        price: price || undefined,
        neighborhood: neighborhood.trim() || undefined,
        category: category || undefined,
      });

      // Reset form
      setName("");
      setType("custom");
      setLocation("");
      setDescription("");
      setIsReusable(true);
      setPrice("");
      setNeighborhood("");
      setCategory("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Activity Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Coffee at Starbucks, Movie night, Team meeting"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Activity Type</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={type === "custom" ? "default" : "outline"}
                onClick={() => setType("custom")}
                className="flex-1"
              >
                Custom Activity
              </Button>
              <Button
                type="button"
                variant={type === "venue" ? "default" : "outline"}
                onClick={() => setType("venue")}
                className="flex-1"
              >
                Venue/Location
              </Button>
            </div>
          </div>

          {type === "venue" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., 123 Main St, Downtown"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {VENUE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price Range</Label>
                  <Select value={price} onValueChange={setPrice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select price" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_RANGES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Neighborhood/Area</Label>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g., Downtown, West Side, Suburbs"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details about this activity..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isReusable"
              checked={isReusable}
              onChange={(e) => setIsReusable(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isReusable">Save for future use</Label>
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
              {isSubmitting ? "Adding..." : "Add Activity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
