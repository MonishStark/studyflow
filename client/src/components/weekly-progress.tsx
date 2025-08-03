import { useQuery } from "@tanstack/react-query";
import { SessionProgress } from "@shared/schema";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

export function WeeklyProgress() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const startDateStr = format(weekStart, "yyyy-MM-dd");
  const endDateStr = format(weekEnd, "yyyy-MM-dd");

  const { data: weeklyProgress = [] } = useQuery<SessionProgress[]>({
    queryKey: ["/api/weekly-progress", startDateStr, endDateStr],
  });

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const getDayProgress = (day: Date) => {
    const dayProgress = weeklyProgress.filter(progress => 
      isSameDay(new Date(progress.date), day)
    );
    
    const totalMinutes = dayProgress.reduce((sum, progress) => sum + (progress.studiedMinutes || 0), 0);
    const hours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal
    
    return { hours, hasStudied: totalMinutes > 0 };
  };

  const totalWeeklyHours = weeklyProgress.reduce((sum, progress) => 
    sum + (progress.studiedMinutes || 0), 0) / 60;

  const weeklyTarget = 35; // 35 hours target per week
  const progressPercentage = Math.min((totalWeeklyHours / weeklyTarget) * 100, 100);

  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Weekly Progress</h3>
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-neutral-600">Study Hours This Week</span>
          <span className="text-2xl font-bold text-primary">
            {totalWeeklyHours.toFixed(1)}h
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-neutral-100 rounded-full h-2 mb-4">
          <div 
            className="bg-primary h-2 rounded-full progress-bar transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Weekly Grid */}
        <div className="flex justify-between text-center">
          {weekDays.map((day, index) => {
            const { hours, hasStudied } = getDayProgress(day);
            const dayLetter = format(day, 'EEEEE'); // Single letter day
            const isToday = isSameDay(day, now);
            
            return (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isToday 
                    ? 'bg-primary' 
                    : hasStudied 
                      ? 'bg-secondary' 
                      : 'bg-neutral-200'
                }`}>
                  <span className={`text-xs font-medium ${
                    isToday || hasStudied ? 'text-white' : 'text-neutral-400'
                  }`}>
                    {dayLetter.toUpperCase()}
                  </span>
                </div>
                <span className={`text-xs ${
                  hasStudied ? 'text-neutral-500' : 'text-neutral-400'
                }`}>
                  {hours > 0 ? `${hours}h` : '0h'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
