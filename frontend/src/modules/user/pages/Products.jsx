import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { getProducts } from '../services/catalogApi';
import { extractList, mapProductForCard } from '../utils/mappers';
import { getCurrentMarketplaceTab } from '../../../shared/utils/marketplaceHelpers';

import SamsungImg from '../../../assets/products/product01.jpg';

const Products = () => {
  const [searchParams] = useSearchParams();
  // Explicit ?tab= wins; falls back to the customer's current marketplace
  // tab. Without this, the fetch below was unscoped and returned every
  // approved product across all four tabs mixed together — confirmed live
  // against production data.
  const marketplaceTab = searchParams.get('tab') || getCurrentMarketplaceTab();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProducts({ limit: 24, marketplaceTab });
        if (!cancelled) {
          setProducts(extractList(data).map((p) => mapProductForCard(p, SamsungImg)));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [marketplaceTab]);

  return (
    <div className="container mx-auto px-4 py-8 flex gap-6">
      {/* Sidebar Filters */}
      <aside className="hidden lg:block w-64 bg-white p-4 shadow-sm border border-gray-200 self-start">
        <h2 className="font-bold text-lg mb-4 border-b pb-2">Filters</h2>
        
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 uppercase">Category</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li><input type="checkbox" className="mr-2" /> Electronics</li>
            <li><input type="checkbox" className="mr-2" /> Fashion</li>
            <li><input type="checkbox" className="mr-2" /> Home & Kitchen</li>
            <li><input type="checkbox" className="mr-2" /> Beauty</li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2 uppercase">Price</h3>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Min" className="w-full p-1 border text-sm" />
            <span>-</span>
            <input type="text" placeholder="Max" className="w-full p-1 border text-sm" />
          </div>
        </div>

        <div>
          <h3 className="font-bold text-sm mb-2 uppercase">Customer Ratings</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li className="cursor-pointer hover:text-primary-dark">4★ & above</li>
            <li className="cursor-pointer hover:text-primary-dark">3★ & above</li>
          </ul>
        </div>
      </aside>

      {/* Product Grid */}
      <div className="flex-1">
        <div className="bg-white p-4 shadow-sm border border-gray-200 mb-6 flex justify-between items-center">
          <h1 className="font-bold text-gray-800">
            {loading
              ? 'Loading products...'
              : error
                ? 'Could not load products'
                : `Showing ${products.length} products`}
          </h1>
          <select className="border p-1 text-sm outline-none">
            <option>Sort by: Relevance</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <p className="text-sm text-gray-500 col-span-full">Loading...</p>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
