import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { HelpCircle, Keyboard, Layers, Plus } from "lucide-react";

interface PlanBoardKeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: "Plan Board Tools",
    shortcuts: [
      { key: "S", description: "Switch to Section tool" },
      { key: "A", description: "Switch to Activity tool" },
      { key: "Cmd/Ctrl + Shift + S", description: "Add new section" },
      { key: "Cmd/Ctrl + Shift + A", description: "Add new activity" },
    ],
  },
  {
    category: "General TLDraw",
    shortcuts: [
      { key: "Space + Drag", description: "Pan canvas" },
      { key: "Scroll", description: "Zoom in/out" },
      { key: "Cmd/Ctrl + Z", description: "Undo" },
      { key: "Cmd/Ctrl + Shift + Z", description: "Redo" },
      { key: "Delete", description: "Delete selected shapes" },
      { key: "Escape", description: "Cancel current action" },
    ],
  },
  {
    category: "Selection & Editing",
    shortcuts: [
      { key: "V", description: "Select tool" },
      { key: "Cmd/Ctrl + A", description: "Select all shapes" },
      { key: "Cmd/Ctrl + D", description: "Duplicate selected" },
      { key: "Arrow Keys", description: "Move selected shapes" },
      { key: "Shift + Arrow Keys", description: "Move by larger increments" },
    ],
  },
];

export function PlanBoardKeyboardShortcuts({
  isOpen,
  onClose,
}: PlanBoardKeyboardShortcutsProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  const formatKey = (key: string) => {
    return key
      .replace("Cmd/Ctrl", isMac ? "⌘" : "Ctrl")
      .replace("Shift", "⇧")
      .replace("Alt", "⌥")
      .replace("Delete", "⌫")
      .replace("Escape", "⎋");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Plan Board Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {SHORTCUTS.map((category) => (
            <div key={category.category} className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {category.category}
              </h3>
              <div className="grid gap-2">
                {category.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-600">
                      {shortcut.description}
                    </span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatKey(shortcut.key)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-sm text-blue-800 mb-2 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Pro Tips
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Double-click shapes to edit them quickly</li>
                <li>
                  • Use the Plan Board panel to manage all your sections and
                  activities
                </li>
                <li>• Drag shapes to rearrange your plan visually</li>
                <li>• Use different colors to organize your plan by themes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
