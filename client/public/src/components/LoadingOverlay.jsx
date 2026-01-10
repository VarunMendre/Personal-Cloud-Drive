import { Loader2 } from "lucide-react";

/**
 * A premium loading overlay with backdrop blur and centered animation.
 */
const LoadingOverlay = ({ message = "Authenticating..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/30 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center gap-4 p-8 bg-white/80 rounded-2xl shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-16 h-16 rounded-full border-4 border-[#66B2D6]/20 border-t-[#66B2D6] animate-spin" />
          
          {/* Inner pulsing icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#66B2D6] animate-pulse" />
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl font-bold text-gray-800 tracking-tight">
            {message}
          </span>
          <p className="text-sm text-gray-500 font-medium animate-pulse">
            Setting up your secure space
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
