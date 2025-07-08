import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { 
  SignedIn, 
  SignedOut, 
  UserButton, 
  SignInButton, 
  SignUpButton,
  useUser
} from '@clerk/nextjs';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  host: string;
  tags: string[];
  image: string;
  attendees: number;
}

interface NewEvent {
  title: string;
  date: string;
  time: string;
  location: string;
  tags: string;
  description: string;
  image: string;
}

const mockEvents: Event[] = [
  {
    id: 1,
    title: "Rooftop Jazz Night",
    date: "Jul 15, 2025",
    time: "7:00 PM",
    location: "Downtown Loft, Brooklyn",
    host: "Sarah Chen",
    tags: ["Music", "Jazz", "Drinks"],
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
    attendees: 45
  },
  {
    id: 2,
    title: "Artisan Coffee & Conversation",
    date: "Jul 18, 2025",
    time: "10:00 AM",
    location: "Cozy Corner Café, Manhattan",
    host: "Mike Rodriguez",
    tags: ["Coffee", "Networking", "Casual"],
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop",
    attendees: 32
  },
  {
    id: 3,
    title: "Game Night Extravaganza",
    date: "Jul 20, 2025",
    time: "6:30 PM",
    location: "Community Center, Queens",
    host: "Alex Johnson",
    tags: ["Games", "Social", "Indoor"],
    image: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop",
    attendees: 28
  },
  {
    id: 4,
    title: "Sunset Yoga Session",
    date: "Jul 22, 2025",
    time: "5:30 PM",
    location: "Central Park, Manhattan",
    host: "Emma Wilson",
    tags: ["Wellness", "Outdoor", "Yoga"],
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop",
    attendees: 36
  },
  {
    id: 5,
    title: "Food Truck Festival",
    date: "Jul 25, 2025",
    time: "12:00 PM",
    location: "Pier 45, Brooklyn",
    host: "David Park",
    tags: ["Food", "Festival", "Outdoor"],
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop",
    attendees: 120
  },
  {
    id: 6,
    title: "Book Club & Wine",
    date: "Jul 28, 2025",
    time: "7:00 PM",
    location: "Literary Lounge, Manhattan",
    host: "Lisa Thompson",
    tags: ["Books", "Wine", "Discussion"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
    attendees: 24
  }
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const { isSignedIn, user } = useUser();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const initialEventImage = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop';
  
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: '',
    date: '',
    time: '',
    location: '',
    tags: '',
    description: '',
    image: initialEventImage
  });

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));
    
    // Click outside handler for modal
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsHostModalOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  }, [theme, mounted]);

  // Handle toast auto-dismiss
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const categories = ['all', ...new Set(mockEvents.flatMap(event => event.tags))];

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.tags.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleHostEvent = () => {
    if (!isSignedIn) {
      const signInButton = document.getElementById('sign-in-button');
      if (signInButton) signInButton.click();
      return;
    }
    setIsHostModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const validateForm = () => {
    if (!newEvent.title.trim()) return "Event title is required";
    if (!newEvent.date) return "Date is required";
    if (!newEvent.time) return "Time is required";
    if (!newEvent.location.trim()) return "Location is required";
    if (!newEvent.tags.trim()) return "Tags are required";
    if (!newEvent.description.trim()) return "Description is required";
    return null;
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('New event submitted:', newEvent);
      setIsSubmitting(false);
      setShowToast(true);
      setIsHostModalOpen(false);
      setNewEvent({
        title: '',
        date: '',
        time: '',
        location: '',
        tags: '',
        description: '',
        image: initialEventImage
      });
    }, 1500);
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
        : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900'
    }`}>
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fadeIn">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Event created successfully!
        </div>
      )}
      
      {/* Header */}
      <header className={`${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      } border-b sticky top-0 z-20 shadow-sm`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xl font-bold">OpenHaus</span>
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="#" className={`${
                theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              } font-medium`}>Discover</Link>
              <Link href="#" className={`${
                theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              } font-medium`}>My Events</Link>
              <Link href="#" className={`${
                theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              } font-medium`}>Messages</Link>
              <Link href="#" className={`${
                theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              } font-medium`}>Community</Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <button className={`hidden md:block ${
                theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              
              <SignInButton mode="modal">
                <button id="sign-in-button" className="hidden"></button>
              </SignInButton>
              
              <SignedOut>
                <div className="flex space-x-2">
                  <SignInButton mode="modal">
                    <button className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-200 hover:bg-gray-800' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}>
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
              
              <button 
                onClick={handleHostEvent}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Host Event
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className={`relative ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-purple-900 to-indigo-900' 
          : 'bg-gradient-to-r from-purple-600 to-indigo-700'
      } text-white`}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop')] bg-cover"></div>
        <div className="max-w-6xl mx-auto px-6 py-16 relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Discover Amazing Local Events
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Find and join unique gatherings happening near you - from cozy meetups to vibrant celebrations
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search events, locations, hosts..."
                className={`w-full pl-10 pr-4 py-3 ${
                  theme === 'dark' 
                    ? 'bg-white/20 text-white border-purple-300/30' 
                    : 'bg-white/20 text-gray-900 border-purple-300/30'
                } border rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder-purple-200 font-medium`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className={`px-4 py-3 ${
                theme === 'dark' 
                  ? 'bg-white/20 text-white border-purple-300/30' 
                  : 'bg-white/20 text-gray-900 border-purple-300/30'
              } border rounded-lg focus:ring-2 focus:ring-white focus:border-transparent font-medium`}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category} className="text-gray-900">
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-center gap-4">
            <button className={`${
              theme === 'dark' 
                ? 'bg-purple-800 hover:bg-purple-900 text-white' 
                : 'bg-white hover:bg-gray-100 text-purple-700'
            } px-5 py-2 rounded-lg font-medium transition-colors`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Nearby Events
            </button>
            <button className={`${
              theme === 'dark' 
                ? 'bg-purple-800 hover:bg-purple-900' 
                : 'bg-purple-800 hover:bg-purple-900'
            } text-white px-5 py-2 rounded-lg font-medium transition-colors`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Trending Now
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            {filteredEvents.length} Upcoming Events
          </h2>
          <div className="flex items-center space-x-4">
            <button className={`${
              theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
            } flex items-center`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Sort
            </button>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Link href={`/event/${event.id}`} key={event.id} className="group">
              <div className={`${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 hover:shadow-lg' 
                  : 'bg-white border-gray-100 hover:shadow-xl'
              } rounded-2xl overflow-hidden transition-all duration-300 border`}>
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={`absolute top-4 right-4 ${
                    theme === 'dark' 
                      ? 'bg-gray-900/80 text-gray-200' 
                      : 'bg-white/80 text-gray-800'
                  } backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium flex items-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {event.time}
                  </div>
                  <div className="absolute bottom-4 left-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-medium">
                    {event.date}
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className={`text-xl font-bold ${
                      theme === 'dark' 
                        ? 'text-white group-hover:text-purple-400' 
                        : 'text-gray-900 group-hover:text-purple-600'
                    } transition-colors`}>
                      {event.title}
                    </h2>
                  </div>
                  
                  <div className={`flex items-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  } mb-3`}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{event.location}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs ${
                          theme === 'dark' 
                            ? 'bg-purple-900/50 text-purple-300' 
                            : 'bg-purple-100 text-purple-800'
                        } px-2 py-1 rounded-full`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className={`flex items-center justify-between border-t ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
                  } pt-4`}>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">
                          {event.host.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>Hosted by</p>
                        <p className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{event.host}</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-sm">{event.attendees} attending</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No Results State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className={`${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gray-200 border-gray-300'
              } border-2 border-dashed rounded-xl w-48 h-48 mx-auto mb-6 flex items-center justify-center`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              } mb-2`}>No events found</h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              } mb-6`}>Try adjusting your search or filters to find what you're looking for</p>
              <button 
                onClick={handleHostEvent}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Host Your Own Event
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Host Event Modal */}
      {isHostModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className={`${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } rounded-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-95 animate-scaleIn`}
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
              <h2 className="text-2xl font-bold">Host a New Event</h2>
              <p className="text-purple-100">Create your own gathering and invite others to join</p>
            </div>
            
            <form onSubmit={handleSubmitEvent} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500 text-red-500 rounded-lg text-sm">
                  {formError}
                </div>
              )}
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`} htmlFor="title">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={`w-full px-4 py-3 border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' 
                      : 'border-gray-300 focus:border-purple-500'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors`}
                  placeholder="Name your event"
                  value={newEvent.title}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`} htmlFor="date">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className={`w-full px-4 py-3 border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' 
                        : 'border-gray-300 focus:border-purple-500'
                    } rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors`}
                    value={newEvent.date}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`} htmlFor="time">
                    Time *
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    className={`w-full px-4 py-3 border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' 
                        : 'border-gray-300 focus:border-purple-500'
                    } rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors`}
                    value={newEvent.time}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`} htmlFor="location">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  className={`w-full px-4 py-3 border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' 
                      : 'border-gray-300 focus:border-purple-500'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors`}
                  placeholder="Where is it happening?"
                  value={newEvent.location}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`} htmlFor="tags">
                  Tags (comma separated) *
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  className={`w-full px-4 py-3 border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' 
                      : 'border-gray-300 focus:border-purple-500'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors`}
                  placeholder="e.g., Music, Food, Networking"
                  value={newEvent.tags}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`} htmlFor="description">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className={`w-full px-4 py-3 border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500' 
                      : 'border-gray-300 focus:border-purple-500'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors`}
                  placeholder="Tell people about your event..."
                  value={newEvent.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsHostModalOpen(false);
                    setFormError(null);
                  }}
                  disabled={isSubmitting}
                  className={`px-5 py-2 font-medium rounded-lg transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center justify-center min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-800'
      } text-white py-12`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xl font-bold">OpenHaus</span>
              </div>
              <p className={`${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-300'
              } text-sm`}>
                Connecting people through unforgettable experiences and gatherings.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className={`${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'
                } transition-colors`}>About Us</a></li>
                <li><a href="#" className={`${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'
                } transition-colors`}>Careers</a></li>
                <li><a href="#" className={`${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'
                } transition-colors`}>Blog</a></li>
                <li><a href="#" className={`${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'
                } transition-colors`}>Press</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className={`${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'
                } transition-colors`}>Help Center</a></li>
                <li><a href="#" className={`${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'
                } transition-colors`}>Community</a></li>
                <li><a href="#" className={`${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'
                } transition-colors`}>Hosting Resources</a></li>
                <li><a href="#" className={`${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-300 hover:text-white'
                } transition-colors`}>Safety</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Stay Connected</h3>
              <p className={`${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-300'
              } mb-4`}>Subscribe to our newsletter for the latest updates</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className={`${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-600'
                  } text-white px-4 py-2 rounded-l-lg focus:outline-none w-full`}
                />
                <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-r-lg transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          <div className={`border-t ${
            theme === 'dark' ? 'border-gray-800' : 'border-gray-700'
          } mt-12 pt-8 text-center text-sm`}>
            © 2025 OpenHaus. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        option {
          color: #000;
        }
      `}</style>
    </div>
  );
}