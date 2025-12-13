import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a;
    color: #f5f5f5;
    overflow: hidden;
    height: 100vh;
  }

  #root {
    height: 100vh;
    width: 100vw;
  }

  canvas {
    outline: none;
  }

  ::-webkit-file-upload-button {
    display: none;
  }
`;
