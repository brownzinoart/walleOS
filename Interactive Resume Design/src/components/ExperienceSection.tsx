import { MainExperienceCard } from './MainExperienceCard';
import { DetailCard } from './DetailCard';
import { ScrollArea } from './ui/scroll-area';

interface ExperienceData {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  brief: string;
  details: Array<{
    id: string;
    header: string;
    bullets: string[];
  }>;
}

interface ExperienceSectionProps {
  experience: ExperienceData;
  index: number;
}

export function ExperienceSection({ experience, index }: ExperienceSectionProps) {
  const isEven = index % 2 === 0;
  
  return (
    <section className="w-full h-screen flex items-center bg-background">
      <div className="w-full h-full flex">
        {/* Main Experience Card - 60% */}
        <div className={`${isEven ? 'order-1' : 'order-2'} w-[60%] flex items-center justify-center p-12`}>
          <MainExperienceCard experience={experience} />
        </div>
        
        {/* Detail Cards - 40% */}
        <div className={`${isEven ? 'order-2' : 'order-1'} w-[40%] flex items-center p-8`}>
          <ScrollArea className="w-full h-[80vh]">
            <div className="flex flex-col gap-6 pr-4">
              {experience.details.map((detail) => (
                <DetailCard key={detail.id} detail={detail} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </section>
  );
}