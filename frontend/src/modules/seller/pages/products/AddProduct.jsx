/**
 * Add/Edit Product Page
 * Multi-section form with image upload, specifications, and SEO fields.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Eye, FileText, Package, DollarSign, Image, Settings, Globe } from 'lucide-react';
import { PageHeader } from '../../components/common';
import { ImageUploader } from '../../components/common';
import { Button } from '../../components/ui';
import { getProduct, createProduct, updateProduct, createProductListing } from '../../services/sellerApi';
import { customerApi } from '../../../../shared/api/client';
import toast from 'react-hot-toast';

const MARKETPLACE_TAB_OPTIONS = [
  { key: 'mithilakart', label: 'Mithilakart', legacyFlow: 'standard' },
  { key: 'mithilak', label: 'Mithilak', legacyFlow: 'mithilak' },
  { key: 'quick_shop', label: 'Quick Shop', legacyFlow: 'quick_shop' },
  { key: 'groceries_fresh', label: 'Groceries & Fresh', legacyFlow: 'fresh_grocery' },
];
const QUICK_TAB_KEYS = new Set(['quick_shop', 'groceries_fresh']);

const DELIVERY_MODE_FLOWS = {
  quick_commerce: ['quick_shop', 'fresh_grocery'],
  ecommerce: ['standard', 'mithilak'],
  both: ['quick_shop', 'fresh_grocery', 'standard', 'mithilak'],
};

const tabsToCommerceFlows = (tabs = []) => {
  const flows = tabs
    .map((tab) => MARKETPLACE_TAB_OPTIONS.find((o) => o.key === tab)?.legacyFlow)
    .filter(Boolean);
  return flows.length ? [...new Set(flows)] : ['standard'];
};

const commerceFlowsToTabs = (flows = []) => {
  const set = new Set(flows);
  const tabs = MARKETPLACE_TAB_OPTIONS
    .filter((o) => set.has(o.legacyFlow))
    .map((o) => o.key);
  return tabs.length ? tabs : ['mithilakart'];
};

const inferDeliveryMode = (flows = []) => {
  const set = new Set(flows);
  const hasQuick = DELIVERY_MODE_FLOWS.quick_commerce.some((flow) => set.has(flow));
  const hasEcom = DELIVERY_MODE_FLOWS.ecommerce.some((flow) => set.has(flow));
  if (hasQuick && hasEcom) return 'both';
  if (hasQuick) return 'quick_commerce';
  return 'ecommerce';
};

const mapProductToForm = (product) => ({
  title: product?.title || '',
  shortDescription: product?.shortDescription || '',
  description: product?.description || '',
  categoryId: product?.categoryId ? String(product.categoryId) : '',
  subcategoryId: '',
  brand: product?.brand || '',
  sku: product?.sku || '',
  price: product?.price ?? '',
  mrp: product?.mrp ?? product?.price ?? '',
  discountPrice: product?.discountPrice ?? '',
  gst: product?.gst ?? '',
  stock: product?.stock ?? '',
  weight: product?.weight ?? '',
  dimensions: product?.dimensions ? `${product.dimensions.length}x${product.dimensions.width}x${product.dimensions.height}` : '',
  tags: Array.isArray(product?.tags) ? product.tags.join(', ') : product?.tags || '',
  warranty: product?.warranty || '',
  returnPolicy: product?.returnPolicy || '',
  shippingInfo: product?.shippingInfo || '',
  seoTitle: product?.seo?.title || product?.seoTitle || '',
  seoDescription: product?.seo?.description || product?.seoDescription || '',
  highlights: Array.isArray(product?.highlights) ? product.highlights.join('\n') : product?.highlights || '',
  serviceableRadius: product?.attributes?.serviceableRadius ?? '',
  deliveryEstimate: product?.attributes?.deliveryEstimate ?? '',
});

const AddProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [activeSection, setActiveSection] = useState('basic');
  const [images, setImages] = useState([]);
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [existingProduct, setExistingProduct] = useState(null);

  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({
    defaultValues: mapProductToForm(null),
  });

  const [deliveryMode, setDeliveryMode] = useState('ecommerce');
  const [commerceFlow, setCommerceFlow] = useState('standard');
  const [selectedTabs, setSelectedTabs] = useState(['mithilakart']);
  const [quickDeliveryMinutes, setQuickDeliveryMinutes] = useState(20);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const selectedCategoryId = watch('categoryId');
  const selectedRootCategory = categoriesTree.find((c) => String(c.id || c._id) === String(selectedCategoryId));

  // Fetch category tree based on the selected commerce flow.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setCategoriesLoading(true);
        let data = await customerApi.get('/categories', {
          params: { commerceFlow },
        });
        if (!Array.isArray(data) || data.length === 0) {
          data = await customerApi.get('/categories');
        }
        if (!cancelled) setCategoriesTree(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCategoriesTree([]);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [commerceFlow]);

  useEffect(() => {
    if (!isEdit) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const product = await getProduct(id);
        setExistingProduct(product);
        reset(mapProductToForm(product));
        setCommerceFlow(product?.commerceFlows?.[0] || 'standard');
        setDeliveryMode(inferDeliveryMode(product?.commerceFlows));
        setSelectedTabs(commerceFlowsToTabs(product?.commerceFlows));
        setSpecifications(product?.specifications?.length ? product.specifications : [{ key: '', value: '' }]);
        if (product?.images?.length) {
          setImages(product.images.map((img, index) => ({
            id: `existing_${index}`,
            preview: img.url,
            url: img.url,
            name: img.alt || `Image ${index + 1}`,
          })));
        } else if (product?.gallery?.length) {
          setImages(product.gallery);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, isEdit, reset]);

  // If the product's categoryId is a child node, select the correct root + subcategory ids.
  useEffect(() => {
    if (!isEdit || !existingProduct || !categoriesTree.length) return;
    const targetId = existingProduct?.categoryId ? String(existingProduct.categoryId) : '';
    if (!targetId) return;

    // Case 1: target is root.
    const rootMatch = categoriesTree.find((c) => String(c.id || c._id) === targetId);
    if (rootMatch) {
      setValue('categoryId', String(rootMatch.id || rootMatch._id));
      setValue('subcategoryId', '');
      return;
    }

    // Case 2: target is a child.
    for (const root of categoriesTree) {
      const child = (root.children || []).find((ch) => String(ch.id || ch._id) === targetId);
      if (child) {
        setValue('categoryId', String(root.id || root._id));
        setValue('subcategoryId', String(child.id || child._id));
        return;
      }
    }

    // Fallback: keep it as categoryId.
    setValue('categoryId', targetId);
    setValue('subcategoryId', '');
  }, [categoriesTree, existingProduct, isEdit, setValue]);

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'pricing', label: 'Pricing & Stock', icon: DollarSign },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'specs', label: 'Specifications', icon: Settings },
    { id: 'seo', label: 'SEO & Shipping', icon: Globe },
  ];

  const buildPayload = (data, status = 'active') => {
    const dims = data.dimensions?.split('x').map(Number) || [];

    const categoryIdEffective = data.subcategoryId || data.categoryId;
    const tagsArr = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const specificationsArr = specifications.filter((s) => s.key && s.value);
    const price = Number(data.price);
    const mrp = Number(data.mrp || data.price);
    const commerceFlows = tabsToCommerceFlows(selectedTabs);

    const attributes = {
      ...(specificationsArr.length ? Object.fromEntries(specificationsArr.map((s) => [s.key, s.value])) : {}),
    };
    if (selectedTabs.some((t) => QUICK_TAB_KEYS.has(t)) && data.serviceableRadius) {
      attributes.serviceableRadius = Number(data.serviceableRadius);
    }
    if (!selectedTabs.every((t) => QUICK_TAB_KEYS.has(t))) {
      if (data.weight) attributes.weight = Number(data.weight);
      if (dims.length === 3) {
        attributes.dimensions = { length: dims[0], width: dims[1], height: dims[2] };
      }
      if (data.deliveryEstimate) attributes.deliveryEstimate = data.deliveryEstimate;
    }

    const imagePayload = images
      .map((img, index) => {
        const url = img.url || img.preview;
        if (!url) return null;
        return { url, alt: img.name || data.title || '', sortOrder: index };
      })
      .filter(Boolean);

    return {
      title: data.title,
      description: data.description || '',
      sku: data.sku?.trim() || `SKU-${Date.now().toString(36).toUpperCase()}`,
      categoryId: categoryIdEffective,
      brand: data.brand || '',
      price,
      mrp,
      stock: Number(data.stock),
      tags: tagsArr,
      images: imagePayload,
      attributes,
      commerceFlows,
      status,
    };
  };

  const onSubmit = async (data) => {
    try {
      const payload = buildPayload(data, 'approved');
      if (isEdit) {
        await updateProduct(id, payload);
        toast.success('Product updated successfully!');
      } else {
        const created = await createProduct(payload);
        const productId = created?.id || created?._id;
        if (productId && selectedTabs.length) {
          for (const tab of selectedTabs) {
            try {
              const listing = await createProductListing(productId, {
                marketplaceTab: tab,
                price: Number(data.price),
                mrp: Number(data.mrp || data.price),
                ...(QUICK_TAB_KEYS.has(tab) ? { deliveryPromiseMinutes: Number(quickDeliveryMinutes) } : {}),
              });
              const listingId = listing?.id || listing?._id;
              if (listingId) {
                await publishProductListing(listingId).catch(() => {});
              }
            } catch (err) {
              console.warn(`Failed to create/publish listing for tab ${tab}:`, err);
            }
          }
        }
        toast.success('Product added successfully!');
      }
      navigate('/seller/products');
    } catch (err) {
      toast.error(err?.message || 'Failed to save product');
    }
  };

  const onSaveDraft = async () => {
    const data = watch();
    try {
      const payload = buildPayload(data, 'pending');
      if (isEdit) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      toast.success('Saved as draft');
      navigate('/seller/products');
    } catch (err) {
      toast.error(err?.message || 'Failed to save draft');
    }
  };

  const inputClass = "w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title={isEdit ? 'Edit Product' : 'Add New Product'} subtitle={isEdit ? `Editing: ${existingProduct?.title || ''}` : 'Fill in the product details'}>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/seller/products')}>Back</Button>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Section Navigation */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-2 sticky top-24">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === section.id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <section.icon size={16} />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            {activeSection === 'basic' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <h3 className="text-base font-semibold text-gray-900">Basic Information</h3>

                <div>
                  <label className={labelClass}>Product Title *</label>
                  <input {...register('title', { required: 'Title is required' })} placeholder="Enter product title" className={inputClass} />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Short Description</label>
                  <input {...register('shortDescription')} placeholder="Brief description (one liner)" className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Full Description *</label>
                  <textarea {...register('description', { required: 'Description is required' })} rows={5} placeholder="Detailed product description" className={inputClass} />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Marketplace tabs *</label>
                  <div className="flex flex-wrap gap-2">
                    {MARKETPLACE_TAB_OPTIONS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setSelectedTabs((prev) => {
                            const exists = prev.includes(tab.key);
                            const next = exists ? prev.filter((t) => t !== tab.key) : [...prev, tab.key];
                            const flows = tabsToCommerceFlows(next.length ? next : ['mithilakart']);
                            setCommerceFlow(flows[0]);
                            setDeliveryMode(inferDeliveryMode(flows));
                            return next.length ? next : ['mithilakart'];
                          });
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          selectedTabs.includes(tab.key)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedTabs.some((t) => QUICK_TAB_KEYS.has(t)) && (
                  <div>
                    <label className={labelClass}>Quick delivery promise (minutes)</label>
                    <select
                      value={quickDeliveryMinutes}
                      onChange={(e) => setQuickDeliveryMinutes(Number(e.target.value))}
                      className={inputClass}
                    >
                      {[15, 20, 25, 30].map((m) => (
                        <option key={m} value={m}>{m} minutes</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Category *</label>
                    <select
                      {...register('categoryId', { required: 'Category is required' })}
                      className={inputClass}
                      disabled={categoriesLoading}
                    >
                      <option value="">{categoriesLoading ? 'Loading...' : 'Select category'}</option>
                      {(categoriesTree || []).map((c) => (
                        <option key={c.id || c._id} value={String(c.id || c._id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Subcategory</label>
                    <select
                      {...register('subcategoryId')}
                      className={inputClass}
                      disabled={categoriesLoading || !selectedRootCategory?.children?.length}
                    >
                      <option value="">Use category</option>
                      {(selectedRootCategory?.children || []).map((s) => (
                        <option key={s.id || s._id} value={String(s.id || s._id)}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedTabs.some((t) => QUICK_TAB_KEYS.has(t)) && (
                  <div>
                    <label className={labelClass}>Serviceable Radius (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('serviceableRadius', { min: 0 })}
                      placeholder="e.g. 5"
                      className={inputClass}
                    />
                  </div>
                )}

                {!selectedTabs.every((t) => QUICK_TAB_KEYS.has(t)) && (
                  <div>
                    <label className={labelClass}>Delivery Estimate</label>
                    <input
                      {...register('deliveryEstimate')}
                      placeholder="e.g. 3-5 business days"
                      className={inputClass}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Brand</label>
                    <input {...register('brand')} placeholder="Brand name" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>SKU *</label>
                    <input {...register('sku', { required: 'SKU is required' })} placeholder="MH-XX-001" className={inputClass} />
                    {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Tags</label>
                  <input {...register('tags')} placeholder="Comma-separated tags (e.g., handmade, organic)" className={inputClass} />
                </div>
              </motion.div>
            )}

            {/* Pricing & Stock */}
            {activeSection === 'pricing' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <h3 className="text-base font-semibold text-gray-900">Pricing & Inventory</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Selling Price (₹) *</label>
                    <input type="number" {...register('price', { required: 'Price is required', min: { value: 0, message: 'Must be positive' } })} placeholder="0" className={inputClass} />
                    {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>MRP (₹) *</label>
                    <input type="number" {...register('mrp', { required: 'MRP is required', min: { value: 0, message: 'Must be positive' } })} placeholder="0" className={inputClass} />
                    {errors.mrp && <p className="text-xs text-red-500 mt-1">{errors.mrp.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Discount Price (₹)</label>
                    <input type="number" {...register('discountPrice')} placeholder="0" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>GST (%)</label>
                    <select {...register('gst')} className={inputClass}>
                      <option value="">No GST</option>
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Stock *</label>
                    <input type="number" {...register('stock', { required: 'Stock is required', min: 0 })} placeholder="0" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Weight (kg)</label>
                    <input type="number" step="0.01" {...register('weight')} placeholder="0.5" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Dimensions (LxWxH cm)</label>
                    <input {...register('dimensions')} placeholder="40x30x0.5" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Warranty</label>
                  <input {...register('warranty')} placeholder="e.g., 1 year against manufacturing defects" className={inputClass} />
                </div>
              </motion.div>
            )}

            {/* Media */}
            {activeSection === 'media' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <h3 className="text-base font-semibold text-gray-900">Product Images</h3>
                <p className="text-sm text-gray-500">Upload high-quality images. First image will be the thumbnail.</p>
                <ImageUploader images={images} onChange={setImages} maxImages={8} label="" />
              </motion.div>
            )}

            {/* Specifications */}
            {activeSection === 'specs' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <h3 className="text-base font-semibold text-gray-900">Specifications & Highlights</h3>

                <div>
                  <label className={labelClass}>Specifications</label>
                  <div className="space-y-3">
                    {specifications.map((spec, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input value={spec.key} onChange={(e) => { const s = [...specifications]; s[i].key = e.target.value; setSpecifications(s); }}
                               placeholder="Attribute (e.g., Material)" className={`${inputClass} flex-1`} />
                        <input value={spec.value} onChange={(e) => { const s = [...specifications]; s[i].value = e.target.value; setSpecifications(s); }}
                               placeholder="Value (e.g., Cotton)" className={`${inputClass} flex-1`} />
                        {specifications.length > 1 && (
                          <button type="button" onClick={() => setSpecifications(specifications.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 p-1">✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setSpecifications([...specifications, { key: '', value: '' }])}
                            className="text-sm text-blue-600 font-medium hover:text-blue-700">+ Add Specification</button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Highlights</label>
                  <textarea {...register('highlights')} rows={3} placeholder="Enter product highlights, one per line" className={inputClass} />
                </div>
              </motion.div>
            )}

            {/* SEO & Shipping */}
            {activeSection === 'seo' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <h3 className="text-base font-semibold text-gray-900">SEO & Shipping</h3>

                <div>
                  <label className={labelClass}>SEO Title</label>
                  <input {...register('seoTitle')} placeholder="SEO-friendly title" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>SEO Description</label>
                  <textarea {...register('seoDescription')} rows={3} placeholder="Meta description for search engines" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Return Policy</label>
                  <input {...register('returnPolicy')} placeholder="e.g., 7-day return if damaged" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Shipping Info</label>
                  <textarea {...register('shippingInfo')} rows={2} placeholder="Shipping details and estimated delivery" className={inputClass} />
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 justify-end sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-100">
              <Button type="button" variant="secondary" onClick={onSaveDraft} icon={FileText}>Save as Draft</Button>
              <Button type="submit" variant="primary" icon={Save}>{isEdit ? 'Update Product' : 'Publish Product'}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
