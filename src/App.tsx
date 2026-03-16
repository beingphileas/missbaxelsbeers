import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SiteHeader from "@/components/SiteHeader";
import WhisperFAB from "@/components/WhisperFAB";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import BlogPost from "./pages/BlogPost";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Venues from "./pages/Venues";
import Beers from "./pages/Beers";
import BeerDetail from "./pages/BeerDetail";
import BreweryDetail from "./pages/BreweryDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <WhisperFAB />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
