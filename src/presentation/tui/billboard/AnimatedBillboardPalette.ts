const AnimatedBillboardBaseColors = {
  Blue: "#66b4f4",
  BlueBorder: "#236ca8",
  Purple: "#aa00d4",
  PurpleBorder: "#6d0089",
  Red: "#ff2a2a",
  RedBorder: "#b11226",
  Orange: "#ff8307",
  OrangeBorder: "#b65300",
  Yellow: "#ffcc00",
  YellowBorder: "#a67c00",
  Green: "#44aa00",
  GreenBorder: "#2a6f00",
  Magenta: "#ff00aa",
  MagentaBorder: "#a80071",
} as const;

export const AnimatedBillboardPalette = [
  {
    name: "Blue",
    fill: AnimatedBillboardBaseColors.Blue,
    border: AnimatedBillboardBaseColors.BlueBorder,
  },
  {
    name: "Purple",
    fill: AnimatedBillboardBaseColors.Purple,
    border: AnimatedBillboardBaseColors.PurpleBorder,
  },
  {
    name: "Red",
    fill: AnimatedBillboardBaseColors.Red,
    border: AnimatedBillboardBaseColors.RedBorder,
  },
  {
    name: "Orange",
    fill: AnimatedBillboardBaseColors.Orange,
    border: AnimatedBillboardBaseColors.OrangeBorder,
  },
  {
    name: "Yellow",
    fill: AnimatedBillboardBaseColors.Yellow,
    border: AnimatedBillboardBaseColors.YellowBorder,
  },
  {
    name: "Green",
    fill: AnimatedBillboardBaseColors.Green,
    border: AnimatedBillboardBaseColors.GreenBorder,
  },
  {
    name: "Magenta",
    fill: AnimatedBillboardBaseColors.Magenta,
    border: AnimatedBillboardBaseColors.MagentaBorder,
  },
] as const;

export type AnimatedBillboardColorPair =
  (typeof AnimatedBillboardPalette)[number];
