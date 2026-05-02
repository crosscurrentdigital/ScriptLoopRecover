import React from "react";
import { Plus, Search, MoreHorizontal, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import "./_group.css";

const SCRIPTS = [
  { id: 1, title: "Hamlet - Act 3, Scene 1", added: "2 days ago", duration: "3:45", words: 262 },
  { id: 2, title: "TEDx: The Architecture of Silence", added: "5 days ago", duration: "12:20", words: 1840 },
  { id: 3, title: "Q3 Board Meeting Opening", added: "1 week ago", duration: "4:15", words: 520 },
  { id: 4, title: "Wedding Toast (David & Sarah)", added: "2 weeks ago", duration: "2:50", words: 380 },
];

export function Dashboard() {
  return (
    <div className="scriptloop-minimal p-8 md:p-12 lg:p-16 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
        <div>
          <h2 className="font-sans text-sm tracking-widest uppercase text-muted-foreground mb-4">ScriptLoop</h2>
          <h1 className="font-serif text-5xl tracking-tight">Your Library</h1>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Audio Generation Quota</span>
            <span className="font-medium text-foreground">45 / 120 mins</span>
          </div>
          <Progress value={(45/120)*100} className="w-48 h-1 bg-border [&>div]:bg-foreground" />
        </div>
      </header>

      <div className="flex justify-between items-center mb-8 gap-4 border-b border-border pb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search scripts..." 
            className="pl-10 bg-transparent border-none shadow-none text-lg focus-visible:ring-0 px-0 rounded-none border-b-2 border-transparent focus-visible:border-foreground transition-colors"
          />
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none px-6 py-6 h-auto text-base gap-2">
          <Plus className="w-5 h-5" />
          New Script
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SCRIPTS.map((script) => (
          <div 
            key={script.id} 
            className="group relative p-6 border border-border hover:border-foreground transition-colors cursor-pointer bg-card flex flex-col h-56"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-secondary text-secondary-foreground rounded-sm">
                <FileText className="w-4 h-4" />
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 -mr-2 -mt-2">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            
            <h3 className="font-serif text-2xl leading-snug mb-auto line-clamp-2 pr-4 group-hover:text-primary transition-colors">
              {script.title}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t border-border/50">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {script.duration}</span>
              <span>•</span>
              <span>{script.words} words</span>
            </div>
          </div>
        ))}
        
        <div className="p-6 border border-dashed border-border hover:border-primary transition-colors cursor-pointer bg-transparent flex flex-col items-center justify-center h-56 text-muted-foreground hover:text-primary group">
          <div className="w-12 h-12 rounded-full border border-current flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-serif text-xl">Blank Page</span>
        </div>
      </div>
    </div>
  );
}
