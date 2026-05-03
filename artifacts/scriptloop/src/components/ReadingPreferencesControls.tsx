import { Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BACKGROUND_OPTIONS,
  FONT_OPTIONS,
  INFO_TEXT,
  SLIDER_RANGES,
  TEXT_OPTIONS,
  getBackgroundHex,
  getFontCssFamily,
  getTextHex,
  suggestTextColor,
  type ColorOption,
  type ReadingPreferences,
} from "@/lib/reading-preferences";
import { cn } from "@/lib/utils";

function InfoIcon({ text, label }: { text: string; label: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About ${label}`}
            className="reading-focus inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SwatchPicker({
  options,
  value,
  onChange,
  label,
  isText,
  idPrefix,
}: {
  options: ColorOption[];
  value: string;
  onChange: (next: string) => void;
  label: string;
  isText?: boolean;
  idPrefix: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap gap-2"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            id={`${idPrefix}-${opt.value}`}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={opt.label}
            onClick={() => onChange(opt.value)}
            className={cn(
              "reading-focus relative h-12 min-w-[60px] rounded-md border-2 px-3 text-xs font-medium transition-shadow",
              selected
                ? "border-primary shadow-md"
                : "border-border hover:border-muted-foreground/50",
            )}
            style={{
              backgroundColor: opt.hex,
              color: isText
                ? "#ffffff"
                : opt.value === "darkGray"
                  ? "#fff"
                  : "#222",
            }}
          >
            {isText ? (
              <span style={{ color: opt.hex, mixBlendMode: "normal" }}>
                Aa
              </span>
            ) : (
              opt.label
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface ReadingPreferencesControlsProps {
  preferences: ReadingPreferences;
  onChange: (patch: Partial<ReadingPreferences>) => void;
  /** Used to scope element IDs so multiple controls can render on one page. */
  idPrefix?: string;
}

export function ReadingPreferencesControls({
  preferences,
  onChange,
  idPrefix = "reading",
}: ReadingPreferencesControlsProps) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {/* Font family */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <label
            htmlFor={`${idPrefix}-font-family`}
            className="text-sm font-medium"
          >
            Font
          </label>
          <InfoIcon text={INFO_TEXT.fontFamily} label="font" />
        </div>
        <select
          id={`${idPrefix}-font-family`}
          value={preferences.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          aria-label="Font family"
          className="reading-focus w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {FONT_OPTIONS.map((font) => (
            <option
              key={font.value}
              value={font.value}
              style={{ fontFamily: font.cssFamily }}
            >
              {font.label}
            </option>
          ))}
        </select>
        <div className="mt-3 grid gap-1">
          {FONT_OPTIONS.map((font) => {
            const selected = font.value === preferences.fontFamily;
            return (
              <button
                key={font.value}
                type="button"
                onClick={() => onChange({ fontFamily: font.value })}
                aria-pressed={selected}
                className={cn(
                  "reading-focus rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted",
                )}
                style={{ fontFamily: font.cssFamily }}
              >
                {font.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label
                htmlFor={`${idPrefix}-font-size`}
                className="text-sm font-medium"
              >
                Font size
              </label>
              <InfoIcon text={INFO_TEXT.fontSize} label="font size" />
            </div>
            <span className="text-sm text-muted-foreground">
              {preferences.fontSize}px
            </span>
          </div>
          <Slider
            id={`${idPrefix}-font-size`}
            aria-label="Font size"
            min={SLIDER_RANGES.fontSize.min}
            max={SLIDER_RANGES.fontSize.max}
            step={SLIDER_RANGES.fontSize.step}
            value={[preferences.fontSize]}
            onValueChange={(v) => onChange({ fontSize: v[0] })}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label
                htmlFor={`${idPrefix}-line-height`}
                className="text-sm font-medium"
              >
                Line height
              </label>
              <InfoIcon text={INFO_TEXT.lineHeight} label="line height" />
            </div>
            <span className="text-sm text-muted-foreground">
              {preferences.lineHeight.toFixed(1)}
            </span>
          </div>
          <Slider
            id={`${idPrefix}-line-height`}
            aria-label="Line height"
            min={SLIDER_RANGES.lineHeight.min}
            max={SLIDER_RANGES.lineHeight.max}
            step={SLIDER_RANGES.lineHeight.step}
            value={[preferences.lineHeight]}
            onValueChange={(v) =>
              onChange({ lineHeight: Math.round(v[0] * 10) / 10 })
            }
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label
                htmlFor={`${idPrefix}-letter-spacing`}
                className="text-sm font-medium"
              >
                Letter spacing
              </label>
              <InfoIcon
                text={INFO_TEXT.letterSpacing}
                label="letter spacing"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {preferences.letterSpacing}px
            </span>
          </div>
          <Slider
            id={`${idPrefix}-letter-spacing`}
            aria-label="Letter spacing"
            min={SLIDER_RANGES.letterSpacing.min}
            max={SLIDER_RANGES.letterSpacing.max}
            step={SLIDER_RANGES.letterSpacing.step}
            value={[preferences.letterSpacing]}
            onValueChange={(v) => onChange({ letterSpacing: v[0] })}
          />
        </div>
      </div>

      {/* Background */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium">Background color</span>
          <InfoIcon
            text={INFO_TEXT.backgroundColor}
            label="background color"
          />
        </div>
        <SwatchPicker
          label="Background color"
          options={BACKGROUND_OPTIONS}
          value={preferences.backgroundColor}
          onChange={(next) =>
            onChange({
              backgroundColor: next,
              textColor: suggestTextColor(next),
            })
          }
          idPrefix={`${idPrefix}-bg`}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Selected: {getBackgroundHex(preferences.backgroundColor)}
        </p>
      </div>

      {/* Text */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium">Text color</span>
          <InfoIcon text={INFO_TEXT.textColor} label="text color" />
        </div>
        <SwatchPicker
          label="Text color"
          options={TEXT_OPTIONS}
          value={preferences.textColor}
          onChange={(next) => onChange({ textColor: next })}
          isText
          idPrefix={`${idPrefix}-text`}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Selected: {getTextHex(preferences.textColor)} ·{" "}
          <span
            style={{ fontFamily: getFontCssFamily(preferences.fontFamily) }}
          >
            Sample
          </span>
        </p>
      </div>
    </div>
  );
}
