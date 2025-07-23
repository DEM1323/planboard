import { useState } from "react";
import { User, Edit2, Check, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface UserHeaderProps {
  userName: string;
  onUpdateName: (newName: string) => void;
}

export function UserHeader({ userName, onUpdateName }: UserHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userName);

  const handleSave = () => {
    if (editName.trim() && editName !== userName) {
      onUpdateName(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(userName);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <User className="h-5 w-5 text-muted-foreground" />
      {isEditing ? (
        <div className="flex items-center space-x-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-8 w-32"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{userName}</span>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
