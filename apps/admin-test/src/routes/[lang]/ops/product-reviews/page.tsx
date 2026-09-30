import { Workspace } from "../../../../../../../shared/p01/workspace";
declare const __BACKEND_URL__: string;
export const config = { public: true };
export default function Page() {
  return (
    <Workspace backend={__BACKEND_URL__} audience="admin" screen="reviews" />
  );
}
