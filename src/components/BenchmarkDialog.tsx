import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../shadcn/components/Dialog"
import { Benchmark, challenges } from "../state/BenchmarkContext"
import { TextField } from "./TextField"
import { Button } from "../shadcn/components/Button"
import { createSignal, For } from "solid-js"
import { models } from "../state/ModelProvidersContext"

type BenchmarkDialogProps = {
    open: boolean
    onClose: () => void
    onSave: (benchmark: Benchmark) => void
}
const BenchmarkDialog = (props: BenchmarkDialogProps) => {
    const [benchmarkTitle, setBenchmarkTitle] = createSignal("")
    const [modelFilter, setModelFilter] = createSignal("")
    const [challengeFilter, setChallengeFilter] = createSignal("")

    const show = (name: string, filter: string) =>
        filter
            .toLowerCase()
            .split(" ")
            .every(k => name.includes(k))

    const onClose = () => {
        setBenchmarkTitle("")
        props.onClose()
    }

    const onSave = () => {
        setBenchmarkTitle("")

        // props.onSave({
        //     id: treeId,
        //     title: benchmarkTitle(),
        //     metric: {
        //         case_sensitive: metricCaseSensitivity(),
        //         type: getMetricType(metricType()),
        //         value: metricValue()
        //     }
        // })
    }

    return (
        <Dialog open={props.open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Benchmark</DialogTitle>
                    <DialogDescription>
                        <div class="flex flex-col space-y-4">
                            <div>
                                Please confirm the details for this benchmark
                            </div>
                            <div class="flex flex-col space-y-1">
                                <span class="flex-1">
                                    Title:
                                </span>
                                <div>
                                    <TextField value={benchmarkTitle()} setValue={setBenchmarkTitle} />
                                </div>
                            </div>

                            <div class="flex flex-row space-x-4">
                                <div class="flex-1">
                                    <div class="font-bold">Models</div>
                                    <TextField placeholder="Filter Models" value={modelFilter()} setValue={setModelFilter} />
                                    <div class="mt-2 p-4 h-[200px] overflow-y-auto bg-gray-100 flex flex-col space-y-2">
                                        <For each={models()}>
                                            {m =>
                                                <label class={show(m.name.toLowerCase(), modelFilter()) ? "bg-gray-100" : "hidden"}>
                                                    <input type="checkbox" class="mr-1" />
                                                    {m.name}
                                                </label>
                                            }
                                        </For>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <div class="font-bold">Challenges</div>
                                    <TextField placeholder="Filter Challenges" value={challengeFilter()} setValue={setChallengeFilter} />
                                    <div class="mt-2 p-4 h-[200px] overflow-y-auto bg-gray-100 flex flex-col space-y-2">
                                        <For each={challenges()}>
                                            {c =>
                                                <label class={show(c.title.toLowerCase(), challengeFilter()) ? "" : "hidden"}>
                                                    <input type="checkbox" class="mr-1" />
                                                    {c.title}
                                                </label>
                                            }
                                        </For>
                                    </div>
                                </div>
                            </div>

                            <div class="flex flex-row justify-end space-x-2">
                                <Button variant={"outline"} onClick={onClose}>Cancel</Button>
                                <Button variant={"default"} onClick={onSave}>Create Benchmark</Button>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
export default BenchmarkDialog