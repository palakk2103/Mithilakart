import React, { useState, useEffect } from 'react';
import { 
  Package, Upload, Plus, X, 
  Save, CheckCircle2, ChevronRight,
  Info, Image as ImageIcon, Layers,
  DollarSign, Tag, FileText, AlertCircle,
  Truck, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { productsApi, categoriesApi } from '../services/api';
import { extractList, mapCategory } from '../utils/mappers';

const AddProduct = () => {
  const [images, setImages] = useState([]);
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [categoriesRes, productsRes] = await Promise.all([
        categoriesApi.getAll(),
        productsApi.getAll({ limit: 10 }),
      ]);
      if (cancelled) return;
      if (!categoriesRes.error) {
        setCategories(extractList(categoriesRes.data).map(mapCategory));
      }
      if (!productsRes.error) {
        setProducts(extractList(productsRes.data));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleAddImage = () => {
    const url = prompt('Enter Image URL');
    if (url) setImages([...images, url]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-montserrat uppercase">Catalog Entry</h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-1 font-raleway">Add new inventory items directly to the platform catalog.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            Save as Draft
          </button>
          <button 
            onClick={handleSave}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${saved ? 'bg-green-500 text-white' : 'bg-blue-500 text-white shadow-blue-100 hover:scale-105'}`}
          >
            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saved ? 'Product Published!' : 'Publish to Catalog'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <FileText size={18} className="text-blue-500" />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-montserrat">Product Specification</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Product Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Premium Leather Satchel"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900 placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category *</label>
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900 appearance-none">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sub-Category</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bags & Backpacks"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Detailed Description</label>
                <textarea 
                  rows={6}
                  placeholder="Tell customers about the product features, materials, and unique selling points..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900 placeholder:text-slate-300 resize-none"
                />
              </div>
            </div>
          </section>

          {/* Pricing & Inventory */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <DollarSign size={18} className="text-green-500" />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-montserrat">Pricing & Stocks</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Selling Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900 placeholder:text-slate-300 font-roboto"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">MRP (Strike-off)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-400 placeholder:text-slate-300 font-roboto"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Initial Stock</label>
                  <input 
                    type="number" 
                    placeholder="1"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-black focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-900 placeholder:text-slate-300 font-roboto"
                  />
               </div>
            </div>
          </section>

          {/* Detailed Highlights & Specifications */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <Info size={18} className="text-indigo-500" />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-montserrat">Highlights & Specs</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Highlights */}
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Key Highlights</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Pack of</label>
                      <input type="text" placeholder="e.g. 1" className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Fabric</label>
                      <input type="text" placeholder="e.g. Cotton" className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Sleeve</label>
                      <input type="text" placeholder="e.g. Full Sleeve" className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Pattern</label>
                      <input type="text" placeholder="e.g. Solid" className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Collar</label>
                      <input type="text" placeholder="e.g. Spread" className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Color</label>
                      <input type="text" placeholder="e.g. Navy Blue" className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-xs font-bold outline-none" />
                    </div>
                  </div>
               </div>

               {/* Technical Specs */}
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Technical Specs</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Fit</label>
                      <input type="text" placeholder="e.g. Regular Fit" className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Fabric Care</label>
                      <input type="text" placeholder="e.g. Machine Wash" className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Suitable For</label>
                      <input type="text" placeholder="e.g. Western Wear" className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Hem</label>
                      <input type="text" placeholder="e.g. Curved" className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2.5 px-4 text-xs font-bold outline-none" />
                    </div>
                  </div>
               </div>
            </div>
          </section>

          {/* Variations Section */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2">
                  <Layers size={18} className="text-purple-500" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-montserrat">Variations (SKUs)</h3>
               </div>
               <button className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">+ Add Attribute</button>
            </div>
            
            <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300 gap-3">
               <Layers size={32} />
               <p className="text-[10px] font-black uppercase tracking-widest text-center">No variations defined.<br/>Add Size, Color or Material to create SKUs.</p>
            </div>
          </section>

          {/* Shipping & Logistics */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <Truck size={18} className="text-blue-500" />
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-montserrat">Shipping & Logistics</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Weight (kg)</label>
                  <input type="number" placeholder="0.5" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-black outline-none" />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Length (cm)</label>
                  <input type="number" placeholder="10" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-black outline-none" />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Width (cm)</label>
                  <input type="number" placeholder="10" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-black outline-none" />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Height (cm)</label>
                  <input type="number" placeholder="5" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-6 text-sm font-black outline-none" />
               </div>
            </div>
          </section>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
           {/* Product Flags */}
           <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <Tag size={18} className="text-blue-500" />
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-montserrat">Product Flags</h3>
              </div>
              <div className="space-y-3">
                 {[
                   { label: 'Featured Product', desc: 'Show on home page' },
                   { label: 'Trending Now', desc: 'Mark with fire icon' },
                   { label: 'Flash Sale Eligible', desc: 'Can be added to sales' },
                 ].map((flag, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                         <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{flag.label}</p>
                         <p className="text-[8px] text-slate-400 font-bold uppercase">{flag.desc}</p>
                      </div>
                      <div className="w-10 h-5 bg-slate-200 rounded-full relative cursor-pointer">
                         <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           {/* Tax & Compliance */}
           <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <ShieldCheck size={18} className="text-green-500" />
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-montserrat">Tax & Compliance</h3>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">GST Category</label>
                    <select className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none appearance-none">
                       <option>GST 18% (Standard)</option>
                       <option>GST 12%</option>
                       <option>GST 5%</option>
                       <option>GST 0% (Exempt)</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">HSN Code</label>
                    <input type="text" placeholder="e.g. 4202" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none" />
                 </div>
              </div>
           </section>

           {/* Image Gallery */}
           <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2">
                    <ImageIcon size={18} className="text-indigo-500" />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-montserrat">Visuals</h3>
                 </div>
                 <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{images.length}/5</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 {images.map((img, i) => (
                    <div key={i} className="relative aspect-square bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden group">
                       <img src={img} alt="Product" className="w-full h-full object-cover" />
                       <button 
                         onClick={() => handleRemoveImage(i)}
                         className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                       >
                          <X size={14} />
                       </button>
                    </div>
                 ))}
                 {images.length < 5 && (
                    <button 
                      onClick={handleAddImage}
                      className="aspect-square border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50/20 transition-all text-slate-300"
                    >
                       <Upload size={24} />
                       <span className="text-[8px] font-black uppercase tracking-widest">Add URL</span>
                    </button>
                 )}
              </div>
              <p className="text-[9px] text-slate-400 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                 Recommended size: <strong>1080x1080 px</strong>. High quality images increase conversion by up to <strong>40%</strong>.
              </p>
           </section>

           {/* Organization */}
           <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <Tag size={18} className="text-amber-500" />
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-montserrat">Organization</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Brand Name</label>
                  <input 
                    type="text" 
                    placeholder="Generic"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-50 transition-all outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Tags (Comma Separated)</label>
                  <input 
                    type="text" 
                    placeholder="new, trending, summer"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-50 transition-all outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Manufacturer Info</label>
                  <textarea 
                    rows={3}
                    placeholder="Manufacturer details, origin, etc."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-50 transition-all outline-none text-slate-900 resize-none"
                  />
                </div>
              </div>
           </section>

           {/* Status Card */}
           <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                 <Package size={100} />
              </div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                 <div className="mt-2 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <h4 className="text-lg font-black font-montserrat uppercase tracking-tight">Active Ready</h4>
                 </div>
                 <p className="text-[10px] opacity-60 mt-4 leading-relaxed font-medium italic">
                    "This product will be instantly visible across all platform storefronts upon publishing."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
