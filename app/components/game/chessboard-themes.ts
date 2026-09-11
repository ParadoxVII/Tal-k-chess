/**
 * Chessboard themes: each theme defines colors for light/dark squares,
 * pieces, highlights, and other board elements.
 */

export type ChessboardTheme = {
  name: string;
  label: string;
  board: {
    lightSquare: string;
    darkSquare: string;
  };
  pieces: {
    light: string;
    dark: string;
  };
  highlight: {
    selected: string;
    lastMove: string;
  };
  border: string;
};

export const chessboardThemes: Record<string, ChessboardTheme> = {
  classic: {
    name: "classic",
    label: "Classic",
    board: {
      lightSquare: "#e8f0e9",
      darkSquare: "#7ca895",
    },
    pieces: {
      light: "#ffffff",
      dark: "#2c2c2c",
    },
    highlight: {
      selected: "#bada55",
      lastMove: "#baca44",
    },
    border: "#8b7355",
  },
  blue: {
    name: "blue",
    label: "Blue",
    board: {
      lightSquare: "#dee3e6",
      darkSquare: "#8ca8d8",
    },
    pieces: {
      light: "#ffffff",
      dark: "#1a1a2e",
    },
    highlight: {
      selected: "#a7d8ff",
      lastMove: "#6ba3d8",
    },
    border: "#4a5f8f",
  },
  green: {
    name: "green",
    label: "Green",
    board: {
      lightSquare: "#e8e8e8",
      darkSquare: "#5d8e5d",
    },
    pieces: {
      light: "#ffffff",
      dark: "#1b1b1b",
    },
    highlight: {
      selected: "#9dd89d",
      lastMove: "#6ba86b",
    },
    border: "#3d5f3d",
  },
  dark: {
    name: "dark",
    label: "Dark",
    board: {
      lightSquare: "#2b2b2b",
      darkSquare: "#1a1a1a",
    },
    pieces: {
      light: "#e0e0e0",
      dark: "#6c857d",
    },
    highlight: {
      selected: "#4a7c59",
      lastMove: "#3d6b52",
    },
    border: "#0d0d0d",
  },
  solar: {
    name: "solar",
    label: "Solar",
    board: {
      lightSquare: "#fdf6e3",
      darkSquare: "#d4ac0d",
    },
    pieces: {
      light: "#ffffff",
      dark: "#002b36",
    },
    highlight: {
      selected: "#eee8d5",
      lastMove: "#b58900",
    },
    border: "#93a1a1",
  },
};

export const defaultChessboardTheme = "classic";
export const availableChessboardThemes = Object.keys(chessboardThemes);
