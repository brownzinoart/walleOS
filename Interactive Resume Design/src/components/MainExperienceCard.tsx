import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Building, MapPin, Calendar } from 'lucide-react';

interface ExperienceData {
  title: string;
  company: string;
  location: string;
  duration: string;
  brief: string;
}

interface MainExperienceCardProps {
  experience: ExperienceData;
}

export function MainExperienceCard({ experience }: MainExperienceCardProps) {
  return (
    <Card className="w-full max-w-2xl h-[500px] shadow-2xl border-2 hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
      <CardContent className="p-8 h-full flex flex-col justify-center space-y-6">
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-primary">{experience.title}</h2>
            <div className="flex items-center gap-2 mb-3">
              <Building className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">{experience.company}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {experience.location}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {experience.duration}
            </Badge>
          </div>
        </div>
        
        <div className="flex-1 flex items-center">
          <p className="text-muted-foreground leading-relaxed">
            {experience.brief}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}