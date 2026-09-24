export interface CarouselSlide {
  image: string;
  heading: string;
  text: string;
}

export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    image: '/pccl1.jpg',
    heading: 'Welcome to Pentecost Convention Centre',
    text: 'Quick, safe check-in for all visitors',
  },
  {
    image: '/pcd2.jpg',
    heading: 'What to have ready',
    text: 'Host name, phone number, purpose of visit, and ID if required',
  },
  {
    image: '/pcd3.jpg',
    heading: 'How to fill the form',
    text: '1. Enter your details 2. Add visit information 3. Submit to get your code',
  },
  {
    image: '/pcd4.jpg',
    heading: 'When you leave',
    text: 'Return to the security desk so a guard can check you out',
  },
];
