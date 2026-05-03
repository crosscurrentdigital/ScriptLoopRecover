import React from "react";
import { LogoTile, MarkProps } from "./_LogoTile";
import { BrandMark } from "./_BrandMark";

const Mark: React.FC<MarkProps> = (props) => <BrandMark {...props} />;

export function VerticalMobius() {
  return (
    <LogoTile
      Mark={Mark}
      caption="Variation C — Wrapped Möbius S. LOCKED IN as the ScriptLoop brand mark."
    />
  );
}
