/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import "./index.css";
import { initLlm } from "./util/llm";

initLlm();

const __tauriWindow = window as {
    enableCORSFetch?: (v: boolean) => void;
};
if (__tauriWindow?.enableCORSFetch) {
    __tauriWindow.enableCORSFetch(true);
}

// // Setup CSS Variable: --scrollbar-width
// {
//     let scrollbarWidth = 0;
//     const scrollDiv = document.createElement("div");
//     scrollDiv.style.position = "absolute";
//     scrollDiv.style.left = "-9999px";
//     scrollDiv.style.width = "100px";
//     scrollDiv.style.height = "100px";
//     scrollDiv.style.overflow = "scroll";

//     document.body.appendChild(scrollDiv);
//     scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
//     document.body.removeChild(scrollDiv);

//     document.documentElement.style.setProperty(
//         "--scrollbar-width",
//         scrollbarWidth + "px"
//     );
// }

render(() => <App />, document.getElementById("root") as HTMLElement);
