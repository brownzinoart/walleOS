import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle } from 'lucide-react';

interface DetailData {
  header: string;
  bullets: string[];
}

interface DetailCardProps {
  detail: DetailData;
}

export function DetailCard({ detail }: DetailCardProps) {
  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-all duration-200 border border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-primary">{detail.header}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {detail.bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground leading-relaxed">{bullet}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}