import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: "#e1f0ff",
      100: "#b3d5ff",
      200: "#80b9ff",
      300: "#4d9dff",
      400: "#1a81ff",
      500: "#3E79BD", // <-- Your main brand color
      600: "#03488c",
      700: "#02366c",
      800: "#01244c",
      900: "#00122c",
    },
    secondary: {
      50: "#F9C515",
    },
  },
  fonts: {
    heading: `'Lexend Deca', sans-serif`,
    body: `'Lexend Deca', sans-serif`,
  },
});

export default theme;
