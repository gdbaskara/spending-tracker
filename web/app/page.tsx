import { StoreProvider } from "@/lib/store";
import { WebApp } from "@/components/WebApp";

export default function Page() {
  return (
    <StoreProvider>
      <WebApp />
    </StoreProvider>
  );
}
