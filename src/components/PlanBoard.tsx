import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Plus,
  Clock,
  MapPin,
  Users,
  Edit3,
  Trash2,
  Share2,
  Calendar,
  Palette,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import Whiteboard from "../Whiteboard";
import { AddSectionModal } from "./AddSectionModal";
import { EditSectionModal } from "./EditSectionModal";
import { AddActivityModal } from "./AddActivityModal";
import { ShareModal } from "./ShareModal";
import { ConfirmationDialog } from "./ConfirmationDialog";

interface PlanBoardProps {
  planId: Id<"plans">;
  shareCode?: string;
  isOwner?: boolean;
}

export function PlanBoard({
  planId,
  shareCode,
  isOwner = false,
}: PlanBoardProps) {
  const [activeTab, setActiveTab] = useState<"plan" | "whiteboard">("plan");
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);
  const [editSectionModalOpen, setEditSectionModalOpen] = useState(false);
  const [addActivityModalOpen, setAddActivityModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedSectionActivity, setSelectedSectionActivity] =
    useState<any>(null);

  // Queries
  const plan = useQuery(api.plans.getPlanWithSections, { planId });
  const user = useQuery(api.auth.loggedInUser);

  // Mutations
  const addSection = useMutation(api.plans.addSection);
  const updateSection = useMutation(api.plans.updateSection);
  const deleteSection = useMutation(api.plans.deleteSection);
  const addActivityToSection = useMutation(api.plans.addActivityToSection);
  const removeActivityFromSection = useMutation(
    api.plans.removeActivityFromSection
  );
  const addVote = useMutation(api.plans.addVote);
  const createActivity = useMutation(api.plans.createActivity);

  // Generate user color for anonymous users
  const getUserColor = () => {
    const colors = [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAddSection = async (sectionData: {
    name: string;
    emoji: string;
    startTime: string;
    endTime?: string;
    notes?: string;
  }) => {
    try {
      await addSection({
        planId,
        ...sectionData,
      });
      toast.success("Section added successfully!");
      setAddSectionModalOpen(false);
    } catch (error) {
      toast.error("Failed to add section");
    }
  };

  const handleEditSection = async (sectionId: string, updates: any) => {
    try {
      await updateSection({
        sectionId: sectionId as any,
        ...updates,
      });
      toast.success("Section updated successfully!");
      setEditSectionModalOpen(false);
      setSelectedSection(null);
    } catch (error) {
      toast.error("Failed to update section");
    }
  };

  const handleDeleteSection = async () => {
    if (!selectedSection) return;

    try {
      await deleteSection({
        sectionId: selectedSection._id,
      });
      toast.success("Section deleted successfully!");
      setDeleteConfirmOpen(false);
      setSelectedSection(null);
    } catch (error) {
      toast.error("Failed to delete section");
    }
  };

  const handleAddActivity = async (activityData: {
    name: string;
    type: "venue" | "custom";
    location?: string;
    description?: string;
    isReusable: boolean;
    price?: string;
    neighborhood?: string;
    category?: string;
  }) => {
    try {
      // Create the activity
      const { activityId } = await createActivity({
        ...activityData,
        userId: user?._id,
      });

      // Add it to the selected section
      if (selectedSection) {
        await addActivityToSection({
          sectionId: selectedSection._id,
          activityId,
          userId: user?._id,
        });
      }

      toast.success("Activity added successfully!");
      setAddActivityModalOpen(false);
      setSelectedSection(null);
    } catch (error) {
      toast.error("Failed to add activity");
    }
  };

  const handleVote = async (sectionActivityId: string) => {
    try {
      const userName = user?.name || "Anonymous";
      const userColor = getUserColor();

      await addVote({
        sectionActivityId: sectionActivityId as any,
        userId: user?._id,
        userName,
        userColor,
      });
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  const formatTimeRange = (start: string, end?: string) => {
    if (!end) return `${start} onwards`;
    return `${start} - ${end}`;
  };

  const formatPlanDate = (dateStr?: string) => {
    if (!dateStr) return "No date set";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!plan) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
              <p className="text-sm text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatPlanDate(plan.date)}
              </p>
            </div>
            {shareCode && (
              <Badge variant="secondary" className="text-xs">
                Share: {shareCode}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareModalOpen(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4">
          <Button
            variant={activeTab === "plan" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("plan")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Plan
          </Button>
          <Button
            variant={activeTab === "whiteboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("whiteboard")}
          >
            <Palette className="h-4 w-4 mr-2" />
            Whiteboard
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "plan" ? (
          <div className="h-full overflow-y-auto p-6 bg-gray-50">
            {plan.sections && plan.sections.length > 0 ? (
              <div className="space-y-4">
                {plan.sections.map((section) => (
                  <Card key={section._id} className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{section.emoji}</span>
                          <div>
                            <CardTitle className="text-lg">
                              {section.name}
                            </CardTitle>
                            <p className="text-sm text-gray-500 flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTimeRange(
                                section.startTime,
                                section.endTime
                              )}
                            </p>
                          </div>
                        </div>

                        {isOwner && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSection(section);
                                setEditSectionModalOpen(true);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSection(section);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {section.notes && (
                        <p className="text-sm text-gray-600 mt-2 flex items-start">
                          <MessageSquare className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          {section.notes}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        {section.activities && section.activities.length > 0 ? (
                          section.activities.map((sa) => (
                            <div
                              key={sa._id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">
                                    {sa.activity?.name}
                                  </h4>
                                  {sa.activity?.location && (
                                    <div className="flex items-center text-sm text-gray-500">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {sa.activity.location}
                                    </div>
                                  )}
                                </div>
                                {sa.activity?.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {sa.activity.description}
                                  </p>
                                )}
                                {sa.activity?.price && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs mt-1"
                                  >
                                    {sa.activity.price}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm font-medium">
                                    {sa.voteCount || 0}
                                  </span>
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVote(sa._id)}
                                  className="min-w-[60px]"
                                >
                                  Vote
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <p className="text-sm">No activities yet</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                setSelectedSection(section);
                                setAddActivityModalOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Activity
                            </Button>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedSection(section);
                            setAddActivityModalOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Activity
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No time blocks yet
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Start planning by adding time blocks to organize your day.
                  </p>
                  <Button
                    onClick={() => setAddSectionModalOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Block
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Button
                onClick={() => setAddSectionModalOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Block
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <Whiteboard planId={planId} />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddSectionModal
        open={addSectionModalOpen}
        onOpenChange={setAddSectionModalOpen}
        onSubmit={handleAddSection}
      />

      <EditSectionModal
        open={editSectionModalOpen}
        onOpenChange={setEditSectionModalOpen}
        section={selectedSection}
        onSubmit={handleEditSection}
      />

      <AddActivityModal
        open={addActivityModalOpen}
        onOpenChange={setAddActivityModalOpen}
        onSubmit={handleAddActivity}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareCode={shareCode || ""}
        planTitle={plan.title}
      />

      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Section"
        description={`Are you sure you want to delete "${selectedSection?.name || "this section"}" and all its activities?`}
        onConfirm={handleDeleteSection}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
