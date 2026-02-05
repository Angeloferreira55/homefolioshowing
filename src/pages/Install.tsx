import { Smartphone, Share2, Plus, Menu, Download, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Install() {
  const navigate = useNavigate();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/90 text-white">
      {/* Header */}
      <div className="border-b border-white/20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Home className="w-5 h-5" />
            <span className="font-semibold">HomeFolio</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-cyan-300" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">Install HomeFolio</h1>
          <p className="text-lg text-white/80">
            Add HomeFolio to your home screen for quick access and offline browsing
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Download className="w-5 h-5 text-cyan-300" />
              <h3 className="font-semibold">Quick Access</h3>
            </div>
            <p className="text-sm text-white/70">Launch HomeFolio directly from your home screen like a native app</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Menu className="w-5 h-5 text-cyan-300" />
              <h3 className="font-semibold">No App Store</h3>
            </div>
            <p className="text-sm text-white/70">Install without visiting the App Store or Play Store</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Share2 className="w-5 h-5 text-cyan-300" />
              <h3 className="font-semibold">Works Offline</h3>
            </div>
            <p className="text-sm text-white/70">Access your properties and showings even without an internet connection</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Home className="w-5 h-5 text-cyan-300" />
              <h3 className="font-semibold">Always Updated</h3>
            </div>
            <p className="text-sm text-white/70">Get the latest features automatically without manual updates</p>
          </div>
        </div>

        {/* Device-Specific Instructions */}
        <div className="space-y-8">
          {/* iPhone/iPad Instructions */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-cyan-300">📱</span> iPhone & iPad Instructions
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-300 text-primary font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Tap the Share Button</h3>
                  <p className="text-white/70">
                    Look for the share icon (arrow pointing up from a box) at the bottom of your screen
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-300 text-primary font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Select "Add to Home Screen"</h3>
                  <p className="text-white/70">
                    Scroll down through the share options and tap "Add to Home Screen" (you may need to scroll to see it)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-300 text-primary font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Confirm & Add</h3>
                  <p className="text-white/70">
                    A popup will appear. Tap "Add" in the top-right corner to confirm
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-300 text-primary font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Done! 🎉</h3>
                  <p className="text-white/70">
                    HomeFolio will now appear on your home screen with a custom icon. Tap it anytime to launch the app
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Android Instructions */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-cyan-300">🤖</span> Android Instructions
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-300 text-primary font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Open the Browser Menu</h3>
                  <p className="text-white/70">
                    Tap the three dots (menu icon) in the top-right corner of your browser
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-300 text-primary font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Look for Install Options</h3>
                  <p className="text-white/70">
                    You should see either "Install app" or "Add to Home Screen" in the menu. Tap it
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-300 text-primary font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Confirm Installation</h3>
                  <p className="text-white/70">
                    A popup will appear asking to confirm. Tap "Install" or "Add"
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-cyan-300 text-primary font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Done! 🎉</h3>
                  <p className="text-white/70">
                    HomeFolio will now appear on your home screen or in your app drawer. Launch it anytime
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
                <p className="text-sm text-white/80">
                  <strong>Note:</strong> The install option may be called different names depending on your browser (Chrome, Edge, Firefox, Samsung Internet, etc.)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-12 bg-white/5 backdrop-blur rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Troubleshooting</h2>
          <div className="space-y-4 text-white/80">
            <div>
              <h3 className="font-semibold text-white mb-1">Don't see the install option?</h3>
              <p className="text-sm">Make sure you're visiting the full app at <code className="bg-black/30 px-2 py-1 rounded text-cyan-300">homefolioshowing.lovable.app</code>. The install option may not appear in preview mode or older browsers.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Already installed?</h3>
              <p className="text-sm">If you've already added HomeFolio to your home screen, you'll see an "App is ready to install" message instead. Just tap the install button in that banner.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Need to uninstall?</h3>
              <p className="text-sm">Uninstall HomeFolio like any app: Long-press the icon on your home screen and select "Remove" (iPhone) or "Uninstall" (Android).</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="bg-cyan-400 text-primary hover:bg-cyan-300 font-semibold px-8"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/20 mt-12 py-6 text-center text-white/60 text-sm">
        <p>Need help? Contact us or visit our <button onClick={() => navigate("/contact")} className="underline hover:text-white transition-colors">support page</button></p>
      </div>
    </div>
  );
}
