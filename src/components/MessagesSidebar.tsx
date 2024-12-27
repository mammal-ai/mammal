import { createSignal, For, Setter, Show } from "solid-js";
// import {
//     Switch,
//     SwitchControl,
//     SwitchThumb,
//     SwitchLabel
// } from "../shadcn/components/Switch";
import { TextField } from "./TextField";
import { cascadeDelete, rootNodes, setActiveThread, isAncestorOfActiveThread } from "../state/MessagesContext";
import { Button } from "../shadcn/components/Button";
import { Delete, Trash2 } from "lucide-solid";
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import MessageListButton from "./MessageListButton";
import SearchResultsList from "./SearchResultsList";
import { getParentId } from "../util/tree/treeUtils";
dayjs.extend(relativeTime);

type SidebarHeaderProps = {
    query: string
    setQuery: Setter<string>
}
const SidebarHeader = (props: SidebarHeaderProps) => {
    return (<div class="flex flex-col w-full bg-gray-50 p-4 space-y-4 items-center justify-between relative border-b-[1px] border-b-gray-200">
        <div class="w-full flex flex-row justify-between items-center">
            <div class="flex-1 text-base font-bold text-foreground">
                Conversations
            </div>

            {/* <Switch class="flex items-center space-x-2">
                <SwitchLabel class="text-sm leading-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70">
                    Archived
                </SwitchLabel>
                <SwitchControl>
                    <SwitchThumb />
                </SwitchControl>
            </Switch> */}
        </div>
        <div class="w-full flex relative">
            <TextField
                class="h-8 w-full bg-background shadow-none"
                placeholder="Type to search..."
                value={props.query}
                setValue={props.setQuery}
            />
            <div class="absolute right-0 top-0 h-full flex items-center justify-center p-2" style={
                props.query.length === 0 ? {
                    transform: "scale(0.4)",
                    opacity: 0
                } : {
                    transition: "transform 300ms ease-in-out, opacity 300ms ease-in-out",
                }}>
                <button onClick={() => props.setQuery("")}>
                    <Delete class="w-4 h-4 text-gray-400 hover:text-gray-600 active:text-gray-900" />
                </button>
            </div>
        </div>
    </div>)
}

const formatDateTime = (date: string) => {
    // dayjs().toNow(); // "31 years ago"
    return dayjs(date).fromNow();
}

type MessageLinkProps = {
    id: string
    title: string
    message: string
    date: string
    onClick: () => void
}
const MessageLink = (props: MessageLinkProps) => {
    const [isHovered, setIsHovered] = createSignal(false);
    const onDelete = async (e: MouseEvent) => {
        e.preventDefault();
        const sure = await confirm("Are you sure you want to delete this message?");
        if (sure) {
            cascadeDelete(getParentId(props.id) || props.id)
        }
    }
    return (
        <MessageListButton
            active={isAncestorOfActiveThread(props.id)}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
            onClick={props.onClick}
        >
            <div class="flex-1 flex flex-col p-4 items-start gap-2">
                <div class="flex flex-row w-full items-center gap-2">
                    <span class="flex-1 font-bold whitespace-break-spaces truncate line-clamp-1 text-left">{props.title}</span>
                    <span class="ml-auto text-xs whitespace-nowrap">{formatDateTime(props.date)}</span>
                </div>
                <span class="text-left font-medium line-clamp-2 h-[2.25rem]">{props.message}</span>
            </div>
            <div class="flex-0 flex flex-col item-center justify-center h-full" style={{
                ...(isHovered() ? { width: "3rem" } : { width: "0rem" }),
                transition: "width 200ms",
                overflow: "hidden",
            }}>
                <div class="p-1">
                    <Button variant={"outline"} size={"icon"} onClick={onDelete}>
                        <Trash2 class="text-red-500" />
                    </Button>
                </div>
            </div>
        </MessageListButton >
    )
}

const MessagesSidebar = (props: { isOpen: boolean }) => {
    const [query, setQuery] = createSignal("");
    return (
        <div class={`transition-all duration-300 overflow-x-hidden ${props.isOpen ? 'w-[300px]' : 'w-0'}`}>
            <div class="flex flex-col w-full bg-sidebar-background h-full border-r border-border">
                <SidebarHeader query={query()} setQuery={setQuery} />
                <div class="flex-1 overflow-y-auto overflow-x-hidden">
                    {/* <MessagesList /> */}
                    <Show when={query().length === 0}>
                        <For each={rootNodes().reverse()}>
                            {node => <MessageLink
                                id={node.path}
                                title={node.title || ""}
                                message={node.firstMessage.message}
                                date={node.firstMessage.createdAt}
                                onClick={() => setActiveThread(node.path)}
                            />}
                        </For>
                    </Show>
                    <Show when={query().length > 0}>
                        <SearchResultsList
                            query={query()}
                            setQuery={setQuery}
                        />
                    </Show>
                </div>
            </div>
        </div>
    );
}
export default MessagesSidebar