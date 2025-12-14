import { ReactNode } from "react";
import { Header } from "./Header";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Header />
      <main className="flex-1 overflow-auto p-4">{children}</main>
    </>
  );
}
