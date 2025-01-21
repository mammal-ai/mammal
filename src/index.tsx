/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import "./index.css";
import { initLlm } from "./util/llm";

const __tauriWindow = window as {
  enableCORSFetch?: (v: boolean) => void;
};
if (__tauriWindow?.enableCORSFetch) {
  __tauriWindow.enableCORSFetch(true);
}

// Must run after `enableCORSFetch`
initLlm();

render(() => <App />, document.getElementById("root") as HTMLElement);
