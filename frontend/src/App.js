import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/Header";
import Home from "@/pages/Home";
import Activities from "@/pages/Activities";
import ActivityDetail from "@/pages/ActivityDetail";
import Search from "@/pages/Search";
import Checklist from "@/pages/Checklist";
import Targets from "@/pages/Targets";
import Rotation from "@/pages/Rotation";

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="App relative min-h-screen text-foreground">
      <div className="bg-starfield" />
      <div className="bg-hudgrid" />
      <div className="bg-vignette" />
      <BrowserRouter>
        <AuthProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/activity/:id" element={<ActivityDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/targets" element={<Targets />} />
            <Route path="/rotation" element={<Rotation />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}

export default App;
