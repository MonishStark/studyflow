import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudySession } from "@shared/schema";
import { useTimer } from "@/hooks/use-timer";
import { useEffect } from "react";

interface ActiveSessionProps {
  session: StudySession;
  onSessionComplete: () => void;
  onSessionPause: () => void;
  onSessionStop: () => void;
}

export function ActiveSession({ session, onSessionComplete, onSessionPause, onSessionStop }: ActiveSessionProps) {
  const { 
    formattedTime, 
    progress, 
    isRunning, 
    isPaused, 
    isCompleted,
    start, 
    pause, 
    stop 
  } = useTimer({
    initialDuration: session.duration,
    onComplete: onSessionComplete,
  });

  // Auto-start the timer when session becomes active
  useEffect(() => {
    if (session.isActive && !isRunning && !isPaused && !isCompleted) {
      start();
    }
  }, [session.isActive, isRunning, isPaused, isCompleted, start]);

  const handlePause = () => {
    pause();
    onSessionPause();
  };

  const handleStop = () => {
    stop();
    onSessionStop();
  };

  // Calculate stroke-dashoffset for progress circle
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <section className="mt-6 mb-8">
      <div className="study-session-gradient rounded-2xl p-6 text-white shadow-lg">
        <div className="text-center">
          <p className="text-sm opacity-90 mb-2">Current Session</p>
          <h2 className="text-2xl font-bold mb-4">{session.subject}</h2>
          
          {/* Timer Display */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                stroke="rgba(255,255,255,0.2)" 
                strokeWidth="8" 
                fill="none"
              />
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                stroke="white" 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="timer-circle"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{formattedTime}</span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={isRunning ? handlePause : start}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full"
              size="icon"
              disabled={isCompleted}
            >
              {isRunning ? (
                <Pause className="text-white" size={20} />
              ) : (
                <Play className="text-white" size={20} />
              )}
            </Button>
            <Button
              onClick={handleStop}
              className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full"
              size="icon"
            >
              <Square className="text-white" size={20} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
