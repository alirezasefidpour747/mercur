import { Navigate } from "react-router-dom";
export const config = { public: true };
export default function Page() {
  return <Navigate replace to="/fa/ops/product-reviews" />;
}
