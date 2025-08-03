import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerState {
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  totalDuration: number; // in seconds
}

interface UseTimerProps {
  initialDuration: number; // in minutes
  onComplete?: () => void;
  onTick?: (timeRemaining: number) => void;
}

export function useTimer({ initialDuration, onComplete, onTick }: UseTimerProps) {
  const [timer, setTimer] = useState<TimerState>({
    timeRemaining: initialDuration * 60,
    isRunning: false,
    isPaused: false,
    isCompleted: false,
    totalDuration: initialDuration * 60,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const getProgress = useCallback((): number => {
    if (timer.totalDuration === 0) return 0;
    return ((timer.totalDuration - timer.timeRemaining) / timer.totalDuration) * 100;
  }, [timer.timeRemaining, timer.totalDuration]);

  const start = useCallback(() => {
    if (timer.isCompleted) return;
    
    setTimer(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
  }, [timer.isCompleted]);

  const pause = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true,
    }));
  }, []);

  const resume = useCallback(() => {
    if (timer.isCompleted) return;
    
    setTimer(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
  }, [timer.isCompleted]);

  const stop = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      timeRemaining: prev.totalDuration,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
    }));
  }, []);

  const reset = useCallback((newDuration?: number) => {
    const duration = newDuration ? newDuration * 60 : timer.totalDuration;
    setTimer({
      timeRemaining: duration,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      totalDuration: duration,
    });
  }, [timer.totalDuration]);

  // Timer countdown effect
  useEffect(() => {
    if (timer.isRunning && timer.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          
          if (onTick) {
            onTick(newTimeRemaining);
          }
          
          if (newTimeRemaining <= 0) {
            if (onComplete) {
              onComplete();
            }
            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false,
              isCompleted: true,
            };
          }
          
          return {
            ...prev,
            timeRemaining: newTimeRemaining,
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isRunning, timer.timeRemaining, onComplete, onTick]);

  return {
    ...timer,
    formattedTime: formatTime(timer.timeRemaining),
    progress: getProgress(),
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
