import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="floating-action-button fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg z-40"
      size="icon"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
