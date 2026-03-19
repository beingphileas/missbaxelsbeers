import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/useLanguage";
import SiteHeader from "@/components/SiteHeader";
import WhisperFAB from "@/components/WhisperFAB";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import BlogPost from "./pages/BlogPost";
import Login from "./pages/Login";
import Venues from "./pages/Venues";
import Beers from "./pages/Beers";
import BeerDetail from "./pages/BeerDetail";
import BreweryDetail from "./pages/BreweryDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { Skeleton } from "@/components/ui/skeleton";

const Admin = lazy(() => import("./pages/Admin"));
const BreweryPortal = lazy(() => import("./pages/BreweryPortal"));

const LazyFallback = () => (
  <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
    <div className="w-full max-w-2xl space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SiteHeader />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<Index />} />
              <Route path="/breweries" element={<Index />} />
              <Route path="/breweries/:id" element={<BreweryDetail />} />
              <Route path="/tastings" element={<Explore />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/post/:slug" element={<BlogPost />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/beers" element={<Beers />} />
              <Route path="/beers/:id" element={<BeerDetail />} />
              <Route path="/about" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mijn-brouwerij"
                element={
                  <ProtectedRoute>
                    <BreweryPortal />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <WhisperFAB />
          </BrowserRouter>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
