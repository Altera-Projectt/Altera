import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    /* Layer 1: Full screen gradient background (Electric Blue to Cyan) */
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0011FF] to-[#00C8FF] p-4 md:p-8">
      
      {/* Layer 2: The Glassmorphism Border Wrapper (7px padding creates the border effect) */}
      <div className="w-full max-w-[1200px] bg-[#F0F8FF]/35 p-[7px] rounded-[30px] backdrop-blur-md shadow-2xl">
        
        {/* Layer 3: The Inner Solid White Box */}
        <div className="w-full h-full bg-[#F0F8FF] rounded-[23px] overflow-hidden flex flex-col md:flex-row min-h-[700px]">
          {children}
        </div>

      </div>
    </div>
  );
}
