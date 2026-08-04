"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Shares the current client's real (Neon) name with client components that sit
 * outside the /clients/[id] subtree — notably the global portal footer. The
 * [id] layout (a server component) renders <SetClientName name={realName} /> to
 * push the name up into this context, which lives in the root (social) layout.
 */
type Ctx = {
  name: string | null;
  setName: (name: string | null) => void;
};

const ClientNameContext = createContext<Ctx>({ name: null, setName: () => {} });

export function ClientNameProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<string | null>(null);
  return (
    <ClientNameContext.Provider value={{ name, setName }}>
      {children}
    </ClientNameContext.Provider>
  );
}

export function useClientName(): string | null {
  return useContext(ClientNameContext).name;
}

/** Rendered by the /clients/[id] layout to publish the loaded client's name. */
export function SetClientName({ name }: { name: string }) {
  const { setName } = useContext(ClientNameContext);
  useEffect(() => {
    setName(name);
    return () => setName(null);
  }, [name, setName]);
  return null;
}
