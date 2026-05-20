// frontend/components/RestaurantSearch.tsx

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, LocateFixed, Image as ImageIcon, Loader2, Store, MapPin, Star, Flame, Bike, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";

type FoodItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  user_id: string;
  store_name?: string;
};

const categories = [
  { name: "Fast Food", emoji: "🍔", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80" },
  { name: "Local Dishes", emoji: "🥘", image: "https://images.unsplash.com/photo-1606850239088-3486c8d45127?auto=format&fit=crop&w=300&q=80" },
  { name: "Healthy", emoji: "🥗", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80" },
  { name: "Pizza", emoji: "🍕", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=300&q=80" },
  { name: "Desserts", emoji: "🍰", image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=300&q=80" },
];

export default function RestaurantSearch() {
  const [location, setLocation] = useState("");
  const [feedItems, setFeedItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // We extract loadFeed so it can take a query
  const loadFeed = async (query: string = "") => {
    setIsLoading(true);
    
    try {
      let matchingUserIds: string[] = [];
      
      // If there's a query, first find any stores that match by name or cuisine tags
      if (query) {
        const { data: stores } = await supabase
          .from("store_profiles")
          .select("user_id, store_name, cuisine_tags");
          
        if (stores) {
          const lowerQuery = query.toLowerCase();
          matchingUserIds = stores.filter(s => 
            s.store_name?.toLowerCase().includes(lowerQuery) || 
            (s.cuisine_tags && Array.isArray(s.cuisine_tags) && s.cuisine_tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
          ).map(s => s.user_id);
        }
      }

      // Build the menu items query
      let menuQuery = supabase
        .from("menu_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);

      // Apply search filters if needed
      if (query) {
        let orString = `name.ilike.%${query}%,category.ilike.%${query}%`;
        if (matchingUserIds.length > 0) {
          orString += `,user_id.in.(${matchingUserIds.join(',')})`;
        }
        menuQuery = menuQuery.or(orString);
      }

      const { data: menuData, error: menuError } = await menuQuery;

      if (!menuError && menuData && menuData.length > 0) {
        // Collect unique user_ids to find the store names
        const userIds = Array.from(new Set(menuData.map((item) => item.user_id)));
        
        // Fetch corresponding store profiles
        const { data: storeData } = await supabase
          .from("store_profiles")
          .select("user_id, store_name")
          .in("user_id", userIds);

        // Map user_id to store_name
        const storeMap = new Map();
        if (storeData) {
          storeData.forEach(store => {
            storeMap.set(store.user_id, store.store_name);
          });
        }

        // Attach store names to the items
        const formattedFeed = menuData.map(item => ({
          ...item,
          store_name: storeMap.get(item.user_id) || "Local Restaurant"
        }));

        setFeedItems(formattedFeed);
      } else {
        setFeedItems([]);
      }
    } catch (err) {
      console.error("Error loading feed:", err);
      setFeedItems([]);
    }
    
    setIsLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadFeed("");
  }, []);

  const router = useRouter();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!location.trim()) return;
    router.push(`/search?q=${encodeURIComponent(location.trim())}`);
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24">
        {/* Decorative Background Blob */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FFF2E5] rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Text & Search */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF2E5] px-4 py-2 text-sm font-bold text-[#EA580C]">
                <Flame className="h-4 w-4" fill="currentColor" />
                Fast Delivery • Best Prices
              </div>
              
              <h1 className="mt-6 text-6xl font-black text-slate-900 leading-[1.1] tracking-tight md:text-7xl">
                Delicious Food,<br />
                Delivered <span className="text-[#EA580C]">Fast</span>
              </h1>
              
              <p className="mt-6 text-lg text-slate-500 font-medium">
                Order from your favorite restaurants near you
              </p>

              {/* Search Bar */}
              <form 
                onSubmit={handleSearch} 
                className="mt-10 flex items-center bg-white p-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 max-w-lg transition-shadow focus-within:shadow-[0_8px_30px_rgba(234,88,12,0.15)] focus-within:border-orange-200"
              >
                <div className="flex flex-1 items-center gap-3 px-4">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Search for dishes, cuisines, or restaurants..."
                    className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#EA580C] px-8 py-4 font-bold text-white transition hover:bg-orange-500 active:scale-95"
                >
                  Find Food
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>


            </div>

            {/* Right Column: Hero Image */}
            <div className="relative hidden lg:block">
              {/* Background solid circle for the image */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FFF2E5] rounded-full" />
              
              {/* The Burger Image */}
              <div className="relative z-10 transform hover:scale-105 transition-transform duration-700">
                <img 
                  src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80" 
                  alt="Delicious Burger"
                  className="w-[600px] h-[500px] object-cover rounded-[3rem] mix-blend-multiply"
                />
              </div>

              {/* Floating Badges */}
              <div className="absolute top-10 right-10 z-20 flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl shadow-orange-900/10 border border-white animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="rounded-xl bg-orange-100 p-2 text-orange-600">
                  <Bike className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">25 mins</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery Time</div>
                </div>
              </div>

              <div className="absolute bottom-20 -left-10 z-20 flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl shadow-orange-900/10 border border-white animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="rounded-xl bg-amber-100 p-2 text-amber-500">
                  <Star className="h-6 w-6" fill="currentColor" />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">4.7</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Rating</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Explore Categories */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900">Explore Categories</h2>
            <button className="flex items-center gap-2 text-sm font-bold text-[#EA580C] hover:text-orange-500">
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 relative">
            <button className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md border border-slate-100 text-slate-600 hover:text-orange-500 absolute -left-6 z-10">
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex w-full gap-4 overflow-x-auto pb-4 pt-2 snap-x hide-scrollbar">
              {categories.map((cat, i) => (
                <div 
                  key={cat.name} 
                  className={`group relative flex min-w-[140px] cursor-pointer snap-start flex-col items-center justify-center gap-3 rounded-[1.5rem] bg-white p-4 shadow-sm border transition-all hover:-translate-y-1 hover:shadow-lg ${i === 0 ? 'border-orange-200 bg-[#FFF9F5]' : 'border-slate-100'}`}
                >
                  <div className="h-16 w-16 overflow-hidden rounded-full shadow-inner bg-slate-100 border-2 border-white">
                    <img src={cat.image} alt={cat.name} className="h-full w-full object-cover mix-blend-multiply" />
                  </div>
                  <span className={`text-sm font-bold ${i === 0 ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{cat.name}</span>
                </div>
              ))}
            </div>

            <button className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md border border-slate-100 text-slate-600 hover:text-orange-500 absolute -right-6 z-10">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Discovery Feed Section */}
      <section className="py-16 bg-[#FDFBF7]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Popular Near You
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-[#EA580C]" />
            </div>
          ) : feedItems.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center text-center py-16 rounded-[2rem] border border-slate-200/50 bg-white">
              <div className="rounded-full bg-orange-50 p-4 text-orange-500 mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No dishes found</h3>
              <p className="mt-2 max-w-md text-slate-500">
                There are no menu items available yet. Once store owners add dishes, they will appear here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {feedItems.map((item) => (
                <Link 
                  href={`/restaurant/${item.user_id}`}
                  key={item.id} 
                  className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/5 cursor-pointer"
                >
                  {/* Image Section */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ImageIcon className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-orange-600 shadow-sm backdrop-blur-md">
                      {item.category}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg text-slate-900 line-clamp-1">
                        {item.name}
                      </h3>
                      <span className="font-black text-slate-900 shrink-0">
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Store className="h-4 w-4 text-orange-500" />
                        <span className="line-clamp-1">
                          {item.store_name}
                        </span>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600 group-hover:bg-[#EA580C] group-hover:text-white transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Global styles for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
