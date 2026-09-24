export interface CarouselSlide {
  image: string;
  badge: string;
  heading: string;
  text: string;
}

export const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    image: '/pcd2.jpg',
    badge: '1',
    heading: 'Enter your details',
    text: 'Your name, phone number and ID, takes less than a minute.',
  },
  {
    image: '/pcd3.jpg',
    badge: '2',
    heading: 'Add visit information',
    text: 'Who you\'re here to see and the reason for your visit.',
  },
  {
    image: '/pcd4.jpg',
    badge: '3',
    heading: 'Get your code',
    text: 'Show it to security on your way out, no need to keep the paper safe, just don\'t lose it.',
  },
];
