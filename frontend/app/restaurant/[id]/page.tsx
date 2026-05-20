// frontend/app/restaurant/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { ArrowLeft, Clock3, MapPin, Star, Flame, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [store, setStore] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart state
  const [cartItems, setCartItems] = useState<any[]>([]);

  const handleAddToCart = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setCartItems(prev => [...prev, item]);
  };

  const handleRemoveFromCart = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const index = cartItems.findIndex(i => i.id === itemId);
    if (index !== -1) {
      const newCart = [...cartItems];
      newCart.splice(index, 1);
      setCartItems(newCart);
    }
  };

  const getItemCount = (itemId: string) => {
    return cartItems.filter(i => i.id === itemId).length;
  };

  useEffect(() => {
    async function fetchRestaurantData() {
      setIsLoading(true);

      // Fetch Store Profile
      const { data: storeData, error: storeError } = await supabase
        .from("store_profiles")
        .select("*")
        .eq("user_id", storeId)
        .single();

      if (!storeError && storeData) {
        setStore(storeData);
      }

      // Fetch Menu Items
      const { data: menuData, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("user_id", storeId);

      if (!menuError && menuData) {
        setMenuItems(menuData);
      }

      setIsLoading(false);
    }

    if (storeId) {
      fetchRestaurantData();
    }
  }, [storeId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="h-10 w-10 animate-spin text-[#EA580C]" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF7]">
        <h2 className="text-2xl font-bold text-slate-900">Restaurant not found</h2>
        <button onClick={() => router.back()} className="mt-4 text-[#EA580C] hover:underline">
          Go back
        </button>
      </div>
    );
  }

  // Group menu items by category
  const groupedMenu = menuItems.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.price), 0);

  return (
    <main className="min-h-screen bg-[#FDFBF7] font-sans pb-24">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-[#FFF2E5] hover:text-[#EA580C] transition shadow-sm border border-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-xl font-black tracking-tight text-slate-900">
            <span className="text-[#EA580C]">Quick</span>Dine
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </nav>

      {/* Hero Header */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-slate-200">
        <img 
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80" 
          alt={store.store_name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        <div className="absolute bottom-0 w-full">
          <div className="max-w-5xl mx-auto px-6 pb-8">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm">
                <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />
                4.8 Rating
              </div>
              <div className="rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm">
                <Clock3 className="h-3.5 w-3.5" />
                20-30 min
              </div>
              <div className="rounded-full bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm">
                <MapPin className="h-3.5 w-3.5" />
                {store.address ? store.address.split(',')[0] : "Local Store"}
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{store.store_name}</h1>
            <p className="mt-2 text-lg text-slate-200 font-medium">{store.tagline}</p>
            
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="max-w-5xl mx-auto px-6 mt-10 md:mt-12">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
          <h2 className="text-2xl font-black text-slate-900">Full Menu</h2>
        </div>

        {Object.keys(groupedMenu).length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-lg">This restaurant hasn't added any menu items yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.keys(groupedMenu).map((category) => (
              <div key={category}>
                <h3 className="text-2xl font-black text-slate-900 mb-6">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {groupedMenu[category].map((item: any) => (
                    <div key={item.id} className="group flex overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-all cursor-pointer p-5 gap-5 items-center">
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-bold text-lg text-slate-900 line-clamp-2 leading-tight">{item.name}</h4>
                        <span className="mt-2 text-xl font-black text-slate-900">₹{Number(item.price).toFixed(2)}</span>
                      </div>
                      
                      <div className="relative h-32 w-32 shrink-0 bg-slate-50 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <Flame className="h-8 w-8 opacity-20" />
                          </div>
                        )}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 group-hover:-translate-y-4 transition-transform duration-300 shadow-lg rounded-full bg-white border border-slate-100 flex items-center h-9 overflow-hidden">
                          {getItemCount(item.id) > 0 ? (
                            <div className="flex items-center justify-between w-[90px] px-1 bg-white">
                              <button 
                                onClick={(e) => handleRemoveFromCart(e, item.id)}
                                className="h-7 w-7 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 font-black text-lg transition-colors"
                              >
                                -
                              </button>
                              <span className="text-sm font-black text-[#EA580C]">{getItemCount(item.id)}</span>
                              <button 
                                onClick={(e) => handleAddToCart(e, item)}
                                className="h-7 w-7 flex items-center justify-center rounded-full text-[#EA580C] hover:bg-orange-50 font-black text-lg transition-colors"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => handleAddToCart(e, item)}
                              className="px-5 py-1.5 text-sm font-bold text-[#EA580C] hover:bg-[#EA580C] hover:text-white transition-colors rounded-full h-full min-w-[90px]"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Summary */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-lg z-50">
          <div className="bg-[#EA580C] rounded-2xl p-4 shadow-2xl flex items-center justify-between text-white shadow-orange-900/20">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-orange-200 uppercase tracking-wider">
                {cartItems.length} ITEM{cartItems.length > 1 ? 'S' : ''} ADDED
              </span>
              <span className="font-bold text-lg">Total: ₹{cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => {
                sessionStorage.setItem("quickdine_cart", JSON.stringify({ items: cartItems, store: store }));
                router.push("/checkout");
              }}
              className="bg-white text-[#EA580C] px-6 py-3 rounded-xl font-black text-sm hover:bg-orange-50 transition-colors shadow-sm active:scale-95"
            >
              View Cart
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
