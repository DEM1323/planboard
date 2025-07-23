import { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { Toaster, toast } from "sonner";
import { Plus, Share2, ArrowLeft, LogOut, Calendar } from "lucide-react";

// UI Components
import { Button } from "./components/ui/button";
import { PlanCard } from "./components/PlanCard";
import { ShareModal } from "./components/ShareModal";
import { CreatePlanModal } from "./components/CreatePlanModal";
import { EditPlanModal } from "./components/EditPlanModal";
import { ConfirmationDialog } from "./components/ConfirmationDialog";
import { EmptyState } from "./components/EmptyState";
import { UserHeader } from "./components/UserHeader";
import { AuthPage } from "./AuthPage";
import { CalendarPopup } from "./components/CalendarPopup";

// Whiteboard component (keeping the existing one)
import Whiteboard from "./Whiteboard";

function HomePage() {
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const user = useQuery(api.auth.loggedInUser);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [planToDelete, setPlanToDelete] = useState<any>(null);

  const plans = useQuery(
    api.plans.getUserPlans,
    user ? { userId: user._id } : "skip"
  );
  const createPlan = useMutation(api.plans.createPlan);
  const updatePlan = useMutation(api.plans.updatePlan);
  const deletePlan = useMutation(api.plans.deletePlan);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreatePlan = async (title: string, date?: string) => {
    if (!user) return;

    setIsCreating(true);
    try {
      const result = await createPlan({
        title,
        date,
        userId: user._id,
      });
      toast.success("Plan created successfully!");
      setCreateModalOpen(false);
      navigate(`/plan/${result.shareCode}`);
    } catch (error) {
      toast.error("Failed to create plan");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setEditModalOpen(true);
  };

  const handleUpdatePlan = async (
    planId: string,
    title: string,
    date?: string
  ) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      await updatePlan({
        planId: planId as any,
        title,
        date,
      });
      toast.success("Plan updated successfully!");
      setEditModalOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error("Failed to update plan");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePlan = (plan: any) => {
    setPlanToDelete(plan);
    setDeleteConfirmOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    setIsDeleting(true);
    try {
      await deletePlan({ planId: planToDelete._id });
      toast.success("Plan deleted successfully!");
      setDeleteConfirmOpen(false);
      setPlanToDelete(null);
    } catch (error) {
      toast.error("Failed to delete plan");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSharePlan = (plan: any) => {
    setSelectedPlan(plan);
    setShareModalOpen(true);
  };

  const handleOpenPlan = (shareCode: string) => {
    navigate(`/plan/${shareCode}`);
  };

  const updateUserName = (newName: string) => {
    // TODO: Implement user name update with Convex Auth
    toast.info("User name update not implemented yet");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <EmptyState onCreatePlan={() => {}} variant="loading" />
      </div>
    );
  }

  // Loading state for plans
  const isLoadingPlans = plans === undefined;

  // Error state (could be extended with actual error handling)
  const hasError = false;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Planboard</h1>
          <div className="flex items-center space-x-4">
            <UserHeader
              userName={user.name || "User"}
              onUpdateName={updateUserName}
            />
            <Button
              onClick={() => setCreateModalOpen(true)}
              disabled={isLoadingPlans}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
            <Button
              variant="outline"
              onClick={() => void signOut()}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">My Plans</h2>
          <p className="text-muted-foreground">
            {isLoadingPlans
              ? "Loading..."
              : `Plans you've created (${plans?.length || 0})`}
          </p>
        </div>

        {/* Loading State */}
        {isLoadingPlans && (
          <EmptyState
            onCreatePlan={() => setCreateModalOpen(true)}
            variant="loading"
          />
        )}

        {/* Error State */}
        {hasError && (
          <EmptyState
            onCreatePlan={() => setCreateModalOpen(true)}
            variant="error"
          />
        )}

        {/* Empty State */}
        {!isLoadingPlans && !hasError && plans && plans.length === 0 && (
          <EmptyState onCreatePlan={() => setCreateModalOpen(true)} />
        )}

        {/* Plans Grid */}
        {!isLoadingPlans && !hasError && plans && plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                currentUserId={user._id}
                onShare={handleSharePlan}
                onOpen={handleOpenPlan}
                onEdit={handleEditPlan}
                onDelete={handleDeletePlan}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreatePlanModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreatePlan={handleCreatePlan}
        isCreating={isCreating}
      />

      <EditPlanModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedPlan(null);
        }}
        onUpdatePlan={handleUpdatePlan}
        isUpdating={isUpdating}
        plan={selectedPlan}
      />

      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPlanToDelete(null);
        }}
        onConfirm={confirmDeletePlan}
        title="Delete Plan?"
        description={`Are you sure you want to delete "${planToDelete?.title}"? This action cannot be undone and will also delete the associated whiteboard.`}
        confirmText="Delete Plan"
        variant="destructive"
        isLoading={isDeleting}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false);
          setSelectedPlan(null);
        }}
        shareCode={selectedPlan?.shareCode || ""}
        planTitle={selectedPlan?.title || ""}
      />
    </div>
  );
}

function PlanPage() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const [tldrawEditor, setTldrawEditor] = useState<any>(null);
  const dateElementRef = useRef<HTMLSpanElement>(null);
  const navigate = useNavigate();

  const plan = useQuery(
    api.plans.getPlanByShareCode,
    shareCode ? { shareCode } : "skip"
  );
  const updatePlan = useMutation(api.plans.updatePlan);
  const [isUpdating, setIsUpdating] = useState(false);

  const user = useQuery(api.auth.loggedInUser);

  // Store tldraw editor reference when whiteboard mounts
  const handleWhiteboardMount = (editor: any) => {
    setTldrawEditor(editor);
  };

  // Prevent tldraw interactions when calendar is open
  useEffect(() => {
    if (tldrawEditor) {
      if (showCalendar) {
        // Temporarily make editor read-only and blur focus
        tldrawEditor.updateInstanceState({ isReadonly: true });
        tldrawEditor.complete(); // Complete any ongoing interactions
      } else {
        // Restore editor interaction
        tldrawEditor.updateInstanceState({ isReadonly: false });
      }
    }
  }, [showCalendar, tldrawEditor]);

  const handleUpdatePlan = async (updates: {
    title?: string;
    date?: string;
  }) => {
    if (!user || !plan) {
      toast.error("You must be signed in to edit plans");
      return;
    }

    setIsUpdating(true);
    try {
      await updatePlan({
        planId: plan._id,
        ...updates,
      });
      toast.success("Plan updated successfully!");
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to update plan";
      if (errorMessage.includes("Not authorized")) {
        toast.error("You can only edit plans you created");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTitleEdit = () => {
    if (!plan) return;
    setEditingTitle(plan.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (editingTitle.trim() && editingTitle !== plan?.title) {
      handleUpdatePlan({ title: editingTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditingTitle("");
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  const handleDateEdit = () => {
    if (!plan || !dateElementRef.current) return;

    // Get position of the date element
    const rect = dateElementRef.current.getBoundingClientRect();
    setCalendarPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });

    setShowCalendar(true);
  };

  const handleCalendarSelect = async (date: Date | undefined) => {
    let dateToSave = "";

    if (date) {
      // Convert Date to YYYY-MM-DD format for storage
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      dateToSave = `${year}-${month}-${day}`;
    }

    // Close calendar first
    setShowCalendar(false);
    setIsEditingDate(false);

    // Only update if the date actually changed
    if (dateToSave !== (plan?.date || "")) {
      await handleUpdatePlan({ date: dateToSave || undefined });
    }
  };

  const handleCalendarClose = () => {
    setShowCalendar(false);
    setIsEditingDate(false);
  };

  const handleDateSave = () => {
    // Convert from MM/DD/YYYY to YYYY-MM-DD for storage
    let dateToSave = "";
    if (editingDate.trim()) {
      const dateParts = editingDate.trim().split("/");
      if (dateParts.length === 3) {
        const [month, day, year] = dateParts;
        // Validate the date parts
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (
          dayNum >= 1 &&
          dayNum <= 31 &&
          monthNum >= 1 &&
          monthNum <= 12 &&
          yearNum >= 1900
        ) {
          dateToSave = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        } else {
          toast.error("Please enter a valid date in MM/DD/YYYY format");
          return;
        }
      } else {
        toast.error("Please enter date in MM/DD/YYYY format");
        return;
      }
    }

    if (dateToSave !== plan?.date) {
      handleUpdatePlan({ date: dateToSave || undefined });
    }
    setIsEditingDate(false);
    setShowCalendar(false);
  };

  const handleDateCancel = () => {
    setIsEditingDate(false);
    setShowCalendar(false);
    setEditingDate("");
  };

  const handleDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleDateSave();
    } else if (e.key === "Escape") {
      handleDateCancel();
    }
  };

  // Convert plan date to Date object for calendar
  const getSelectedDate = (): Date | undefined => {
    if (!plan?.date) return undefined;
    // Parse YYYY-MM-DD as local date to avoid timezone issues
    const [year, month, day] = plan.date
      .split("-")
      .map((num) => parseInt(num, 10));
    return new Date(year, month - 1, day); // month is 0-based
  };

  if (!shareCode) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <EmptyState onCreatePlan={() => navigate("/")} variant="error" />
      </div>
    );
  }

  if (plan === undefined) {
    return (
      <div className="h-screen flex flex-col">
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Plans</span>
              </Button>
              <div className="border-l border-gray-300 h-6"></div>
              <div className="animate-pulse">
                <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 w-20 bg-gray-100 rounded"></div>
              </div>
            </div>
            <Button variant="outline" disabled>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Loading plan...
            </h3>
            <p className="text-sm text-muted-foreground">
              Preparing your whiteboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (plan === null) {
    return (
      <div className="h-screen flex flex-col">
        <header className="border-b bg-background">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Plans</span>
              </Button>
              <div className="border-l border-gray-300 h-6"></div>
              <span className="text-lg font-semibold">Plan Not Found</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-red-600 text-2xl">🔍</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Plan not found</h2>
            <p className="text-muted-foreground mb-6">
              The plan with code{" "}
              <span className="font-mono font-semibold">"{shareCode}"</span>{" "}
              doesn't exist or may have been deleted.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go back to Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Format plan date for display (Day of week, Month day, year)
  const formatPlanDate = (dateStr?: string) => {
    if (!dateStr) return null;
    // Parse YYYY-MM-DD as local date to avoid timezone issues
    const [year, month, day] = dateStr
      .split("-")
      .map((num) => parseInt(num, 10));
    const date = new Date(year, month - 1, day); // month is 0-based
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const planDate = formatPlanDate(plan.date);

  // Check if current user is the owner of the plan
  const isOwner = user && plan.createdBy === user._id;

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-background z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="border-l border-gray-300 h-6 flex-shrink-0"></div>
            <div className="min-w-0 flex-1">
              {/* Editable Title */}
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="text-lg font-semibold bg-transparent border-b-2 border-primary focus:outline-none w-full"
                  autoFocus
                  disabled={isUpdating}
                />
              ) : (
                <h1
                  className={`text-lg font-semibold truncate ${
                    isOwner
                      ? "cursor-pencil hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
                      : ""
                  }`}
                  onClick={isOwner ? handleTitleEdit : undefined}
                  style={{
                    cursor: isOwner
                      ? "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m18 2 4 4-14 14H4v-4L18 2z'/%3E%3Cpath d='m14.5 5.5 4 4'/%3E%3C/svg%3E\") 0 20, pointer"
                      : "default",
                  }}
                  title={isOwner ? "Click to edit plan title" : ""}
                >
                  {plan.title}
                </h1>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {/* Inline Editable Date */}
                <div className="flex items-center relative">
                  <Calendar className="h-3 w-3 mr-1" />
                  {isEditingDate ? (
                    <input
                      type="text"
                      value={editingDate}
                      onChange={(e) => setEditingDate(e.target.value)}
                      onBlur={handleDateSave}
                      onKeyDown={handleDateKeyDown}
                      placeholder="MM/DD/YYYY"
                      className="text-sm bg-transparent border-b border-primary focus:outline-none w-28"
                      autoFocus
                      disabled={isUpdating}
                    />
                  ) : (
                    <>
                      {planDate ? (
                        <span
                          ref={dateElementRef}
                          className={`truncate ${
                            isOwner
                              ? "cursor-pencil hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
                              : ""
                          }`}
                          onClick={isOwner ? handleDateEdit : undefined}
                          style={{
                            cursor: isOwner
                              ? "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m18 2 4 4-14 14H4v-4L18 2z'/%3E%3Cpath d='m14.5 5.5 4 4'/%3E%3C/svg%3E\") 0 20, pointer"
                              : "default",
                          }}
                          title={isOwner ? "Click to edit plan date" : ""}
                        >
                          {planDate}
                        </span>
                      ) : isOwner ? (
                        <span
                          ref={dateElementRef}
                          className="text-muted-foreground/60 cursor-pencil hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
                          onClick={handleDateEdit}
                          style={{
                            cursor:
                              "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m18 2 4 4-14 14H4v-4L18 2z'/%3E%3Cpath d='m14.5 5.5 4 4'/%3E%3C/svg%3E\") 0 20, pointer",
                          }}
                          title="Click to add plan date"
                        >
                          Add date
                        </span>
                      ) : (
                        <span>No date set</span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center">
                  <span>Code: </span>
                  <span className="font-mono font-semibold ml-1">
                    {shareCode}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-4">
            <Button variant="outline" onClick={() => setShareModalOpen(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 bg-gray-50">
        <Whiteboard planId={plan._id} onMount={handleWhiteboardMount} />
      </div>

      {/* Calendar Popup */}
      <CalendarPopup
        isOpen={showCalendar}
        selectedDate={getSelectedDate()}
        onSelect={handleCalendarSelect}
        onClose={handleCalendarClose}
        position={calendarPosition}
        tldrawEditor={tldrawEditor}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareCode={shareCode}
        planTitle={plan.title}
      />
    </div>
  );
}

function AppContent() {
  return (
    <>
      <AuthLoading>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <AuthPage />
      </Unauthenticated>
      <Authenticated>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/plan/:shareCode" element={<PlanPage />} />
          </Routes>
          <Toaster />
        </Router>
      </Authenticated>
    </>
  );
}

export default function App() {
  return <AppContent />;
}
