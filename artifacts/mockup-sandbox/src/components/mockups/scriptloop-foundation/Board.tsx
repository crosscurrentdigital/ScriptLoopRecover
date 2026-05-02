import React from "react";

const Palettes = {
  minimal: ["#FAFAFA", "#EBEBEB", "#D2CFC4", "#849080", "#111111"],
  pro: ["#0D0D12", "#1A1A24", "#2D2D3A", "#3B82F6", "#FFFFFF"],
  immersive: ["#05050A", "#140A26", "#4C1D95", "#A78BFA", "#2DD4BF"],
};

function SwatchRow({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-3">
      {colors.map((c) => (
        <div key={c} className="flex flex-col gap-2">
          <div
            className="w-16 h-16 rounded-md shadow-sm border border-black/5 dark:border-white/5"
            style={{ backgroundColor: c }}
          />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            {c}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Board() {
  return (
    <div className="w-[1800px] h-[720px] bg-[#0E0E10] text-[#EAEAEA] flex overflow-hidden font-sans antialiased shrink-0">
      {/* Left Column: Brand Core */}
      <div className="w-[420px] p-14 flex flex-col justify-between border-r border-white/10 shrink-0 bg-[#0A0A0C]">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-12 text-white">ScriptLoop.</h1>
          
          <div className="mb-12">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#666] mb-4">Positioning</h2>
            <p className="text-lg leading-relaxed text-[#D4D4D4] font-light">
              A production-grade memorization environment that uses intelligent audio loops to build recall, not just read lines.
            </p>
          </div>
          
          <div className="mb-12">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#666] mb-4">Audience</h2>
            <p className="text-sm leading-relaxed text-[#A1A1AA]">
              Actors, presenters, public speakers, and students who treat memorization as a professional craft.
            </p>
          </div>
        </div>
        
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[#666] mb-4">Tone & Voice</h2>
          <div className="flex flex-wrap gap-2">
            {["Calm", "Focused", "Premium", "Slightly Futuristic"].map((word) => (
              <span
                key={word}
                className="px-3 py-1.5 text-xs bg-[#1A1A1D] border border-white/5 rounded-full text-[#A1A1AA]"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Columns: Three Directions */}
      <div className="flex-1 grid grid-cols-3 divide-x divide-white/10 bg-[#111114]">
        
        {/* Direction 1: Minimal */}
        <div className="flex flex-col h-full bg-[#FDFDFC] text-[#111]">
          <div className="p-10 border-b border-black/5 shrink-0 h-[240px]">
            <span className="inline-block px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#888] mb-6 bg-[#F4F4F4] rounded-sm">
              Direction 1
            </span>
            <h3 className="text-2xl font-['Cormorant_Garamond'] mb-2">Minimal (Editorial)</h3>
            <p className="text-sm text-[#666] leading-relaxed">
              Rooted in print design. High-contrast, austere, and deeply focused on the script itself. Uses generous whitespace as a primary structural element.
            </p>
          </div>
          
          <div className="p-10 flex-1 flex flex-col gap-10">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-4">Palette</h4>
              <SwatchRow colors={Palettes.minimal} />
            </div>
            
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-4">Typography</h4>
              <div className="p-6 bg-white border border-black/5 rounded-lg shadow-sm">
                <div className="font-['Cormorant_Garamond'] text-3xl mb-3 text-black tracking-tight">Act I, Scene II</div>
                <div className="font-['Inter'] text-[13px] text-[#555] leading-relaxed">
                  Cormorant Garamond (Headers) paired with Inter (Body). Provides a timeless, intellectual foundation that respects the written word.
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#999] mb-4">Imagery & Iconography</h4>
              <p className="text-sm text-[#444] leading-relaxed">
                1px monoline strokes. No fills. Monochromatic, high-contrast photography focusing on performers' expressions and negative space.
              </p>
            </div>
          </div>
        </div>

        {/* Direction 2: Pro */}
        <div className="flex flex-col h-full bg-[#0D0D12] text-[#EEE]">
          <div className="p-10 border-b border-white/5 shrink-0 h-[240px]">
            <span className="inline-block px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#666] mb-6 bg-[#1A1A24] rounded-sm">
              Direction 2
            </span>
            <h3 className="text-2xl font-['Space_Grotesk'] tracking-tight mb-2 text-white">Pro (Studio-Dark)</h3>
            <p className="text-sm text-[#888] leading-relaxed">
              Feels like a high-end audio engineering tool or IDE. Dense, utilitarian, and optimized for long sessions in dark rehearsal spaces.
            </p>
          </div>
          
          <div className="p-10 flex-1 flex flex-col gap-10">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#555] mb-4">Palette</h4>
              <SwatchRow colors={Palettes.pro} />
            </div>
            
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#555] mb-4">Typography</h4>
              <div className="p-6 bg-[#14141A] border border-white/5 rounded-lg shadow-sm">
                <div className="font-['Space_Grotesk'] text-2xl mb-3 text-white tracking-tight">ACT I, SCENE II</div>
                <div className="font-['Geist_Mono'] text-[13px] text-[#999] leading-relaxed">
                  Space Grotesk (Headers) paired with Geist Mono (Body). Technical, structured, and highly legible. Code-like precision.
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#555] mb-4">Imagery & Iconography</h4>
              <p className="text-sm text-[#999] leading-relaxed">
                Solid, functional UI icons (2px stroke or filled). Data visualizations (waveforms, progress rings). No lifestyle photography.
              </p>
            </div>
          </div>
        </div>

        {/* Direction 3: Immersive */}
        <div className="flex flex-col h-full bg-[#05050A] text-[#E0D4F5] relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#4C1D95]/15 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="p-10 border-b border-[#4C1D95]/20 shrink-0 h-[240px] relative z-10">
            <span className="inline-block px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#A78BFA] mb-6 bg-[#4C1D95]/20 rounded-sm">
              Direction 3
            </span>
            <h3 className="text-2xl font-['Syne'] font-bold tracking-tight mb-2 text-white">Immersive (Cinematic)</h3>
            <p className="text-sm text-[#A78BFA]/80 leading-relaxed">
              Premium, dramatic, and slightly futuristic. Uses deep color, soft glows, and smooth motion to create a flow state.
            </p>
          </div>
          
          <div className="p-10 flex-1 flex flex-col gap-10 relative z-10">
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#A78BFA]/60 mb-4">Palette</h4>
              <SwatchRow colors={Palettes.immersive} />
            </div>
            
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#A78BFA]/60 mb-4">Typography</h4>
              <div className="p-6 bg-[#140A26]/50 border border-[#4C1D95]/30 rounded-lg backdrop-blur-md shadow-lg">
                <div className="font-['Syne'] font-bold text-2xl mb-3 text-white tracking-tight">Act I, Scene II</div>
                <div className="font-['Outfit'] text-[13px] text-[#A78BFA]/90 leading-relaxed">
                  Syne (Headers) paired with Outfit (Body). Bold, contemporary, and distinctly digital. Excellent for screen reading.
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#A78BFA]/60 mb-4">Imagery & Iconography</h4>
              <p className="text-sm text-[#A78BFA]/80 leading-relaxed">
                1.5px soft-edged icons, sometimes with subtle gradients. Deep, cinematic depth-of-field photography and dark abstract fluid waves.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
