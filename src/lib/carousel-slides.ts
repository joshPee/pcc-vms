import { Shield, FileText, CheckCircle, LogOut } from 'lucide-react';

export interface CarouselSlide {
  icon: React.ElementType;
  heading: string;
  text: string;
}

export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    icon: Shield,
    heading: 'Welcome to Pentecost Convention Centre',
    text: 'Quick, safe check-in for all visitors',
  },
  {
    icon: FileText,
    heading: 'What to have ready',
    text: 'Host name, phone number, purpose of visit, and ID if required',
  },
  {
    icon: CheckCircle,
    heading: 'How to fill the form',
    text: '1. Enter your details 2. Add visit information 3. Submit to get your code',
  },
  {
    icon: LogOut,
    heading: 'When you leave',
    text: 'Return to the security desk so a guard can check you out',
  },
];
