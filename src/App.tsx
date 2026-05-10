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
import Verhalen from "./pages/Verhalen";
import { Navigate } from "react-router-dom";
import BlogPost from "./pages/BlogPost";
import Login from "./pages/Login";
import Beers from "./pages/Beers";
import BeerDetail from "./pages/BeerDetail";
import Bierstekers from "./pages/Bierstekers";
import BierstekersArchive from "./pages/BierstekersArchive";
import Over from "./pages/Over";
import Restaurant from "./pages/Restaurant";
import Archief from "./pages/Archief";
import ProtectedRoute from "./components/ProtectedRoute";
import SiteFooter from "./components/SiteFooter";
import NotFound from "./pages/NotFound";
import { Skeleton } from "@/components/ui/skeleton";

const Admin = lazy(() => import("./pages/Admin"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

const LazyFallback = () => (
  <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
    <div className="w-full max-w-2xl space-y-4">
      <Skeleton className="h-8 w-1/3" />
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
              <Route path="/verhalen" element={<Verhalen />} />
              <Route path="/verhalen/:slug" element={<BlogPost />} />
              <Route path="/stories" element={<Navigate to="/verhalen" replace />} />
              <Route path="/post/:slug" element={<BlogPost />} />
              <Route path="/beers" element={<Beers />} />
              <Route path="/beers/:id" element={<BeerDetail />} />
              <Route path="/bierstekers" element={<Bierstekers />} />
              <Route path="/bierstekers/archief" element={<BierstekersArchive />} />
              <Route path="/over" element={<Over />} />
              <Route path="/archief" element={<Archief />} />
              <Route path="/restaurant" element={<Restaurant />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LazyFallback />}>
                      <AdminPanel />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-legacy"
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LazyFallback />}>
                      <Admin />
                    </Suspense>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <SiteFooter />
            <WhisperFAB />
          </BrowserRouter>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
