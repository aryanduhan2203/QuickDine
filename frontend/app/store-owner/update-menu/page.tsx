"use client";

import { useEffect, useState } from "react";
import StoreOwnerShell from "../../../components/store-owner/StoreOwnerShell";
import { Plus, Trash2, Edit3, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
};

export default function UpdateMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Main Course");
  const [newItemImage, setNewItemImage] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMenu() {
      setIsLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMenuItems(data);
      }
      setIsLoading(false);
    }
    loadMenu();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice.trim() || !userId || isSaving) return;

    setIsSaving(true);
    
    const parsedPrice = parseFloat(newItemPrice);

    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        user_id: userId,
        name: newItemName.trim(),
        price: parsedPrice,
        category: newItemCategory,
        image_url: newItemImage.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setMenuItems([data, ...menuItems]);
      setNewItemName("");
      setNewItemPrice("");
      setNewItemImage("");
    }
    
    setIsSaving(false);
  };

  const handleRemoveItem = async (id: string) => {
    if (!userId) return;
    
    // Optimistic update
    const previousItems = [...menuItems];
    setMenuItems(menuItems.filter(item => item.id !== id));
    
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
      
    if (error) {
      // Revert if error
      setMenuItems(previousItems);
    }
  };

  return (
    <StoreOwnerShell
      title="Update menu"
      description="Add new dishes, update prices, and organize your offerings."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        
        {/* Add New Item Form */}
        <div className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40 h-fit">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
              <Plus className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Add New Dish</h2>
          </div>
          
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Dish Name</label>
              <input
                type="text"
                placeholder="e.g. Spicy Chicken Burger"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/50 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                required
                disabled={isSaving || isLoading}
              />
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">Image URL (Optional)</label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={newItemImage}
                onChange={(e) => setNewItemImage(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/50 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                disabled={isSaving || isLoading}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/50 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                  required
                  disabled={isSaving || isLoading}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/50 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
                  disabled={isSaving || isLoading}
                >
                  <option value="Starters">Starters</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Breads">Breads</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Beverages">Beverages</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add to Menu"}
            </button>
          </form>
        </div>

        {/* Current Menu List */}
        <div className="rounded-[1.75rem] border border-slate-200/50 bg-white p-6 shadow-xl shadow-slate-200/40">
           <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-xl font-bold text-slate-900">Current Menu</h2>
            <div className="text-sm font-medium text-slate-500">{menuItems.length} items total</div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : menuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-slate-50 p-4 text-slate-400 mb-3">
                <Edit3 className="h-8 w-8" />
              </div>
              <p className="text-base font-semibold text-slate-900">Your menu is empty</p>
              <p className="text-sm text-slate-500 mt-1">Add your first dish using the form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {menuItems.map((item) => (
                <div key={item.id} className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-white hover:shadow-md">
                  <div className="flex items-center gap-4">
                    {item.image_url ? (
                      <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/50 shadow-sm">
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200/50 text-slate-400 shadow-sm">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {item.category}
                        </span>
                        <span className="text-sm font-medium text-slate-600">₹{Number(item.price).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100"
                    title="Remove item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </StoreOwnerShell>
  );
}
