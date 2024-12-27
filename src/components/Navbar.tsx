import { PanelLeft, MessageSquarePlus } from "lucide-solid"
import { Button } from "../shadcn/components/Button"
import db from "../store/db"
import { activeMessage, updateThreadTitle } from "../state/MessagesContext"
import { createEffect, createSignal, Show } from "solid-js"
import { TextField } from "./TextField"


type NavbarProps = {
    toggleSidebar: () => void
    onNewChat: () => void
}
const Navbar = (props: NavbarProps) => {
    let $textField: HTMLInputElement;
    const [title, setTitle] = createSignal("")
    const [editTitleMode, setEditTitleMode] = createSignal(false)
    const [editableTitle, setEditableTitle] = createSignal("")

    createEffect(async () => {
        const id = activeMessage()?.path.split(".")[0]
        if (id) {
            let newTitle = "Unkown Title"
            try {
                const storedNewTitle = await db.select<{ title: string }>("SELECT title FROM thread_titles WHERE id = $1", [id])
                newTitle = storedNewTitle[0]?.title || newTitle
            }
            catch (e) {
                console.error(e)
            }
            setTitle(newTitle)
            setEditableTitle(newTitle)
        }
        else {
            setTitle("")
            setEditableTitle("")
        }
    })

    createEffect(() => {
        if (editTitleMode()) {
            setTimeout(() => $textField.focus(), 100)
        }
    })

    const updateTitle = () => {
        const threadId = activeMessage()?.path.split(".")[0]
        if (threadId) {
            setEditTitleMode(false)
            setTitle(editableTitle())
            updateThreadTitle(threadId, editableTitle())
        }
    }

    return (
        <header class="sticky top-0 flex w-full items-center gap-2 border-b bg-background p-2 z-10">
            <Button
                variant="ghost"
                size="icon"
                // className={cn("h-7 w-7", className)}
                onClick={props.toggleSidebar}
            >
                <PanelLeft class="!w-5 !h-5 text-secondary-foreground" />
            </Button>
            <Show when={!editTitleMode()}>
                <div class="flex-1 font-bold text-sm" onClick={() => setEditTitleMode(true)}>
                    {title()}
                </div>
            </Show>
            <Show when={editTitleMode()}>
                <div class="flex-1">
                    {/* @ts-ignore */}
                    <TextField ref={$textField} value={editableTitle()} setValue={setEditableTitle} onKeyUp={e => {
                        if (e.key === "Enter") {
                            updateTitle()
                        }
                    }}
                        onBlur={updateTitle} />
                </div>
            </Show>
            <Button
                variant="ghost"
                size="icon"
                // className={cn("h-7 w-7", className)}
                onClick={props.onNewChat}
            >
                <MessageSquarePlus class="!w-5 !h-5 text-secondary-foreground" />
            </Button>
        </header>
    )
}
export default Navbar