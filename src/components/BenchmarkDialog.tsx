import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../shadcn/components/Dialog"
import { Benchmark, challenges, getVariablesFromChallenge } from "../state/BenchmarkContext"
import { TextField } from "./TextField"
import { Button } from "../shadcn/components/Button"
import { createEffect, createSignal, For, Show } from "solid-js"
import { models } from "../state/ModelProvidersContext"
import Papa from "papaparse"
import { maxTokens, temperature } from "../state/ModelSettingsContext"
import { Trash2 } from "lucide-solid"

const readCsv = (file: File, options: { header: boolean }) => new Promise<Papa.ParseResult<unknown>>((resolve) => {
    Papa.parse(file, {
        header: options.header,
        complete: (result) => {
            resolve(result)
        }
    });
})

type BenchmarkDialogProps = {
    open: boolean
    challengeId: string
    onClose: () => void
    onRun: (benchmark: Omit<Benchmark, "id">) => void
}
const BenchmarkDialog = (props: BenchmarkDialogProps) => {
    const [modelFilter, setModelFilter] = createSignal("")
    const [benchmarkTitle, setBenchmarkTitle] = createSignal("")
    const [variables, setVariables] = createSignal<string[]>([])
    const [data, setData] = createSignal<{ [key: string]: string }[]>([])
    const [selectedModels, setSelectedModels] = createSignal<string[]>([])

    createEffect(() => {
        const challenge = challenges().find(c => c.id === props.challengeId)
        if (!challenge) {
            setVariables([])
            return
        }

        setVariables(getVariablesFromChallenge(challenge))
    })

    const show = (name: string, filter: string) =>
        filter
            .toLowerCase()
            .split(" ")
            .every(k => name.includes(k))

    const onChooseFile = async (e: any) => {
        const { files } = e.target as HTMLInputElement
        if (!files?.[0]) {
            setData([])
            return
        }
        const { data, errors } = await readCsv(files[0], { header: true })
        if (errors.length > 0) {
            throw errors
        }

        setData(data as { [key: string]: string }[])
    }

    const onClose = () => {
        props.onClose()
    }

    const runBenchmark = async () => {
        if (!benchmarkTitle().length) {
            alert("Please enter a benchmark title")
            return
        }
        if (stillRequiredVars().length > 0) {
            alert("Please provide source data that satisfies all required variables")
            return
        }
        if (selectedModels().length === 0) {
            alert("Please select at least one model to benchmark")
            return
        }

        props.onRun({
            challengeId: props.challengeId,
            title: benchmarkTitle(),
            models: selectedModels().map(modelId => ({
                modelId,
                maxTokens: 500,
                temperature: 0.3
            })),
            data: data(),
            createdAt: (new Date()).toISOString()
        })
    }

    const dataVariablesSet = () =>
        new Set(data().map(row => Object.keys(row)).flat())

    const stillRequiredVars = () => {
        const availableVars = dataVariablesSet()
        const neededVars = variables()
        return neededVars.filter(v => !availableVars.has(v))
    }

    return (
        <Dialog open={props.open} onOpenChange={onClose}>
            <DialogContent class="max-h-[90vh] min-w-[700px] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Run Benchmark</DialogTitle>
                    <DialogDescription>
                        Choose the models and data against which to run this benchmark
                    </DialogDescription>
                </DialogHeader>
                <div class="flex-1 flex flex-col space-y-4 overflow-hidden">
                    <div class="flex-0 overflow-hidden flex flex-col">
                        <div class="mb-4">
                            <TextField placeholder="Benchmark Title" value={benchmarkTitle()} setValue={setBenchmarkTitle} />
                        </div>
                        {/* <div class="flex-1"> */}
                        <div class="flex-row">
                            <div class="font-bold">Models</div>
                            <TextField placeholder="Filter Models" value={modelFilter()} setValue={setModelFilter} />
                        </div>
                        <div class="mt-2 p-4 overflow-y-auto bg-gray-100 flex flex-col space-y-2">
                            <For each={models()}>
                                {m =>
                                    <label class={show(m.name.toLowerCase(), modelFilter()) ? "bg-gray-100" : "hidden"}>
                                        <input type="checkbox" class="mr-1"
                                            checked={selectedModels().includes(m.id)}
                                            onChange={() => {
                                                if (selectedModels().includes(m.id)) {
                                                    setSelectedModels(selectedModels().filter(modelId => modelId !== m.id))
                                                } else {
                                                    setSelectedModels(selectedModels().concat(m.id))
                                                }
                                            }}
                                        />
                                        {m.name}
                                    </label>
                                }
                            </For>
                        </div>
                    </div>

                    <Show when={data().length === 0 && variables().length > 0}>
                        <div>
                            <div class="mb-1">
                                <span>
                                    Select a source csv file to supply variables:
                                </span>
                                <span>
                                    <For each={stillRequiredVars()}>
                                        {v => <>
                                            {" "}<span class="px-2 py-0.5 rounded-sm bg-slate-200 font-bold">{v}</span>
                                        </>}
                                    </For>
                                </span>
                            </div>

                        </div>
                    </Show>

                    <Show when={variables().length > 0}>
                        <div class="w-full flex justify-between">
                            <input type="file" name="data" onChange={onChooseFile} />
                            <Button
                                size={"icon"}
                                class={data().length > 0 ? "" : "hidden"}
                                onClick={() => {
                                    setData([])
                                }}
                            >
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </Show>

                    <Show when={data().length > 0 && stillRequiredVars().length > 0}>
                        <div>
                            <span class="mb-1 font-bold text-red-700">Missing Variables in Data: </span>
                            <span>
                                <For each={stillRequiredVars()}>
                                    {v => <>
                                        {" "}<span class="px-2 py-0.5 rounded-sm bg-slate-200 font-bold">{v}</span>
                                    </>}
                                </For>
                            </span>
                        </div>
                    </Show>

                    <div class="flex flex-row justify-end space-x-2">
                        <Button variant={"outline"} onClick={onClose}>Cancel</Button>
                        <Button
                            variant={"default"}
                            onClick={runBenchmark}
                        >
                            Run Benchmark
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
export default BenchmarkDialog