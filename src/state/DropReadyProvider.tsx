import { invoke } from "@tauri-apps/api/core";
import { createSignal } from "solid-js"

const [isReadyForDrop, setIsReadyForDrop] = createSignal<boolean>(false);

(async () => {
    console.log("PANDOC: Initializing...");
    await invoke("init_pandoc");
    console.log("PANDOC: Ready!");
    setIsReadyForDrop(true);
})();

export { isReadyForDrop }