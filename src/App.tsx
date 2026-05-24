import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/useLanguage";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AgeGate from "@/components/AgeGate";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import CookieConsent from "@/components/CookieConsent";
import { installErrorReporter } from "@/lib/errorReporter";

import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const BeerDetail = lazy(() => import("./pages/BeerDetail"));
const Over = lazy(() => import("./pages/Over"));
const Restaurant = lazy(() => import("./pages/Restaurant"));
const Beers = lazy(() => import("./pages/Beers"));
const Verhalen = lazy(() => import("./pages/Verhalen"));
const Archief = lazy(() => import("./pages/Archief"));
const Bierstekers = lazy(() => import("./pages/Bierstekers"));
const BierstekersArchive = lazy(() => import("./pages/BierstekersArchive"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Login = lazy(() => import("./pages/Login"));
const PrivacyBeleid = lazy(() => import("./pages/PrivacyBeleid"));
const Voorwaarden = lazy(() => import("./pages/Voorwaarden"));
const Cookiebeleid = lazy(() => import("./pages/Cookiebeleid"));
const VerantwoordDrinken = lazy(() => import("./pages/VerantwoordDrinken"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[var(--hop)] border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    installErrorReporter();
  }, []);

  return (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnalyticsTracker />
            <AgeGate />
            <SiteHeader />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/verhalen" element={<Verhalen />} />
                <Route path="/verhalen/:slug" element={<BlogPost />} />
                <Route path="/beers" element={<Beers />} />
                <Route path="/beers/:id" element={<BeerDetail />} />
                <Route path="/bierstekers" element={<Bierstekers />} />
                <Route path="/bierstekers/archief" element={<BierstekersArchive />} />
                <Route path="/over" element={<Over />} />
                <Route path="/archief" element={<Archief />} />
                <Route path="/restaurant" element={<Restaurant />} />
                <Route path="/login" element={<Login />} />
                <Route path="/privacy" element={<PrivacyBeleid />} />
                <Route path="/algemene-voorwaarden" element={<Voorwaarden />} />
                <Route path="/cookiebeleid" element={<Cookiebeleid />} />
                <Route path="/verantwoord-drinken" element={<VerantwoordDrinken />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <SiteFooter />
            <CookieConsent />
          </BrowserRouter>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
