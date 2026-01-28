export default function getRandomColor(mode: "light" | "dark" = "light") {
  // Generate R, G, B values between 0–255
  let r = Math.floor(Math.random() * 256);
  let g = Math.floor(Math.random() * 256);
  let b = Math.floor(Math.random() * 256);

  if (mode === "light") {
    // Boost brightness → push towards 200–255
    r = Math.floor((r + 255) / 2);
    g = Math.floor((g + 255) / 2);
    b = Math.floor((b + 255) / 2);
  } else if (mode === "dark") {
    // Reduce brightness → push towards 0–100
    r = Math.floor(r / 2);
    g = Math.floor(g / 2);
    b = Math.floor(b / 2);
  }

  // Convert to hex string
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Example usage:
console.log(getRandomColor("light")); // → "#d8f0e9"
console.log(getRandomColor("dark")); // → "#2a1c3f"
