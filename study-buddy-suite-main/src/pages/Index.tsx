import { useEffect } from "react";

/**
 * StudentFlow - Offline Productivity App for Students
 * 
 * This React wrapper redirects to the plain HTML/CSS/JS app.
 * The actual app is located in /public/index.html and runs fully offline.
 * 
 * To use the app:
 * 1. Open public/index.html directly in Chrome
 * 2. Or run: cd public && npx live-server
 */
const Index = () => {
  useEffect(() => {
    // Redirect to the plain HTML app
    window.location.href = "/index.html";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#e7ecf2", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="text-center" style={{ color: "#071330" }}>
        <h1 className="mb-4 text-4xl font-bold">StudentFlow</h1>
        <p className="text-xl" style={{ color: "#738fa7" }}>Loading your productivity app...</p>
        <p className="mt-4 text-sm" style={{ color: "#738fa7" }}>
          If you're not redirected, <a href="/index.html" style={{ color: "#083b69", textDecoration: "underline" }}>click here</a>
        </p>
      </div>
    </div>
  );
};

export default Index;
