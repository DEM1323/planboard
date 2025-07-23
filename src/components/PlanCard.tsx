import {
  Share2,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Plan {
  _id: string;
  title: string;
  date?: string;
  shareCode?: string;
  createdBy?: string;
  createdAt?: number;
  updatedAt: number;
}

interface PlanCardProps {
  plan: Plan;
  currentUserId: string;
  onShare: (plan: Plan) => void;
  onOpen: (shareCode: string) => void;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}

export function PlanCard({
  plan,
  currentUserId,
  onShare,
  onOpen,
  onEdit,
  onDelete,
}: PlanCardProps) {
  const isOwner = plan.createdBy === currentUserId;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatPlanDate = (dateStr?: string) => {
    if (!dateStr) return null;
    // Parse YYYY-MM-DD as local date to avoid timezone issues
    const [year, month, day] = dateStr
      .split("-")
      .map((num) => parseInt(num, 10));
    const date = new Date(year, month - 1, day); // month is 0-based
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const lastUpdated = formatDate(plan.updatedAt);
  const planDate = formatPlanDate(plan.date);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{plan.title}</CardTitle>
            {planDate && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                {planDate}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            {isOwner && <Badge variant="secondary">Owner</Badge>}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onEdit(plan);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Plan
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDelete(plan);
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Updated {lastUpdated}
          </div>
          {/* Placeholder for activity count - this would come from board analysis */}
          <div className="text-xs">0 activities</div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onShare(plan);
          }}
        >
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
        <Button
          size="sm"
          onClick={() => plan.shareCode && onOpen(plan.shareCode)}
        >
          Open
        </Button>
      </CardFooter>
    </Card>
  );
}
