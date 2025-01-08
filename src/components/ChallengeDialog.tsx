import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../shadcn/components/Dialog"
import { Challenge } from "../state/BenchmarkContext"
import { TextField } from "./TextField"
import { getThreadEndingAt, rootNodes } from "../state/MessagesContext"
import { Button } from "../shadcn/components/Button"
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "../shadcn/components/Switch"
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "../shadcn/components/Select"
import { createEffect, createSignal, For, Show } from "solid-js"
import { Message } from "ai"
import { variableRegex } from "../util/messageVariables"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../shadcn/components/Accordion"
import { Info } from "lucide-solid"

const accordionTriggerClasses = "text-lg font-bold h-7 hover:no-underline hover:text-slate-900"

type MessageWithEditableVariableNamesProps = {
    message: string,
    handleSelection: () => void,
    renameVariable: (newName: string) => void
}
const MessageWithEditableVariableNames = (props: MessageWithEditableVariableNamesProps) => {
    const parts = props.message.split(variableRegex)
    return (
        <div>
            <For each={parts}>
                {(part, i) => i() % 2 === 0
                    ? <span onMouseUp={props.handleSelection}>{part}</span>
                    : <span class="__mammal_variable__" onClick={() => props.renameVariable("new_name")}>{part}</span>
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
    onSave: (challenge: Challenge) => void
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

    const addVariable = () => {
        let i = 0
        const getNewVariableName = (i: number) => {
            return `\${{variable_${i}}}`
        }
        let newVariableName = getNewVariableName(i)
        while (variables().findIndex(v => v.name === newVariableName) !== -1) {
            newVariableName = getNewVariableName(i++)
        }

        setShowVariablePopup(false)
        setVariables([
            ...variables(),
            {
                name: newVariableName,
                value: selectedText()
            }
        ])
        const index = selectedMessageIndex()
        const oldMessages = messages()
        const newMessage = structuredClone(oldMessages[index])
        newMessage.content = newMessage.content.replace(selectedText(), newVariableName)
        setMessages([
            ...oldMessages.slice(0, index),
            newMessage,
            ...oldMessages.slice(index + 1)
        ])
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
        const existingVariables = thread.map(n => n.data.message.match(variableRegex)).filter(v => !!v).flat()
        setVariables(existingVariables.map(name => ({
            name,
            value: ""
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

    const onSave = () => {
        const treeId = props.treeId
        if (treeId === null) {
            throw "Could not create benchmark: treeId was null"
        }

        props.onSave({
            id: treeId,
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
            <DialogContent ref={$dialog} class="max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader class="flex-0">
                    <DialogTitle>New Benchmark Challenge</DialogTitle>
                    <DialogDescription class="h-full overflow-hidden">
                        <div>
                            Please confirm the details for this challenge
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div class="flex flex-row items-center space-x-1 px-2">
                    <div class="flex-0">
                        Title:
                    </div>
                    <div class="flex-1">
                        <TextField value={benchmarkTitle()} setValue={setBenchmarkTitle} />
                    </div>
                </div>

                <div class="flex-1 overflow-y-scroll space-y-4 p-2">
                    <div class="block flex flex-col space-y-2 overflow-y-scroll">
                        <div class="flex flex-row items-center bg-background rounded-md border px-4 py-2">
                            <Accordion collapsible class="w-full">
                                <AccordionItem value="item-1" class="border-none">
                                    <AccordionTrigger class={accordionTriggerClasses}>{messages().length > 1 ? "Messages" : "Message"}</AccordionTrigger>
                                    <AccordionContent>
                                        <For each={messages()}>
                                            {(message, i) =>
                                                <MessageWithEditableVariableNames
                                                    message={message.content}
                                                    handleSelection={handleSelection(i())}
                                                    renameVariable={() => { }}
                                                />}
                                        </For>
                                        <Show when={selectedText() && showVariablePopup()}>
                                            <div class="absolute bg-white border shadlow-lg p-4 rounded z-50"
                                                style={{
                                                    top: `${popupPosition().top + 5}px`,
                                                    left: `${popupPosition().left}px`,
                                                }}>
                                                <div class="mb-2">Create variable from selected text?</div>
                                                <div class="flex justify-end space-x-2">
                                                    <Button variant={"outline"} onClick={() => setShowVariablePopup(false)}>Cancel</Button>
                                                    <Button onClick={addVariable}>Create</Button>
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
                                    <AccordionTrigger class={accordionTriggerClasses}>Data</AccordionTrigger>
                                    <AccordionContent>
                                        <table class="w-full">
                                            <thead>
                                                <tr>
                                                    <For each={variables()}>
                                                        {variable => <td class="font-bold">{variable.name}</td>}
                                                    </For>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <For each={variables()}>
                                                        {variable => <td>{variable.value
                                                            ? variable.value
                                                            : <span class="italic text-slate-400">not set</span>}</td>}
                                                    </For>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div class="pt-4 mt-4 flex flex-row items-center space-x-2 border-t border-t-slate-200">
                                            <TextField value="test" setValue={() => { }} />
                                            <Button>Add Variable</Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>


                        <div class="flex flex-row items-center bg-background rounded-md border px-4 py-2">
                            <Accordion collapsible class="w-full">
                                <AccordionItem value="item-2" class="border-none">
                                    <AccordionTrigger class={accordionTriggerClasses}>Evaluation</AccordionTrigger>
                                    <AccordionContent>

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
                </div>

                <div class="flex-0 flex flex-row justify-end space-x-2">
                    <Button variant={"outline"} onClick={props.onClose}>Cancel</Button>
                    <Button variant={"default"} onClick={onSave}>Create Benchmark</Button>
                </div>
            </DialogContent>
        </Dialog >
    )
}
export default ChallengeDialog