import { ReactNode } from "react";

import { getDidarBackLabel, getDidarHomeUrl, getDidarWorkspaceCopy } from "../../../lib/didar-navigation";
import { AuthLanguageSelect } from "./auth-language-select";

type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const workspace = getDidarWorkspaceCopy();

  return (
    <div className="didar-vendor-auth flex h-dvh w-dvw overflow-hidden">
      <div className="didar-vendor-auth__panel bg-ui-bg-base border-ui-border-base flex h-full w-full flex-col overflow-y-auto border-r lg:w-[584px] lg:shrink-0">
        <div className="flex items-center justify-between gap-4 px-8 pt-8 lg:px-14 lg:pt-12">
          <a className="didar-vendor-auth__back" href={getDidarHomeUrl()}>{getDidarBackLabel()} ↗</a>
          <AuthLanguageSelect />
        </div>
        <div className="flex flex-1 flex-col px-8 pb-8 lg:px-14 lg:pb-12">
          {children}
        </div>
      </div>
      <div className="didar-vendor-auth__editorial relative hidden flex-1 overflow-hidden lg:flex">
        <div>
          <p className="didar-vendor-auth__eyebrow">{workspace.eyebrow}</p>
          <h2>{workspace.title}</h2>
          <p>{workspace.description}</p>
        </div>
      </div>
    </div>
  );
};
