import { Application } from "pixi.js";

const app = new Application();

await app.init({
  background: "#1a1a2e",
  resizeTo: window,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.canvas);
