import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStudySessionSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const formSchema = insertStudySessionSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
});

type FormData = z.infer<typeof formSchema>;

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleModal({ isOpen, onClose }: ScheduleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      duration: 25,
      startDate: "",
      endDate: "",
      startTime: "09:00",
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const sessionData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };
      
      const response = await apiRequest("POST", "/api/study-sessions", sessionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-sessions"] });
      toast({
        title: "Session Created",
        description: "Your study session has been successfully scheduled.",
      });
      reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create study session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createSessionMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl p-6 w-full max-w-sm mx-auto animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-neutral-900">New Study Session</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X size={16} />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="subject" className="text-sm font-medium text-neutral-700">
              Subject
            </Label>
            <Input
              id="subject"
              {...register("subject")}
              placeholder="Enter subject name"
              className="mt-1"
            />
            {errors.subject && (
              <p className="text-sm text-red-500 mt-1">{errors.subject.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium text-neutral-700">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className="mt-1"
              />
              {errors.startDate && (
                <p className="text-sm text-red-500 mt-1">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium text-neutral-700">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className="mt-1"
              />
              {errors.endDate && (
                <p className="text-sm text-red-500 mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="startTime" className="text-sm font-medium text-neutral-700">
              Start Time
            </Label>
            <Input
              id="startTime"
              type="time"
              {...register("startTime")}
              className="mt-1"
            />
            {errors.startTime && (
              <p className="text-sm text-red-500 mt-1">{errors.startTime.message}</p>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium text-neutral-700">
              Duration (minutes)
            </Label>
            <Select
              value={watch("duration")?.toString()}
              onValueChange={(value) => setValue("duration", parseInt(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
            {errors.duration && (
              <p className="text-sm text-red-500 mt-1">{errors.duration.message}</p>
            )}
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
