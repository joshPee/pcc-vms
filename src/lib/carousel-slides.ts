export interface CarouselSlide {
  image: string;
  heading: string;
  text: string;
}

export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    heading: 'Welcome to Pentecost Convention Centre',
    text: 'Quick, safe check-in for all visitors',
  },
  {
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop',
    heading: 'What to have ready',
    text: 'Host name, phone number, purpose of visit, and ID if required',
  },
  {
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    heading: 'How to fill the form',
    text: '1. Enter your details 2. Add visit information 3. Submit to get your code',
  },
  {
    image: 'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&h=600&fit=crop',
    heading: 'When you leave',
    text: 'Return to the security desk so a guard can check you out',
  },
];
