import { useMemo } from "react";
import { Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useReadingPreferences } from "@/hooks/useReadingPreferences";
import {
  BACKGROUND_OPTIONS,
  FONT_OPTIONS,
  INFO_TEXT,
  SAMPLE_VERSE,
  SLIDER_RANGES,
  TEXT_OPTIONS,
  THEME_PRESETS,
  getBackgroundHex,
  getFontCssFamily,
  getTextHex,
  preferencesToCssVars,
  suggestTextColor,
  type ColorOption,
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
}: {
  options: ColorOption[];
  value: string;
  onChange: (next: string) => void;
  label: string;
  isText?: boolean;
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

export default function SettingsPage() {
  const { preferences, setPreferences, resetPreferences, applyPreset } =
    useReadingPreferences();

  const previewStyle = useMemo(
    () => preferencesToCssVars(preferences) as React.CSSProperties,
    [preferences],
  );

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Reading Preferences
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalize how memorization text looks. Changes apply everywhere
            you read or memorize.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetPreferences}
          className="reading-focus shrink-0"
        >
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          Reset
        </Button>
      </div>

      {/* Quick themes */}
      <section aria-labelledby="quick-themes-heading" className="mb-8">
        <h2
          id="quick-themes-heading"
          className="mb-3 text-sm font-medium text-muted-foreground"
        >
          Quick Themes
        </h2>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset.prefs)}
              className="reading-focus"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </section>

      {/* Live preview */}
      <section aria-labelledby="preview-heading" className="mb-8">
        <h2 id="preview-heading" className="sr-only">
          Live preview
        </h2>
        <div
          className="reading-surface rounded-lg border p-6 shadow-sm"
          style={previewStyle}
          aria-live="polite"
        >
          <p className="reading-text">{SAMPLE_VERSE}</p>
        </div>
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        {/* Font family */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <label
              htmlFor="font-family"
              className="text-sm font-medium"
            >
              Font
            </label>
            <InfoIcon text={INFO_TEXT.fontFamily} label="font" />
          </div>
          <select
            id="font-family"
            value={preferences.fontFamily}
            onChange={(e) =>
              setPreferences({ fontFamily: e.target.value })
            }
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
                  onClick={() =>
                    setPreferences({ fontFamily: font.value })
                  }
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
                <label htmlFor="font-size" className="text-sm font-medium">
                  Font size
                </label>
                <InfoIcon text={INFO_TEXT.fontSize} label="font size" />
              </div>
              <span className="text-sm text-muted-foreground">
                {preferences.fontSize}px
              </span>
            </div>
            <Slider
              id="font-size"
              aria-label="Font size"
              min={SLIDER_RANGES.fontSize.min}
              max={SLIDER_RANGES.fontSize.max}
              step={SLIDER_RANGES.fontSize.step}
              value={[preferences.fontSize]}
              onValueChange={(v) => setPreferences({ fontSize: v[0] })}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor="line-height" className="text-sm font-medium">
                  Line height
                </label>
                <InfoIcon text={INFO_TEXT.lineHeight} label="line height" />
              </div>
              <span className="text-sm text-muted-foreground">
                {preferences.lineHeight.toFixed(1)}
              </span>
            </div>
            <Slider
              id="line-height"
              aria-label="Line height"
              min={SLIDER_RANGES.lineHeight.min}
              max={SLIDER_RANGES.lineHeight.max}
              step={SLIDER_RANGES.lineHeight.step}
              value={[preferences.lineHeight]}
              onValueChange={(v) =>
                setPreferences({
                  lineHeight: Math.round(v[0] * 10) / 10,
                })
              }
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="letter-spacing"
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
              id="letter-spacing"
              aria-label="Letter spacing"
              min={SLIDER_RANGES.letterSpacing.min}
              max={SLIDER_RANGES.letterSpacing.max}
              step={SLIDER_RANGES.letterSpacing.step}
              value={[preferences.letterSpacing]}
              onValueChange={(v) =>
                setPreferences({ letterSpacing: v[0] })
              }
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
              setPreferences({
                backgroundColor: next,
                textColor: suggestTextColor(next),
              })
            }
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
            onChange={(next) => setPreferences({ textColor: next })}
            isText
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Selected: {getTextHex(preferences.textColor)} ·{" "}
            <span style={{ fontFamily: getFontCssFamily(preferences.fontFamily) }}>
              Sample
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
