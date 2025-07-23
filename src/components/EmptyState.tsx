import { PlusCircle, Lightbulb, Users } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  onCreatePlan: () => void;
  variant?: "plans" | "loading" | "error";
}

export function EmptyState({
  onCreatePlan,
  variant = "plans",
}: EmptyStateProps) {
  if (variant === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <h3 className="text-lg font-medium text-muted-foreground">
          Loading your plans...
        </h3>
        <p className="text-sm text-muted-foreground">Please wait a moment</p>
      </div>
    );
  }

  if (variant === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
          We couldn't load your plans right now. Please try refreshing the page.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <PlusCircle className="h-10 w-10 text-primary" />
      </div>

      <h3 className="text-xl font-semibold mb-2">Create your first plan</h3>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Start collaborating with others by creating a planboard. Add activities,
        vote on options, and bring your ideas to life.
      </p>

      <Button onClick={onCreatePlan} size="lg" className="mb-8">
        <PlusCircle className="h-5 w-5 mr-2" />
        Create New Plan
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium mb-1">Visual Planning</h4>
            <p className="text-sm text-muted-foreground">
              Use the built-in whiteboard to sketch ideas and create visual
              plans
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium mb-1">Real-time Collaboration</h4>
            <p className="text-sm text-muted-foreground">
              Share your plans with others and collaborate in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
