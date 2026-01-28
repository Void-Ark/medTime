import React from "react";
import { Text, TextProps } from "react-native";

// Save original Text render
const TextRender = (Text as any).render;

export function overrideTextDefaultFont(defaultFont: string) {
  // Patch RN Text render to always apply font
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Text as any).render = function render(props: TextProps, ref: any) {
    const { style, ...rest } = props;
    return TextRender.apply(this, [
      {
        ...rest,
        style: [{ fontFamily: defaultFont }, style],
      },
      ref,
    ]);
  };
}
