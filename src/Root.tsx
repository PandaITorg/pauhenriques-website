import React, { StrictMode, Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./main";

const Root = () => {
  return (
    <StrictMode>
      <Suspense fallback={<div></div>}>
        <RouterProvider router={router} />
      </Suspense>
    </StrictMode>
  );
};

export default Root;
