import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  RefreshCw,
  ShieldPlus,
  Trash2,
} from "lucide-solid";
import hljs from "highlight.js";
import { Remarkable } from "remarkable";
import {
  createResource,
  createSignal,
  JSX,
  onMount,
  Show,
  Suspense,
} from "solid-js";
import "highlight.js/styles/github.css";
import {
  cascadeDelete,
  getMessage,
  MessageData,
  setActiveMessage,
  setThreadFor,
} from "../state/MessagesContext";
import MPTreeNode from "../util/tree/MPTreeNode";
import { getParentId } from "../util/tree/treeUtils";
import { variableRegex } from "../util/messageVariables";

const [mousePosition, setMousePosition] = createSignal([0, 0]);

document.addEventListener("mousemove", (e) => {
  setMousePosition([e.clientX, e.clientY]);
});

const getHoveredElement = () => {
  const [x, y] = mousePosition();
  return document.elementFromPoint(x, y);
};

const highlightMessageVariables = (msg: string) => {
  return msg.replace(
    variableRegex,
    `<span class="__mammal_variable__">$1</span>`
  );
};

const renderThinking = (
  msg: string,
  md: { render: (msg: string) => string }
) => {
  const trimmed = msg.trim();
  if (trimmed.startsWith("<think>")) {
    const [thinking, rest] = trimmed
      .slice("<think>".length)
      .split("</think>", 2);
    return (
      `<div class="__thinking__">\n\n${md.render(thinking)}\n\n</div>` +
      md.render(rest)
    );
  }
  return md.render(msg);
};

const md = new Remarkable({
  typographer: true,
  html: false,
});

const mdWithHighlights = new Remarkable({
  typographer: true,
  html: false,
  highlight: (code: string, language: string) => {
    if (language && hljs.getLanguage(language)) {
      try {
        return hljs.highlight(code, { language }).value;
      } catch (err) {
        console.error(err);
      }
    }

    try {
      return hljs.highlightAuto(code).value;
    } catch (err) {}

    return ""; // use external default escaping
  },
});

const tryDelete = (treeId: string) => async () => {
  const sure = await window.confirm(
    "Are you sure you want to delete this message and all subsequent replies?"
  );
  if (!sure) {
    return;
  }
  await cascadeDelete(treeId);

  const parentId = getParentId(treeId);
  if (parentId === null) {
    console.error(
      "Couldn't reset active message because parent could not be found",
      parentId
    );
    return;
  }
  const parentNode = await getMessage(parentId);
  if (parentNode === null) {
    console.error(
      "Couldn't reset active message because parent node could not be found",
      parentId
    );
    return;
  }
  // TODO: If top-level message deleted but it has a sibling, show a sibling...
  setActiveMessage(parentNode);
};

type MessageButtonsProps = {
  show: boolean;
  align: "LEFT" | "RIGHT";
  children: JSX.Element;
};
const MessageButtons = (props: MessageButtonsProps) => (
  <div
    class={
      "absolute px-2 z-10 bottom-[-0.5rem] min-w-full flex flex-row justify-end " +
      (props.align === "LEFT" ? "left-0" : "right-0")
    }
  >
    <div
      class="h-[1.8rem] flex flex-row items-center justify-end space-x-2 bg-background px-[1rem] text-sm text-gray-400 rounded-full shadow-sm"
      style={{
        opacity: props.show ? 1 : 0,
        transform: props.show ? "" : "translateX(1rem)",
        transition: "opacity 300ms ease-in-out, transform 300ms ease-in-out",
      }}
    >
      {props.children}
    </div>
  </div>
);

type DirectionButtonsProps = {
  treeId?: string;
};
const DirectionButtons = (props: DirectionButtonsProps) => {
  const [siblings] = createResource(async () => {
    if (!props.treeId) {
      return [];
    }
    const message = await getMessage(props.treeId);
    if (!message) {
      return [];
    }
    const siblings = await message.getSiblings(true);
    return siblings;
  });

  const index = () => {
    const i = siblings()?.findIndex((n) => n.path === props.treeId) || -1;
    return i === -1 ? 0 : i;
  };
  const siblingCount = () => (siblings()?.length || 1) - 1;
  const position = () =>
    siblingCount() > 1 ? `${index() + 1}/${siblingCount() + 1}` : "1";

  const goToSibling = (forward: boolean) => () => {
    const currentSiblings = siblings();
    if (!currentSiblings) {
      throw "Siblings array not loaded...";
    }
    const currentIndex = currentSiblings.findIndex(
      (n) => n.path === props.treeId
    );
    if (currentIndex === -1) {
      throw "Couldn't find current node among siblings";
    }
    const newIndex = currentIndex + (forward ? 1 : -1);
    if (newIndex < 0 || newIndex >= currentSiblings.length) {
      throw "Invalid new index";
    }
    const newTreeId = currentSiblings[newIndex].path;
    setThreadFor(newTreeId);
  };

  return (
    <>
      <button
        class="active:scale-90 hover:text-gray-600 disabled:text-gray-200"
        disabled={index() === 0}
        onClick={goToSibling(false)}
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
      <span>{position()}</span>
      <button
        class="active:scale-90 hover:text-gray-600 disabled:text-gray-200"
        disabled={index() === siblingCount()}
        onClick={goToSibling(true)}
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </>
  );
};

type AssistantMessageButtonsProps = {
  treeId?: string;
  model: string;
  onRegenerate: (treeId: string) => void;
};
const AssistantMessageButtons = (props: AssistantMessageButtonsProps) => {
  return (
    <>
      <button class="active:scale-90 hover:text-gray-600 flex flex-row items-center whitespace-nowrap overflow-hidden ellipsis">
        {props.model}
        <ChevronDown class="w-4 h-4" />
      </button>
      {/* TODO: only show if message has siblings (i.e., only allow deleting this message if there are other replies to the parent, because how else would you trigger a re-generate?) */}
      <button
        class="active:scale-90 hover:text-red-600"
        onClick={tryDelete(props?.treeId || "")}
      >
        <Trash2 class="w-4 h-4" />
      </button>
      <button
        class="active:scale-90 hover:text-gray-600"
        onClick={() => props.treeId && props.onRegenerate(props.treeId)}
      >
        <RefreshCw class="w-4 h-4" />
      </button>
      <DirectionButtons treeId={props.treeId} />
    </>
  );
};

type UserMessageButtonsProps = {
  // model: string
  treeId?: string;
  onEdit: () => void;
  onUseAsChallenge: () => void;
};
const UserMessageButtons = (props: UserMessageButtonsProps) => {
  return (
    <>
      <button
        class="active:scale-90 hover:text-green-600"
        onClick={props.onUseAsChallenge}
      >
        <ShieldPlus class="w-4 h-4" />
      </button>
      <button
        class="active:scale-90 hover:text-red-600"
        onClick={tryDelete(props?.treeId || "")}
      >
        <Trash2 class="w-4 h-4" />
      </button>
      <button
        class="active:scale-90 hover:text-gray-600"
        onClick={props.onEdit}
      >
        <Edit class="w-4 h-4" />
      </button>
      <DirectionButtons treeId={props.treeId} />
    </>
  );
};

type MarkdownBodyProps = {
  innerHTML: string;
  class: string;
  message: MPTreeNode<MessageData> | null;
  onRegenerate: (treeId: string) => void;
  onEdit: () => void;
  onUseAsChallenge: () => void;
};
const MarkdownBody = (props: MarkdownBodyProps) => {
  const [isHovered, setIsHovered] = createSignal(true);
  let $mdBody: HTMLDivElement | undefined = undefined;

  onMount(() => {
    let timer = setTimeout(() => {
      // @ts-ignore
      setIsHovered($mdBody?.contains(getHoveredElement()));
    }, 1000);
    return () => clearTimeout(timer);
  });

  return (
    <div
      ref={$mdBody}
      class={"relative px-6 py-4 rounded-lg " + props.class}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div class={`text-lg markdown-body`} innerHTML={props.innerHTML} />
      <MessageButtons
        show={isHovered()}
        align={props.message?.data.role === "assistant" ? "LEFT" : "RIGHT"}
      >
        <Show when={props.message?.data.role === "user"}>
          <UserMessageButtons
            treeId={props.message?.path}
            onEdit={props.onEdit}
            onUseAsChallenge={props.onUseAsChallenge}
          />
        </Show>
        <Show
          when={
            props.message?.data.role === "assistant" &&
            props.message?.data.metadata?.model
          }
        >
          <AssistantMessageButtons
            onRegenerate={props.onRegenerate}
            treeId={props.message?.path}
            model={props.message?.data.metadata?.model!}
          />
        </Show>
      </MessageButtons>
    </div>
  );
};

const roles = {
  unknown: {
    container: "justify-start",
    message: "bg-amber-200 text-gray-800",
  },
  user: {
    container: "justify-end ms-20",
    message: "bg-primary text-primary-foreground",
  },
  assistant: {
    container: "justify-start me-8",
    message: "bg-secondary text-secondary-foreground",
  },
};

const getRole = (role: string) =>
  role in roles ? roles[role as keyof typeof roles] : roles.unknown;

interface IndividualMessageProps {
  id: string;
  message: string;
  role: string;
  onRegenerate: (treeId: string) => void;
  onEdit: () => void;
  onUseAsChallenge: () => void;
}
const IndividualMessage = (props: IndividualMessageProps) => {
  const roleClasses = () => getRole(props.role);

  const [messageData] = createResource(async () => {
    return await getMessage(props.id);
  });

  // scope debounce to the component so that multiple instances can run
  let debounceTrigger: number;
  function debounce<T>(fn: Function, ms: number) {
    return (...args: unknown[]) =>
      new Promise<T>((resolve) => {
        if (debounceTrigger) {
          clearTimeout(debounceTrigger);
        }
        debounceTrigger = window.setTimeout(() => {
          clearTimeout(debounceTrigger);
          resolve(fn(...args));
        }, ms);
      });
  }

  const [highlightedMd] = createResource<string, string, unknown>(
    () => props.message,
    debounce<string>(
      (source: string) => renderThinking(source, mdWithHighlights),
      120
    )
  );

  return (
    <div class={`flex flex-row ${roleClasses().container}`}>
      {props.role === "assistant" && (
        <div class="p-4">
          <Bot class="w-6 h-6" />
        </div>
      )}
      <Suspense
        fallback={
          <MarkdownBody
            message={messageData() || null}
            class={roleClasses().message}
            innerHTML={renderThinking(props.message, md)}
            onRegenerate={props.onRegenerate}
            onEdit={props.onEdit}
            onUseAsChallenge={props.onUseAsChallenge}
          />
        }
      >
        <MarkdownBody
          message={messageData() || null}
          class={roleClasses().message}
          innerHTML={highlightedMd() || ""}
          onRegenerate={props.onRegenerate}
          onEdit={props.onEdit}
          onUseAsChallenge={props.onUseAsChallenge}
        />
      </Suspense>
    </div>
  );
};
export default IndividualMessage;
