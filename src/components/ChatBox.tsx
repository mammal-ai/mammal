import { Paperclip, Send } from "lucide-solid";
import { Button } from "../shadcn/components/Button";
import { createSignal } from "solid-js";
import { ModelSelectorDropdown } from "./ModelSelectorDropdown";
import { ModelParametersDropdown } from "./ModelParametersDropdown";
import { model } from "../state/ModelSettingsContext";
import { isReadyForDrop } from "../state/DropReadyProvider";
import { open } from "@tauri-apps/plugin-dialog";
import { getAttachmentTemplate, readDocument } from "../util/attach";

const DEFAULT_HEIGHT = "1.2em";
const FILE_ATTACHMENT_FILTERS = [
  {
    name: "All Supported Files",
    // extensions: ["docx", "pdf", "txt", "csv", "md", "json"],
    extensions: ["docx", "txt", "csv", "md", "json"],
  },
  { name: "Word Documents", extensions: ["docx"] },
  // { name: "PDF Documents", extensions: ["pdf"] },
  { name: "Text Documents", extensions: ["txt", "csv", "md", "json"] },
  { name: "All Files", extensions: ["*"] },
];

const debounce = (fn: () => void, ms: number) => {
  let timeout: number;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, ms);
  };
};

interface ChatBoxProps {
  show: boolean;
  onSubmit: (msg: string) => void;
  onAttach: (msg: string) => void;
}
const ChatBox = (props: ChatBoxProps) => {
  let $textareaRef: HTMLTextAreaElement;
  const [isFocused, setIsFocused] = createSignal(false);
  const [input, setInput] = createSignal("");

  const fixHeight = debounce(() => {
    if (!$textareaRef) {
      return;
    }
    $textareaRef.style.height = DEFAULT_HEIGHT;
    requestAnimationFrame(() => {
      const maxHeight = window.innerHeight / 3;
      const idealHeight = Math.min($textareaRef.scrollHeight, maxHeight);
      $textareaRef.style.height = idealHeight + "px";
    });
  }, 10);
  fixHeight();

  const submitHandler = (msg: string) => {
    if (!model()) {
      throw new Error("No model selected");
    }
    props.onSubmit(msg.replace(/\n$/, ""));
    $textareaRef.value = "";
    setInput("");
  };

  const keyUpHandler = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitHandler((e.target as HTMLTextAreaElement).value);
    }
    fixHeight();
  };

  return (
    <form
      class="absolute left-0 right-0 bottom-0 px-10 pb-6 z-10"
      style={{
        transform: props.show ? "translateY(0)" : "translateY(100%)",
        transition: "transform 120ms ease-in-out",
      }}
      onSubmit={() => submitHandler(input())}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div
        class={`left-0 bottom-0 w-full flex flex-col z-20 bg-background p-4 shadow-lg
      rounded-xl border bg-card text-card-foreground shadow cursor-text
      ${isFocused() ? "ring-2 ring-ring ring-offset-2" : ""}`}
        onClick={() => $textareaRef.focus()}
      >
        <textarea
          // @ts-ignore
          ref={$textareaRef}
          class="bg-transparent focus:outline-none px-1 mb-1"
          value={input()}
          onChange={(e) => {
            setInput(e.currentTarget.value);
            fixHeight();
          }}
          onKeyUp={keyUpHandler}
          onBlur={fixHeight}
          style={{ resize: "none", height: DEFAULT_HEIGHT }}
        />
        <div class="flex flex-row mt-2 space-x-2">
          <ModelSelectorDropdown />
          <ModelParametersDropdown />
          <div class="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            style={{
              transition: "transform 300ms ease, opacity 300ms ease",
              ...(isReadyForDrop()
                ? {
                    // can't include `scale` here because it will override the `active:scale-90` class
                    opacity: "1",
                    pointerEvents: "auto",
                  }
                : {
                    transform: "scale(0.4)",
                    opacity: "0",
                    pointerEvents: "none",
                  }),
            }}
            onClick={async () => {
              const file = await open({
                multiple: false,
                directory: false,
                filters: FILE_ATTACHMENT_FILTERS,
              });
              if (file) {
                const doc = await readDocument(file);
                const message = getAttachmentTemplate(file, doc);
                props.onAttach(message);
              }
            }}
          >
            <Paperclip />
          </Button>
          <Button type="submit" variant="outline">
            <Send />
            Send
          </Button>
        </div>
      </div>
    </form>
  );
};
export default ChatBox;
