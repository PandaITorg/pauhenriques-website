import React, { StrictMode, Suspense, useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import PageSkeleton from "./components/PageSkeleton";
import { router } from "./main";

const Root = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isContentReady, setIsContentReady] = useState(false); // New state for content readiness

  useEffect(() => {
    // Simulate a minimum loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Display skeleton for at least 1 second

    return () => clearTimeout(timer);
  }, []);

  // This useEffect will run once the main content (RouterProvider) is rendered
  // and will signal to PageSkeleton that it's time to fade out.
  useEffect(() => {
    if (!isLoading) {
      setIsContentReady(true);
    }
  }, [isLoading]);


  return (
    <StrictMode>
      {isLoading ? (
        <PageSkeleton isReady={isContentReady} /> // Pass isReady prop
      ) : (
        <Suspense fallback={<PageSkeleton isReady={isContentReady} />}> {/* Pass isReady prop */}
          <RouterProvider router={router} />
        </Suspense>
      )}
    </StrictMode>
  );
};

export default Root;