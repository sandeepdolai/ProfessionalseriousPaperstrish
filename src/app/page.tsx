"use client";

import { FolioProvider } from "@/gl/react";
import { App } from "@/components/App";

export default function Page() {
  return (
    <FolioProvider>
      <App />
    </FolioProvider>
  );
}
