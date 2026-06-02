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
  { name: "Local Dishes", emoji: "🥘", image: "https://images.unsplash.com/photo-1546069901-ba6e2202cb1c?auto=format&fit=crop&w=300&q=80" },
  { name: "Healthy", emoji: "🥗", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80" },
  { name: "Pizza", emoji: "🍕", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=300&q=80" },
  { name: "Desserts", emoji: "🍰", image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=300&q=80" },
  { name: "Chinese", emoji: "🥢", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=300&q=80" },
  { name: "Beverages", emoji: "🥤", image: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=300&q=80" },
  { name: "Biryani", emoji: "🍛", image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=300&q=80" },
  { name: "Sushi", emoji: "🍣", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80" }
];

const categoryStyles: Record<string, { gradient: string; hoverShadow: string; borderGlow: string }> = {
  "Fast Food": {
    gradient: "from-orange-50 to-orange-100/60",
    hoverShadow: "hover:shadow-[0_8px_20px_rgba(232,68,10,0.12)]",
    borderGlow: "border-orange-200/50"
  },
  "Healthy": {
    gradient: "from-emerald-50 to-emerald-100/60",
    hoverShadow: "hover:shadow-[0_8px_20px_rgba(16,185,129,0.12)]",
    borderGlow: "border-emerald-200/50"
  },
  "Desserts": {
    gradient: "from-amber-50 to-amber-100/60",
    hoverShadow: "hover:shadow-[0_8px_20px_rgba(245,158,11,0.12)]",
    borderGlow: "border-amber-200/50"
  },
  "Pizza": {
    gradient: "from-red-50 to-red-100/60",
    hoverShadow: "hover:shadow-[0_8px_20px_rgba(239,68,68,0.12)]",
    borderGlow: "border-red-200/50"
  },
  "Local Dishes": {
    gradient: "from-rose-50 to-rose-100/60",
    hoverShadow: "hover:shadow-[0_8px_20px_rgba(244,63,94,0.12)]",
    borderGlow: "border-rose-200/50"
  },
  "Chinese": {
    gradient: "from-red-50 to-red-100/60",
    hoverShadow: "hover:shadow-[0_8px_20px_rgba(239,68,68,0.12)]",
    borderGlow: "border-red-200/50"
  },
  "Beverages": {
    gradient: "from-blue-50 to-blue-100/60",
    hoverShadow: "hover:shadow-[0_8px_20px_rgba(59,130,246,0.12)]",
    borderGlow: "border-blue-200/50"
  },
  "Biryani": {
    gradient: "from-yellow-50 to-yellow-100/60",
    hoverShadow: "hover:shadow-[0_8px_20px_rgba(234,179,8,0.12)]",
    borderGlow: "border-yellow-200/50"
  },
  "Sushi": {
    gradient: "from-indigo-50 to-indigo-100/60",
    hoverShadow: "hover:shadow-[0_8px_20px_rgba(99,102,241,0.12)]",
    borderGlow: "border-indigo-200/50"
  }
};

export default function RestaurantSearch() {
  const [location, setLocation] = useState("");
  const [feedItems, setFeedItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const handleCategoryClick = (catName: string) => {
    if (selectedCategory === catName) {
      setSelectedCategory(null);
      loadFeed("");
    } else {
      setSelectedCategory(catName);
      loadFeed(catName);
    }
  };

  const getSpecialBadge = (index: number) => {
    if (index % 5 === 0) return { text: "🔥 Trending", bg: "bg-orange-600 text-white" };
    if (index % 5 === 2) return { text: "⭐ Bestseller", bg: "bg-amber-500 text-white" };
    return null;
  };

  return (
    <div className="w-full warm-noise-bg min-h-screen bg-[#FFF8F3]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-24 bg-[linear-gradient(to_right,_#FFF8F3_45%,_#8B0000_65%)]">
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Text & Search */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF2E5] px-4 py-2 text-sm font-bold text-[#E8440A]">
                <Flame className="h-4 w-4" fill="currentColor" />
                Fast Delivery • Best Prices
              </div>
              
              <h1 className="mt-6 text-6xl font-black text-slate-900 leading-[1.1] tracking-tight md:text-7xl">
                Delicious Food,<br />
                Delivered <span className="bg-gradient-to-r from-[#E8440A] to-[#FF6B35] bg-clip-text text-transparent">Fast</span>
              </h1>
              
              <p className="mt-6 text-lg text-slate-500 font-medium">
                Order from your favorite restaurants near you
              </p>

              <form 
                onSubmit={handleSearch} 
                className="mt-10 flex items-center bg-white p-2.5 rounded-full shadow-[0_10px_30px_rgba(232,68,10,0.08)] border border-orange-200/60 max-w-lg transition-all duration-300 focus-within:shadow-[0_12px_35px_rgba(232,68,10,0.15)] focus-within:border-orange-300"
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
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E8440A] px-8 py-4 font-bold text-white transition duration-300 hover:bg-orange-600 active:scale-95"
                >
                  Find Food
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Right Column: Hero Image */}
            <div className="relative hidden lg:block h-[500px] bg-transparent border-none shadow-none rounded-none overflow-visible w-[115%] -right-10">
              {/* The Burger Image - sits directly on the red background with no container visible */}
              <img 
                src="/hero_burger_splash_1779796805313.png" 
                alt="Explosive Delicious Burger"
                className="w-full h-full object-cover block transition-transform duration-700 hover:scale-102 bg-transparent border-none rounded-none shadow-none mix-blend-screen"
                style={{
                  WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 50%, transparent 85%)",
                  maskImage: "radial-gradient(circle at 50% 50%, black 50%, transparent 85%)"
                }}
              />

              {/* Floating Badges with Glassmorphism and Bounce Entrance */}
              <div className="absolute top-10 right-10 z-20 flex items-center gap-3 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg shadow-orange-900/10 border border-white/50 animate-bounce-in" style={{ animationDelay: '0.1s' }}>
                <div className="rounded-xl bg-orange-100 p-2 text-[#E8440A]">
                  <Bike className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">25 mins</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivery Time</div>
                </div>
              </div>

              <div className="absolute bottom-20 -left-10 z-20 flex items-center gap-3 bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg shadow-orange-900/10 border border-white/50 animate-bounce-in" style={{ animationDelay: '0.2s' }}>
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
      <section className="py-12 bg-[#FFF8F3] border-y border-[#FFF0E8]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900">Explore Categories</h2>
            <button className="flex items-center gap-2 text-sm font-bold text-[#E8440A] hover:text-orange-600 transition">
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 relative">
            <button className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md border border-slate-100 text-slate-600 hover:text-orange-600 absolute -left-6 z-10">
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex w-full gap-5 overflow-x-auto pb-4 pt-2 snap-x hide-scrollbar">
              {categories.map((cat) => {
                const style = categoryStyles[cat.name] || {
                  gradient: "from-slate-50 to-slate-100/60",
                  hoverShadow: "hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]",
                  borderGlow: "border-slate-200/50"
                };
                const isSelected = selectedCategory === cat.name;

                return (
                  <div 
                    key={cat.name} 
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`group relative flex min-w-[150px] cursor-pointer snap-start flex-col items-center justify-center gap-4 rounded-3xl bg-gradient-to-br p-6 shadow-sm border transition-all duration-300 hover:-translate-y-2 ${style.gradient} ${style.hoverShadow} ${isSelected ? 'border-[#E8440A] border-2 shadow-md' : style.borderGlow}`}
                  >
                    <div className="h-16 w-16 overflow-hidden rounded-2xl shadow-sm bg-white/80 border-2 border-white">
                      <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <span className="text-sm font-extrabold text-slate-800 group-hover:text-slate-950 transition-colors">{cat.name}</span>
                    {isSelected && (
                      <div className="absolute top-4 right-4 h-2 w-2 bg-[#E8440A] rounded-full shadow-[0_0_8px_rgba(232,68,10,0.6)]" />
                    )}
                  </div>
                );
              })}
            </div>

            <button className="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md border border-slate-100 text-slate-600 hover:text-orange-600 absolute -right-6 z-10">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Discovery Feed Section */}
      <section className="py-16 bg-[linear-gradient(to_bottom,_#FFF0E8_0%,_#FFF8F3_80%)]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Popular Near You
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-[#E8440A]" />
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
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {feedItems.map((item, index) => {
                const badge = getSpecialBadge(index);
                return (
                  <Link 
                    href={`/restaurant/${item.user_id}`}
                    key={item.id} 
                    className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-100/50 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(232,68,10,0.10)] cursor-pointer"
                  >
                    {/* Image Section */}
                    <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <ImageIcon className="h-12 w-12" />
                        </div>
                      )}
                      
                      {/* Dark Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10" />

                      {/* Floating Rating Chip top right */}
                      <div className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1 z-20">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span>4.7</span>
                      </div>

                      {/* Special badges (Bestseller/Trending) */}
                      {badge && (
                        <div className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm z-20 ${badge.bg}`}>
                          {badge.text}
                        </div>
                      )}

                      {/* Name, price & add pill inside the image overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex flex-col justify-end text-white">
                        <h3 className="font-extrabold text-md sm:text-lg tracking-tight line-clamp-1 capitalize">
                          {item.name}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-black text-md text-[#FF6B35]">
                            ₹{Number(item.price).toFixed(2)}
                          </span>
                          <div className="rounded-full border border-white/60 bg-white/10 hover:bg-[#E8440A] hover:border-[#E8440A] px-3.5 py-1 text-xs font-extrabold text-white transition-all duration-300">
                            Add +
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Section below the image */}
                    <div className="flex items-center justify-between p-4 bg-white">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Store className="h-3.5 w-3.5 text-[#E8440A]" />
                        <span className="line-clamp-1 font-bold text-slate-650">
                          {item.store_name}
                        </span>
                      </div>
                      <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#E8440A] tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </Link>
                );
              })}
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

