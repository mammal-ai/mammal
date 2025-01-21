import { createEffect, createSignal } from "solid-js";
import { Button } from "../shadcn/components/Button";
import {
  ChatMessageRole,
  getMessage,
  MessageData,
} from "../state/MessagesContext";
import MPTreeNode from "../util/tree/MPTreeNode";

const DEFAULT_HEIGHT = "1.2em";

const debounce = (fn: () => void, ms: number) => {
  let timeout: number;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(fn, ms);
  };
};

type EditDialogProps = {
  treeId: string | null;
  onHide: () => void;
  onEdit: (
    treeId: string,
    message: string,
    role: ChatMessageRole
  ) => Promise<void>;
};
const EditDialog = (props: EditDialogProps) => {
  let $textareaRef: HTMLTextAreaElement;
  const [input, setInput] = createSignal("");
  const [currentNode, setCurrentNode] =
    createSignal<MPTreeNode<MessageData> | null>(null);

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

  createEffect(async () => {
    const node = await getMessage(props.treeId || "");
    setCurrentNode(node);
    if (node) {
      setInput(node.data.message);
    }
  });

  const onSubmit = async () => {
    const n = currentNode();
    if (!n || !props.treeId) {
      console.error("treeId", props.treeId);
      console.error("node", n);
      throw "currentNode/treeId is null so what are we editing?";
    }
    await props.onEdit(props.treeId, input(), n.data.role);
    props.onHide();
  };

  return (
    <div
      class="absolute inset-0 px-24 bg-background/70 flex justify-center items-center"
      style={{
        opacity: props.treeId === null ? 0 : 1,
        transition: "opacity 300ms ease-in-out",
        "pointer-events": props.treeId === null ? "none" : "auto",
        "z-index": 2,
      }}
      onClick={props.onHide}
    >
      <div class="flex flex-col w-full">
        {/* @ts-ignore */}
        <textarea
          ref={$textareaRef}
          value={input()}
          onChange={(e) => {
            setInput(e.currentTarget.value);
            fixHeight();
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyUp={fixHeight}
          onBlur={fixHeight}
          class="mb-4 p-4 rounded-lg shadow border min-h-16"
        />
        <div
          class="flex flex-row justify-end space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button onClick={onSubmit}>Save</Button>
          <Button variant={"outline"} onClick={props.onHide}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
export default EditDialog;
