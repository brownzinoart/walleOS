import { useState, useEffect } from 'react';
import { ExperienceSection } from './components/ExperienceSection';
import { Navigation } from './components/Navigation';
import { resumeData } from './data/resumeData';

export default function App() {
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp' && currentSection > 0) {
        setCurrentSection(currentSection - 1);
      } else if (event.key === 'ArrowDown' && currentSection < resumeData.length - 1) {
        setCurrentSection(currentSection + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection]);

  const handleNavigate = (section: number) => {
    setCurrentSection(section);
  };

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Main Content */}
      <div 
        className="flex flex-col transition-transform duration-700 ease-in-out"
        style={{ transform: `translateY(-${currentSection * 100}vh)` }}
      >
        {resumeData.map((experience, index) => (
          <ExperienceSection 
            key={experience.id} 
            experience={experience} 
            index={index}
          />
        ))}
      </div>

      {/* Navigation */}
      <Navigation 
        currentSection={currentSection}
        totalSections={resumeData.length}
        onNavigate={handleNavigate}
      />

      {/* Header */}
      <div className="fixed top-8 left-8 z-40 bg-background/80 backdrop-blur-sm border rounded-lg px-6 py-3 shadow-lg">
        <h1 className="text-primary">Interactive Resume</h1>
        <p className="text-muted-foreground">Use up/down arrow keys or navigation to explore</p>
      </div>

      {/* Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-1 bg-muted z-50">
        <div 
          className="h-full bg-primary transition-all duration-700 ease-in-out"
          style={{ width: `${((currentSection + 1) / resumeData.length) * 100}%` }}
        />
      </div>
    </div>
  );
}