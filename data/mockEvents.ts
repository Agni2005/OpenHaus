export interface Event {
  id: string;
  title: string;
  date: string;
  tags: string[];
  host: string;
  location: string;
  image: string;
}

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Rooftop Jam Session 🎶',
    date: '2025-07-12',
    tags: ['Music', 'Chill', 'Outdoor'],
    host: 'Anika S',
    location: 'South City, Kolkata',
    image: 'https://source.unsplash.com/400x300/?party,night',
  },
  {
    id: '2',
    title: 'Indie Movie Night 🍿',
    date: '2025-07-13',
    tags: ['Movies', 'Indoor', 'Snacks'],
    host: 'Rohan B',
    location: 'Salt Lake, Kolkata',
    image: 'https://source.unsplash.com/400x300/?cinema,popcorn',
  },
  {
    id: '3',
    title: 'Board Game Hangout 🎲',
    date: '2025-07-14',
    tags: ['Games', 'Indoor', 'Chill'],
    host: 'Megha D',
    location: 'Ballygunge',
    image: 'https://source.unsplash.com/400x300/?boardgame,fun',
  },
];
