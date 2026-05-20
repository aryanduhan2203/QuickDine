// frontend/app/search/page.tsx

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { Search, Store, ArrowRight, ArrowLeft, Star, Clock3, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    if (q) {
      performSearch(q);
    } else {
      setRestaurants([]);
      setIsLoading(false);
    }
  }, [searchParams]);

  const performSearch = async (searchStr: string) => {
    setIsLoading(true);
    
    const lowerQ = searchStr.toLowerCase();
    
    // 1. Fetch all visible store profiles
    const { data: storesData, error: storesError } = await supabase
      .from("store_profiles")
      .select("*")
      .eq("is_visible", true);

    if (storesError || !storesData) {
      setIsLoading(false);
      return;
    }

    // 2. Fetch menu items that match the search query (by name or category)
    const { data: menuData, error: menuError } = await supabase
      .from("menu_items")
      .select("user_id")
      .or(`name.ilike.%${searchStr}%,category.ilike.%${searchStr}%`);
      
    // Create a set of user_ids that have matching menu items
    const matchingMenuUserIds = new Set(
      (!menuError && menuData) ? menuData.map(item => item.user_id) : []
    );

    // 3. Filter stores: Include if store name matches, OR cuisine tag matches, OR one of their menu items matched
    const filteredStores = storesData.filter(s => 
      s.store_name?.toLowerCase().includes(lowerQ) || 
      (s.cuisine_tags && Array.isArray(s.cuisine_tags) && s.cuisine_tags.some((tag: string) => tag.toLowerCase().includes(lowerQ))) ||
      matchingMenuUserIds.has(s.user_id)
    );

    setRestaurants(filteredStores);
    setIsLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-[#FFF2E5] hover:text-[#EA580C] transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href="/" className="text-2xl font-black tracking-tight text-slate-900 hidden md:block">
              <span className="text-[#EA580C]">Quick</span>Dine
            </Link>
          </div>

          <form 
            onSubmit={handleSearchSubmit} 
            className="flex-1 max-w-2xl flex items-center bg-white p-2 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-200 transition-shadow focus-within:shadow-md focus-within:border-orange-200"
          >
            <div className="flex flex-1 items-center gap-3 px-4">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for cuisines or restaurants..."
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 font-medium"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[#EA580C] px-6 py-2.5 font-bold text-white transition hover:bg-orange-500 active:scale-95"
            >
              Search
            </button>
          </form>
        </div>
      </nav>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">
            {initialQuery ? `Search results for "${initialQuery}"` : "Discover Restaurants"}
          </h1>
          <p className="mt-2 text-slate-500 font-medium text-lg">
            {restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'} found matching your search.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-[#EA580C]" />
          </div>
        ) : restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 rounded-[2rem] border border-slate-200/50 bg-white shadow-sm">
            <div className="rounded-full bg-orange-50 p-6 text-orange-500 mb-6">
              <Store className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">No restaurants found</h3>
            <p className="mt-3 max-w-md text-slate-500 text-lg">
              We couldn't find any restaurants matching "{initialQuery}". Try searching for a different cuisine like "Pizza" or "North Indian".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((store) => (
              <Link 
                href={`/restaurant/${store.user_id}`}
                key={store.id} 
                className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/5 cursor-pointer"
              >
                {/* Store Cover Image Placeholder */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img 
                    src={`https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80`} 
                    alt={store.store_name} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Delivery time badge */}
                  <div className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-slate-900 flex items-center gap-1.5 shadow-sm">
                    <Clock3 className="h-3.5 w-3.5 text-[#EA580C]" />
                    20-30 min
                  </div>
                  
                  {/* Rating badge */}
                  <div className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-slate-900 flex items-center gap-1.5 shadow-sm">
                    <Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
                    4.5
                  </div>
                </div>

                {/* Store Info */}
                <div className="flex flex-col flex-1 p-6">
                  <h3 className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-[#EA580C] transition-colors">
                    {store.store_name}
                  </h3>
                  
                  <p className="mt-1.5 text-sm text-slate-500 font-medium line-clamp-1">
                    {store.tagline || "Delicious food delivered fast."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {store.cuisine_tags && Array.isArray(store.cuisine_tags) && store.cuisine_tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="rounded-md bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-100">
                        {tag}
                      </span>
                    ))}
                    {store.cuisine_tags && store.cuisine_tags.length > 3 && (
                      <span className="rounded-md bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-100">
                        +{store.cuisine_tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {store.address ? store.address.split(',')[0] : "Local Store"}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#EA580C]">
                      View Menu <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default function SearchResultsPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] font-sans">
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#EA580C]" /></div>}>
        <SearchResults />
      </Suspense>
    </main>
  );
}
