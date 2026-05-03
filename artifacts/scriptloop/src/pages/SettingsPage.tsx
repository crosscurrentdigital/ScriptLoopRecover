import { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReadingPreferences } from "@/hooks/useReadingPreferences";
import {
  SAMPLE_VERSE,
  THEME_PRESETS,
  preferencesToCssVars,
} from "@/lib/reading-preferences";
import { ReadingPreferencesControls } from "@/components/ReadingPreferencesControls";

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
            Personalize how memorization text looks. These are your global
            defaults — individual scripts can opt into their own override
            from the script page.
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

      <ReadingPreferencesControls
        preferences={preferences}
        onChange={setPreferences}
        idPrefix="global"
      />
    </main>
  );
}
