import { Button } from './ui/button';
import { ChevronUp, ChevronDown, Home } from 'lucide-react';

interface NavigationProps {
  currentSection: number;
  totalSections: number;
  onNavigate: (section: number) => void;
}

export function Navigation({ currentSection, totalSections, onNavigate }: NavigationProps) {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4 bg-background/80 backdrop-blur-sm border rounded-full px-6 py-3 shadow-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(Math.max(0, currentSection - 1))}
        disabled={currentSection === 0}
        className="rounded-full"
      >
        <ChevronUp className="w-4 h-4" />
      </Button>
      
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSections }, (_, i) => (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              i === currentSection ? 'bg-primary scale-125' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(Math.min(totalSections - 1, currentSection + 1))}
        disabled={currentSection === totalSections - 1}
        className="rounded-full"
      >
        <ChevronDown className="w-4 h-4" />
      </Button>
    </div>
  );
}