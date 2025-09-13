import React from 'react';

const TestimoniosSkeleton = () => (
  <section className="bg-secondary py-20">
    <div className="container mx-auto px-4">
      <h2 className="text-4xl font-bold text-text-inverted mb-12 text-center">
        Testimonios que inspiran
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-300 mr-4"></div>
              <div>
                <div className="h-6 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimoniosSkeleton;
