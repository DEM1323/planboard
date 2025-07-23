import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareCode: string;
  planTitle: string;
}

export function ShareModal({ isOpen, onClose, shareCode, planTitle }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/plan/${shareCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{planTitle}"</DialogTitle>
          <DialogDescription>
            Anyone with this link can view and edit this planboard.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <div className="flex items-center space-x-2">
              <input
                readOnly
                value={shareUrl}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button size="sm" className="px-3" onClick={handleCopy}>
                <span className="sr-only">Copy</span>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Share code: <span className="font-mono font-semibold">{shareCode}</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
