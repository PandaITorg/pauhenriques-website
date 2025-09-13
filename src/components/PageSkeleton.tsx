import React, { useState, useEffect } from 'react';

interface PageSkeletonProps {
  isReady: boolean; // New prop to signal when content is ready
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({ isReady }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (isReady) {
      setFadingOut(true);
    }
  }, [isReady]);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-background ${fadingOut ? 'fade-out' : ''}`}>
      {/* CSS-only Spinner */}
      <div className="simple-spinner"></div>
    </div>
  );
};

export default PageSkeleton;