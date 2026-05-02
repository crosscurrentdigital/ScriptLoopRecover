import type React from 'react';
import './_group.css';
import { 
  Play, Plus, MoreVertical, Search, Settings, 
  Library, Clock, HardDrive, Filter, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

export function Dashboard() {
  return (
    <div className="scriptloop-pro min-h-screen flex text-sm">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border flex items-center px-6 justify-between shrink-0 bg-background">
          <div className="flex items-center gap-4 text-muted-foreground font-mono text-xs">
            <span>workspace/</span>
            <span className="text-foreground">all_scripts</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter by name..." className="pl-8 h-8 bg-background border-border font-mono text-xs focus-visible:ring-1 rounded-sm" />
            </div>
            <Button size="sm" className="h-8 font-mono text-xs font-bold rounded-sm uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Script
            </Button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto bg-[#0a0a0a]">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {[1,2,3,4,5].map(i => (
              <ScriptCard key={i} index={i} />
            ))}
          </div>
        </div>
      </main>
      <InspectorPanel />
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col shrink-0">
      <div className="h-14 border-b border-border flex items-center px-4">
        <div className="font-mono text-xs font-bold text-primary flex items-center gap-2 tracking-widest">
          <div className="w-2 h-2 bg-primary rounded-none animate-pulse" />
          SCRIPTLOOP_PRO
        </div>
      </div>
      <nav className="p-4 space-y-1 flex-1">
        <NavItem icon={Library} label="Library" active />
        <NavItem icon={Clock} label="Recent" />
        <NavItem icon={Activity} label="Practice Stats" />
        <div className="pt-6 pb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Collections</div>
        <NavItem label="# monologues" />
        <NavItem label="# auditions" />
        <NavItem label="# keynote_24" />
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-muted-foreground uppercase">Audio Quota</span>
          <span className="font-mono text-[10px] text-foreground">84%</span>
        </div>
        <Progress value={84} className="h-1 rounded-none bg-secondary [&>*]:bg-primary" />
        <div className="mt-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-secondary flex items-center justify-center font-mono text-xs border border-border">
            US
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs truncate font-mono">user@domain.com</div>
            <div className="text-[10px] text-primary font-mono uppercase">Pro License</div>
          </div>
          <Settings className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, active }: { icon?: React.ComponentType<{ className?: string }>, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-2 py-1.5 text-xs font-mono rounded-none transition-colors ${active ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}>
      {Icon ? <Icon className="w-4 h-4" /> : <span className="w-4 h-4 text-center opacity-50">#</span>}
      <span className="truncate">{label}</span>
    </button>
  );
}

function ScriptCard({ index }: { index: number }) {
  const titles = [
    "Hamlet Act 3, Scene 1",
    "TED Talk Intro - Draft 2",
    "Investor Pitch Q3",
    "Wedding Toast - Final",
    "Podcast Episode 44 Intro"
  ];
  
  return (
    <div className="group border border-border bg-card p-4 hover:border-primary/50 transition-colors flex flex-col gap-4 cursor-pointer relative overflow-hidden rounded-none">
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <div className="font-mono text-[10px] text-primary mb-2 uppercase flex items-center gap-2">
          <span>02:45</span>
          <span className="w-1 h-1 bg-border rounded-none" />
          <span>432 WORDS</span>
        </div>
        <h3 className="font-sans font-medium text-base mb-1 truncate">{titles[index - 1]}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer The slings and arrows of outrageous fortune...
        </p>
      </div>
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary/20 flex items-center justify-center">
            <div className="w-1 h-1 bg-primary" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Audio Ready</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase">2H AGO</span>
      </div>
    </div>
  );
}

function InspectorPanel() {
  return (
    <aside className="w-64 border-l border-border bg-card flex flex-col shrink-0">
      <div className="h-14 border-b border-border flex items-center px-4">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Inspector</span>
      </div>
      <div className="p-4 flex items-center justify-center h-full text-center">
        <span className="font-mono text-[10px] text-muted-foreground uppercase leading-loose border border-dashed border-border p-4">
          Select script<br/>to view properties
        </span>
      </div>
    </aside>
  );
}