import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/app-header";

function App() {
  const location = useLocation();
  const hideHeader = ["/login", "/signup"].includes(location.pathname);

  return (
    <div className="min-h-svh bg-background">
      {!hideHeader && <AppHeader />}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
