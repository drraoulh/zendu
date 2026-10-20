import React from "react";
import { Composition, Folder } from "remotion";
import { durationInFrames, FPS } from "./copy";
import { Launch } from "./Launch";
import { fontsReady } from "./theme";

// La police DM Sans est chargée avant le rendu de la première image.
void fontsReady;

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="Lancement">
      <Composition id="LaunchFR" component={Launch} width={1080} height={1920} fps={FPS} durationInFrames={durationInFrames("fr")} defaultProps={{ lang: "fr" as const }} />
      <Composition id="LaunchEN" component={Launch} width={1080} height={1920} fps={FPS} durationInFrames={durationInFrames("en")} defaultProps={{ lang: "en" as const }} />
    </Folder>
  );
};
