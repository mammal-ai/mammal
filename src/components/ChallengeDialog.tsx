import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../shadcn/components/Dialog"
import { Challenge } from "../state/BenchmarkContext"
import { TextField } from "./TextField"
import { rootNodes } from "../state/MessagesContext"
import { Button } from "../shadcn/components/Button"
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "../shadcn/components/Switch"
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "../shadcn/components/Select"
import { createEffect, createSignal } from "solid-js"

const getMetricType = (t: "Exact" | "Contains") => {
    if (t === "Exact") {
        return "EXACT"
    }
    else if (t === "Contains") {
        return "CONTAINS"
    }
    throw "Impossible..."
}

type ChallengeDialogProps = {
    treeId: string | null
    onClose: () => void
    onSave: (challenge: Challenge) => void
}
const ChallengeDialog = (props: ChallengeDialogProps) => {
    const [benchmarkTitle, setBenchmarkTitle] = createSignal("")
    const [metricCaseSensitivity, setMetricCaseSensitivity] = createSignal<boolean>(false)
    const [metricType, setMetricType] = createSignal<"Exact" | "Contains">("Contains")
    const [metricValue, setMetricValue] = createSignal<string>("")

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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Benchmark Challenge</DialogTitle>
                    <DialogDescription>
                        <div class="flex flex-col space-y-4">
                            <div>
                                Please confirm the details for this challenge
                            </div>
                            <div class="flex flex-col space-y-1">
                                <span class="flex-1">
                                    Title:
                                </span>
                                <div>
                                    <TextField value={benchmarkTitle()} setValue={setBenchmarkTitle} />
                                </div>
                            </div>


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

                                <div class="flex flex-row items-end space-x-2">
                                    <TextField value={metricValue()} setValue={setMetricValue} />

                                    <Select
                                        options={["Exact", "Contains"]}
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
                            <div class="flex flex-row justify-end space-x-2">
                                <Button variant={"outline"} onClick={props.onClose}>Cancel</Button>
                                <Button variant={"default"} onClick={onSave}>Create Benchmark</Button>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
export default ChallengeDialog