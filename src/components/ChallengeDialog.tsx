import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../shadcn/components/Dialog"
import { UnsavedChallenge } from "../state/BenchmarkContext"
import { TextField } from "./TextField"
import { getThreadEndingAt, rootNodes } from "../state/MessagesContext"
import { Button } from "../shadcn/components/Button"
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "../shadcn/components/Switch"
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "../shadcn/components/Select"
import { createEffect, createSignal, For, JSX, Show } from "solid-js"
import { Message } from "ai"
import { variableRegex } from "../util/messageVariables"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../shadcn/components/Accordion"
import { Info } from "lucide-solid"

function tryOr<T>(callback: Function, fallback: T) {
    try {
        return callback()
    }
    catch {
        return fallback
    }
}

type SelectionData = {
    node: JSX.Element,
    text: string
}
const [selectionData, setSelectionData] = createSignal<SelectionData | null>(null)

document.addEventListener("selectionchange", e => {
    const selection = window.getSelection()
    const range = tryOr(() => selection?.getRangeAt(0), null)
    if (selection && selection.anchorNode === selection.focusNode && selection.anchorNode?.parentElement && range && range.toString().length > 0) {
        setSelectionData({
            node: selection.anchorNode.parentElement,
            text: range.toString()
        })
    }
    else {
        setSelectionData(null)
    }
})

const accordionTriggerClasses = "text-lg font-bold h-7 hover:no-underline hover:text-slate-900"

type MessageWithEditableVariableNamesProps = {
    left: boolean,
    message: string,
    handleSelection: () => void,
    renameVariable: (oldName: string, newName: string) => void
}
const MessageWithEditableVariableNames = (props: MessageWithEditableVariableNamesProps) => {
    let $div: HTMLDivElement | undefined = undefined
    const [isEditing, setIsEditing] = createSignal("")
    const [newName, setNewName] = createSignal("")

    const parts = props.message.split(variableRegex)

    const onStartEditing = (name: string) => {
        setIsEditing(name)
        setNewName(name)
    }

    const wrapNameAsVar = (name: string) => `\${{${name}}}`

    const onFinishedEditing = () => {
        if (newName().trim().length === 0) {
            setIsEditing("")
            return
        }
        props.renameVariable(wrapNameAsVar(isEditing()), wrapNameAsVar(newName().trim()))
        setIsEditing("")
    }

    const onKeyUp: JSX.EventHandlerUnion<HTMLInputElement, KeyboardEvent, JSX.EventHandler<HTMLInputElement, KeyboardEvent>> = (e) => {
        if (e.key === "Enter") {
            onFinishedEditing()
        }
    }

    createEffect(() => {
        const d = selectionData()
        // @ts-ignore
        if ($div?.contains(d?.node)) {
            props.handleSelection()
        }
    })

    return (
        <div ref={$div} class={"p-4 rounded-lg bg-slate-100 whitespace-pre-wrap " + (props.left ? "mr-2" : "ml-2")}>
            <For each={parts}>
                {(part, i) => part.length === 0 ? <></> :
                    i() % 2 === 0
                        ? <span>{part}</span>
                        : <span class="__mammal_variable__" onClick={() => onStartEditing(part)}>{isEditing() === part ?
                            <TextField class="px-1 bg-white" value={newName()} setValue={setNewName} onKeyUp={onKeyUp} onBlur={onFinishedEditing} /> : part}</span>
                }
            </For>
        </div>
    )
}

const getMetricType = (t: "Exact" | "Contains" | "Regex Match") => {
    if (t === "Exact") {
        return "EXACT"
    }
    else if (t === "Contains") {
        return "CONTAINS"
    }
    else if (t === "Regex Match") {
        return "MATCH"
    }
    throw "Impossible..."
}

type ChallengeDialogProps = {
    treeId: string | null
    onClose: () => void
    onSave: (challenge: UnsavedChallenge) => void
}
const ChallengeDialog = (props: ChallengeDialogProps) => {
    let $dialog: HTMLDialogElement | undefined = undefined
    const [benchmarkTitle, setBenchmarkTitle] = createSignal("")
    const [metricCaseSensitivity, setMetricCaseSensitivity] = createSignal<boolean>(false)
    const [metricType, setMetricType] = createSignal<"Exact" | "Contains" | "Regex Match">("Contains")
    const [metricValue, setMetricValue] = createSignal<string>("")
    const [messages, setMessages] = createSignal<Message[]>([])
    const [selectedMessageIndex, setSelectedMessageIndex] = createSignal(-1)
    const [selectedText, setSelectedText] = createSignal("")
    const [variables, setVariables] = createSignal<{ name: string, value: string }[]>([])
    const [popupPosition, setPopupPosition] = createSignal<{ left: number, top: number }>({ left: 0, top: 0 })
    const [showVariablePopup, setShowVariablePopup] = createSignal<boolean>(false)

    createEffect(() => {
        const d = selectionData()
        if (!d) {
            setSelectedText("")
        }
    })

    const handleSelection = (index: number) => () => {
        const selection = window.getSelection()
        let selectedText = selection?.toString()
        if (!selection || !selectedText?.length) {
            setSelectedText("")
            return
        }

        // @ts-ignore
        const { top: dialogTop, left: dialogLeft } = $dialog?.getBoundingClientRect() || { left: 0, top: 0 }
        const range = selection?.getRangeAt(0)
        const { bottom, left } = range.getBoundingClientRect()

        setPopupPosition({
            top: bottom - dialogTop,
            left: left - dialogLeft
        })
        setSelectedMessageIndex(index)
        setSelectedText(selectedText)
        setShowVariablePopup(true)
    }

    const getNewVariableName = () => {
        let i = 0
        const generateCandidate = (i: number) => {
            return `\${{variable_${i}}}`
        }
        let newVariableName = generateCandidate(i)
        while (variables().findIndex(v => v.name === newVariableName) !== -1) {
            newVariableName = generateCandidate(i++)
        }
        return newVariableName
    }

    const addVariable = (variableName: string) => {
        const index = selectedMessageIndex()
        const oldMessages = messages()
        const newMessage = structuredClone(oldMessages[index])
        newMessage.content = newMessage.content.replace(selectedText(), variableName)
        setMessages([
            ...oldMessages.slice(0, index),
            newMessage,
            ...oldMessages.slice(index + 1)
        ])
    }

    const handleCreateVariablePopup = () => {
        addVariable(getNewVariableName())
        setShowVariablePopup(false)
    }

    createEffect(async () => {
        if (!props.treeId) {
            setMessages([])
            return
        }
        const thread = await getThreadEndingAt(props.treeId)
        setMessages(thread.map(n => ({
            id: n.path,
            role: n.data.role,
            content: n.data.message,
        })))
    })

    createEffect(() => {
        const benchmarkId = props.treeId
        if (benchmarkId === null) {
            setBenchmarkTitle("")
            return
        }
        const benchmarkIdRoot = benchmarkId.split(".")[0]
        const newTitle = rootNodes().find(n => benchmarkIdRoot === n.path.split(".")[0])?.title || ""
        setBenchmarkTitle(newTitle)
    })

    createEffect(() => {
        const existingVariables = messages().map(m => m.content.match(variableRegex)).filter(v => !!v).flat()
        setVariables(existingVariables.map(name => ({
            name,
            value: ""
        })))
    })
    const onSave = () => {
        const treeId = props.treeId
        if (treeId === null) {
            throw "Could not create benchmark: treeId was null"
        }

        props.onSave({
            messages: messages(),
            title: benchmarkTitle(),
            metric: {
                case_sensitive: metricCaseSensitivity(),
                type: getMetricType(metricType()),
                value: metricValue()
            }
        })
    }

    return (
        <Dialog open={props.treeId !== null} onOpenChange={props.onClose}>
            <DialogContent ref={$dialog} class="max-h-[90vh] min-w-[60%] overflow-hidden flex flex-col">
                <DialogHeader class="flex-0">
                    <DialogTitle>New Benchmark Challenge</DialogTitle>
                    <DialogDescription class="h-full overflow-hidden">
                        <div>
                            Please confirm the details for this challenge
                        </div>
                    </DialogDescription>
                </DialogHeader>


                <div class="flex-1 overflow-y-scroll space-y-4 p-2">
                    <div class="flex flex-row items-center space-x-1">
                        <div class="flex-0">
                            Title:
                        </div>
                        <div class="flex-1">
                            <TextField value={benchmarkTitle()} setValue={setBenchmarkTitle} />
                        </div>
                    </div>
                    <div class="block flex flex-col space-y-2 overflow-y-scroll">
                        <div class="flex flex-row items-center bg-background rounded-md border px-4 py-2">
                            <Accordion collapsible class="w-full">
                                <AccordionItem value="item-1" class="border-none">
                                    <AccordionTrigger class={accordionTriggerClasses}>{messages().length > 1 ? "Messages" : "Message"}</AccordionTrigger>
                                    <AccordionContent class="mt-2">
                                        <div class="flex flex-col space-y-2">
                                            <For each={messages()}>
                                                {(message, i) =>
                                                    <MessageWithEditableVariableNames
                                                        left={i() % 2 === 0}
                                                        message={message.content}
                                                        handleSelection={handleSelection(i())}
                                                        renameVariable={(oldName, newName) => {
                                                            console.log(oldName, newName)
                                                            const ms = messages()
                                                            const mIndex = i()
                                                            const oldM = ms[mIndex]
                                                            if (!oldM) {
                                                                throw "Couldn't find current message"
                                                            }

                                                            setMessages([
                                                                ...ms.slice(0, mIndex),
                                                                {
                                                                    ...oldM,
                                                                    content: oldM.content.replace(oldName, newName)
                                                                },
                                                                ...ms.slice(mIndex + 1)
                                                            ])
                                                        }}
                                                    />}
                                            </For>
                                        </div>
                                        <Show when={selectedText().length > 0 && showVariablePopup()}>
                                            <div class="absolute bg-white border shadlow-lg p-4 rounded z-50"
                                                style={{
                                                    top: `${popupPosition().top + 5}px`,
                                                    left: `${popupPosition().left}px`,
                                                }}>
                                                <div class="mb-2">Create variable from selected text?</div>
                                                <div class="flex justify-end space-x-2">
                                                    <Button variant={"outline"} onClick={() => setShowVariablePopup(false)}>Cancel</Button>
                                                    <Button onClick={handleCreateVariablePopup}>Create</Button>
                                                </div>
                                            </div>
                                        </Show>
                                        <div class="mt-2 flex flex-row items-center text-blue-600 text-sm">
                                            <Info class="h-4 w-4 text-blue-600 mr-2" />
                                            Select text to convert to variables
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>

                        <div class="flex flex-row items-center bg-background rounded-md border px-4 py-2">
                            <Accordion collapsible class="w-full">
                                <AccordionItem value="item-2" class="border-none">
                                    <AccordionTrigger class={accordionTriggerClasses}>Evaluation</AccordionTrigger>
                                    <AccordionContent class="mt-2">

                                        <div class="flex flex-col space-y-1">
                                            <div class="flex flex-row items-center justify-end">
                                                <span class="flex-1">
                                                    Value:
                                                </span>
                                                <Switch class="flex items-center space-x-2" checked={metricCaseSensitivity()} onChange={setMetricCaseSensitivity} >
                                                    <SwitchLabel>
                                                        Case Sensitive:
                                                    </SwitchLabel>
                                                    <SwitchControl>
                                                        <SwitchThumb />
                                                    </SwitchControl>
                                                </Switch>
                                            </div>

                                            <div class="flex flex-row items-end space-x-1">
                                                <div class="flex-1">
                                                    <TextField value={metricValue()} setValue={setMetricValue} />
                                                </div>
                                                <Select
                                                    options={["Exact", "Contains", "Regex Match"]}
                                                    itemComponent={props =>
                                                        <SelectItem item={props.item}>
                                                            {props.item.rawValue}
                                                        </SelectItem>
                                                    }
                                                    onChange={setMetricType}
                                                    value={metricType()}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue<string>>
                                                            {state => state.selectedOption()}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent />
                                                </Select>
                                            </div>
                                        </div>
                                        <div class="mt-2 flex flex-row items-center text-blue-600 text-sm">
                                            <Info class="h-4 w-4 text-blue-600 mr-2" />
                                            {"You can use ${{variables}} in your evaluation"}
                                        </div>

                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>

                    <div class="flex-0 flex flex-row justify-end space-x-2">
                        <Button variant={"outline"} onClick={props.onClose}>Cancel</Button>
                        <Button variant={"default"} onClick={onSave}>Create Benchmark</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    )
}
export default ChallengeDialog