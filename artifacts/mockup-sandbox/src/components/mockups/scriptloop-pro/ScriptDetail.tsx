import './_group.css';
import { 
  Play, Pause, ChevronLeft, Volume2, Settings2, Sliders, Maximize2, Mic, Save, MoreHorizontal, FastForward, Rewind, Repeat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ScriptDetail() {
  return (
    <div className="scriptloop-pro h-screen flex flex-col text-sm overflow-hidden bg-background text-foreground">
      <header className="h-14 border-b border-border bg-card flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-primary uppercase border border-primary/30 px-1.5 py-0.5 bg-primary/10">EDITING</span>
            <span className="font-mono text-sm tracking-tight text-foreground">Hamlet Act 3, Scene 1</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-8 font-mono text-xs rounded-none border-border hover:bg-secondary">
            <Save className="h-3 w-3 mr-2" /> Save Draft
          </Button>
          <Button size="sm" className="h-8 font-mono text-xs rounded-none font-bold uppercase tracking-widest px-6 bg-primary text-primary-foreground hover:bg-primary/90">
            <Maximize2 className="h-3 w-3 mr-2" /> Zen Mode
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-8 overflow-y-auto bg-[#0a0a0a]">
          <div className="max-w-2xl mx-auto border-l-2 border-border pl-8 py-4 relative">
            <div className="absolute left-[-17px] top-4 text-[10px] font-mono text-muted-foreground text-right w-6">01</div>
            <div className="absolute left-[-17px] top-[140px] text-[10px] font-mono text-muted-foreground text-right w-6">02</div>
            <div className="absolute left-[-17px] top-[380px] text-[10px] font-mono text-muted-foreground text-right w-6">03</div>
            
            <div className="space-y-8 font-sans text-lg leading-relaxed text-muted-foreground">
              <p>
                <span className="text-foreground font-medium bg-primary/10 px-1 rounded-sm">To be, or not to be, that is the question:</span><br/>
                Whether 'tis nobler in the mind to suffer<br/>
                The slings and arrows of outrageous fortune,<br/>
                Or to take arms against a sea of troubles<br/>
                And by opposing end them. To die—to sleep,<br/>
                No more; and by a sleep to say we end<br/>
                The heart-ache and the thousand natural shocks<br/>
                That flesh is heir to: 'tis a consummation<br/>
                Devoutly to be wish'd. To die, to sleep;<br/>
                To sleep, perchance to dream—ay, there's the rub:<br/>
                For in that sleep of death what dreams may come,<br/>
                When we have shuffled off this mortal coil,<br/>
                Must give us pause—there's the respect<br/>
                That makes calamity of so long life.<br/>
              </p>
              <p>
                For who would bear the whips and scorns of time,<br/>
                Th'oppressor's wrong, the proud man's contumely,<br/>
                The pangs of dispriz'd love, the law's delay,<br/>
                The insolence of office, and the spurns<br/>
                That patient merit of th'unworthy takes,<br/>
                When he himself might his quietus make<br/>
                With a bare bodkin? Who would fardels bear,<br/>
                To grunt and sweat under a weary life,<br/>
                But that the dread of something after death,<br/>
                The undiscovere'd country, from whose bourn<br/>
                No traveller returns, puzzles the will,<br/>
                And makes us rather bear those ills we have<br/>
                Than fly to others that we know not of?<br/>
              </p>
              <p>
                Thus conscience does make cowards of us all,<br/>
                And thus the native hue of resolution<br/>
                Is sicklied o'er with the pale cast of thought,<br/>
                And enterprises of great pitch and moment<br/>
                With this regard their currents turn awry<br/>
                And lose the name of action.
              </p>
            </div>
          </div>
        </main>

        <aside className="w-80 border-l border-border bg-card shrink-0 flex flex-col">
          <div className="p-5 border-b border-border">
            <h3 className="font-mono text-xs text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings2 className="w-3 h-3 text-primary" /> Audio Config
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground mb-2 block uppercase tracking-wider">AI Voice Model</label>
                <Select defaultValue="marcus">
                  <SelectTrigger className="w-full h-8 bg-background border-border font-mono text-xs rounded-none">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border font-mono text-xs">
                    <SelectItem value="marcus">v2_marcus_deep</SelectItem>
                    <SelectItem value="sarah">v2_sarah_clear</SelectItem>
                    <SelectItem value="james">v1_james_neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Speech Rate</label>
                  <span className="font-mono text-[10px] text-primary bg-primary/10 px-1">1.0x</span>
                </div>
                <Slider defaultValue={[50]} max={100} step={1} className="py-2" />
              </div>
            </div>
          </div>

          <div className="p-5 border-b border-border">
            <h3 className="font-mono text-xs text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sliders className="w-3 h-3 text-primary" /> Loop Engine
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Recall Gap</label>
                  <span className="font-mono text-[10px] text-primary bg-primary/10 px-1">3.5s</span>
                </div>
                <Slider defaultValue={[35]} max={100} step={1} className="py-2" />
                <p className="text-[10px] font-mono text-muted-foreground mt-3 leading-relaxed">
                  Inserts a 3.5s silent gap after each generated audio segment for recall practice.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-auto border-t border-border p-5 bg-background flex flex-col items-center">
             <div className="w-full flex items-center justify-between mb-4">
               <span className="font-mono text-[10px] text-muted-foreground">00:45</span>
               <span className="font-mono text-[10px] text-muted-foreground">02:30</span>
             </div>
             
             <div className="w-full h-12 bg-card border border-border mb-6 relative overflow-hidden flex items-center group cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-between px-0.5 opacity-40">
                  {Array.from({length: 60}).map((_, i) => (
                    <div key={i} className="w-[2px] bg-primary" style={{height: `${20 + Math.random() * 80}%`}} />
                  ))}
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-primary/20 border-r border-primary" />
             </div>

             <div className="flex justify-center items-center gap-6">
               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                 <Rewind className="h-4 w-4" />
               </Button>
               <Button size="icon" className="h-12 w-12 rounded-none bg-primary text-primary-foreground hover:bg-primary/90">
                 <Play className="h-5 w-5 ml-1" />
               </Button>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                 <FastForward className="h-4 w-4" />
               </Button>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}