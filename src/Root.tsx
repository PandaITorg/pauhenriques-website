import { StrictMode, Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./router";

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
