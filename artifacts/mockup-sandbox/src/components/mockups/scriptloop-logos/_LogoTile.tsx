import React from "react";

export type MarkProps = {
  primary?: string;
  secondary?: string;
  className?: string;
};

export function LogoTile({
  Mark,
  caption,
}: {
  Mark: React.FC<MarkProps>;
  caption: string;
}) {
  const fontFam = "Space Grotesk";
  return (
    <div className="w-[600px] h-[460px] bg-white flex flex-col overflow-hidden font-sans">
      <div className="flex h-40">
        <div className="flex-1 bg-zinc-50 flex flex-col items-center justify-center relative">
          <span className="absolute top-3 left-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Mark (Light)
          </span>
          <Mark className="w-20 h-20" primary="#4C1D95" secondary="#0D9488" />
        </div>
        <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center relative">
          <span className="absolute top-3 left-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            Mark (Dark)
          </span>
          <Mark className="w-20 h-20" primary="#A78BFA" secondary="#2DD4BF" />
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 bg-zinc-100 gap-6">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Wordmark
            </span>
            <div
              className="text-4xl text-zinc-900 font-bold tracking-tight"
              style={{ fontFamily: fontFam }}
            >
              ScriptLoop
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 h-24 bg-white rounded-lg flex items-center justify-center shadow-sm border border-zinc-200 relative">
            <span className="absolute top-2 left-2 text-[9px] font-semibold text-zinc-300 uppercase tracking-wider">
              Lockup
            </span>
            <div className="flex items-center gap-3 text-zinc-900">
              <Mark className="w-8 h-8" primary="#4C1D95" secondary="#0D9488" />
              <span
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: fontFam }}
              >
                ScriptLoop
              </span>
            </div>
          </div>
          <div className="flex-1 h-24 bg-zinc-950 rounded-lg flex items-center justify-center shadow-sm border border-zinc-800 relative">
            <span className="absolute top-2 left-2 text-[9px] font-semibold text-zinc-700 uppercase tracking-wider">
              Lockup
            </span>
            <div className="flex items-center gap-3 text-white">
              <Mark className="w-8 h-8" primary="#A78BFA" secondary="#2DD4BF" />
              <span
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: fontFam }}
              >
                ScriptLoop
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-14 bg-white border-t border-zinc-200 flex items-center px-6 text-[13px] text-zinc-600 italic">
        {caption}
      </div>
    </div>
  );
}
