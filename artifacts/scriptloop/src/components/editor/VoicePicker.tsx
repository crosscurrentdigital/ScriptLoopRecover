import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface VoiceOption {
  id: string;
  name: string;
  description?: string;
}

export const DEFAULT_VOICES: VoiceOption[] = [
  {
    id: "voice_aria",
    name: "Aria",
    description: "Warm, conversational",
  },
  {
    id: "voice_rowan",
    name: "Rowan",
    description: "Deep, narrative",
  },
  {
    id: "voice_juno",
    name: "Juno",
    description: "Bright, energetic",
  },
];

interface VoicePickerProps {
  value: string;
  onChange: (voiceId: string) => void;
  voices?: VoiceOption[];
  disabled?: boolean;
  id?: string;
}

export function VoicePicker({
  value,
  onChange,
  voices = DEFAULT_VOICES,
  disabled,
  id,
}: VoicePickerProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Select a voice" />
      </SelectTrigger>
      <SelectContent>
        {voices.map((voice) => (
          <SelectItem key={voice.id} value={voice.id}>
            <span className="font-medium">{voice.name}</span>
            {voice.description && (
              <span className="text-muted-foreground ml-2 text-xs">
                {voice.description}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
