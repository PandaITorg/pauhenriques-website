import React from 'react';

const ProductVideosSkeleton = () => (
  <section className="bg-background py-20">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-text-main mb-12 text-center">
        Productos que transforman vidas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
            <div className="w-full h-64 bg-gray-300"></div>
            <div className="p-6">
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ProductVideosSkeleton;
