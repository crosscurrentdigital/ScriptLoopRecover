import React, { useState } from "react";
import { ArrowLeft, Play, Pause, Settings2, Maximize2, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "./_group.css";

const HAMLET_TEXT = `To be, or not to be, that is the question:
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take arms against a sea of troubles
And by opposing end them. To die—to sleep,
No more; and by a sleep to say we end
The heart-ache and the thousand natural shocks
That flesh is heir to: 'tis a consummation
Devoutly to be wish'd. To die, to sleep;
To sleep, perchance to dream—ay, there's the rub:
For in that sleep of death what dreams may come,
When we have shuffled off this mortal coil,
Must give us pause—there's the respect
That makes calamity of so long life.`;

export function ScriptDetail() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopGap, setLoopGap] = useState([3]);

  return (
    <div className="scriptloop-minimal flex flex-col h-screen overflow-hidden">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-border bg-background/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-none hover:bg-secondary">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border" />
          <h1 className="font-serif text-xl text-muted-foreground">Hamlet - Act 3, Scene 1</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Voice</span>
            <Select defaultValue="arthur">
              <SelectTrigger className="w-36 rounded-none border-border bg-transparent h-9 text-sm focus:ring-0">
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-border">
                <SelectItem value="arthur">Arthur (British, Deep)</SelectItem>
                <SelectItem value="sarah">Sarah (American, Clear)</SelectItem>
                <SelectItem value="marcus">Marcus (Neutral, Calm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" className="rounded-none border-border h-9 gap-2">
            <Settings2 className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 py-16 md:px-24 lg:px-32 xl:px-48 pb-48">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl tracking-tight mb-12 text-foreground">
            Hamlet - Act 3, Scene 1
          </h1>
          
          <div className="prose prose-lg md:prose-xl max-w-none text-foreground/80 font-serif leading-relaxed">
            {HAMLET_TEXT.split('\n').map((line, i) => (
              <p key={i} className="my-4">{line}</p>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Player */}
      <footer className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-md shrink-0 px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Loop Controls */}
          <div className="flex-1 flex items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col gap-1 w-full max-w-[200px]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Silent Gap</span>
                <span className="text-xs text-foreground font-mono">{loopGap[0]}s</span>
              </div>
              <Slider 
                value={loopGap} 
                onValueChange={setLoopGap} 
                max={10} 
                step={0.5}
                className="[&>span:first-child]:bg-border [&_[role=slider]]:border-primary [&_[role=slider]]:bg-primary"
              />
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="hover:bg-transparent hover:text-primary transition-colors">
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-xl"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-transparent hover:text-primary transition-colors">
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex-1 flex items-center justify-end w-full md:w-auto gap-4">
            <div className="hidden md:flex items-center gap-3 text-muted-foreground">
              <Volume2 className="w-4 h-4" />
              <div className="w-24 h-1 bg-border rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-foreground" />
              </div>
            </div>
            <div className="w-px h-8 bg-border hidden md:block mx-2" />
            <Button className="rounded-none bg-foreground hover:bg-primary text-background hover:text-primary-foreground gap-2 px-6 h-12 text-base transition-colors">
              <Maximize2 className="w-4 h-4" />
              Zen Mode
            </Button>
          </div>

        </div>
      </footer>
    </div>
  );
}
