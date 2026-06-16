import { Composition } from "remotion";

const Hello: React.FC = () => (
  <div style={{ flex: 1, background: "#0A2540", color: "white", fontSize: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
    ParkMath
  </div>
);

export const RemotionRoot: React.FC = () => (
  <Composition id="Hello" component={Hello} durationInFrames={30} fps={30} width={1080} height={1920} />
);
