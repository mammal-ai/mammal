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

const chkData = (name: string, value: string) => {
    if (name === "chkChallenge") {
        return ["challenges", value]
    }
    else if (name === "chkModel") {
        return ["models", parseInt(value)]
    }
    return ["unknown", value]
}

type BenchmarkDialogProps = {
    open: boolean
    onClose: () => void
    onSave: (benchmark: Omit<Benchmark, "id">) => void
}
const BenchmarkDialog = (props: BenchmarkDialogProps) => {
    let $titleRef: HTMLInputElement;
    const [benchmarkTitle, setBenchmarkTitle] = createSignal("")
    const [modelFilter, setModelFilter] = createSignal("")
    const [challengeFilter, setChallengeFilter] = createSignal("")
    const [titleIsValid, setTitleIsValid] = createSignal(true)

    const show = (name: string, filter: string) =>
        filter
            .toLowerCase()
            .split(" ")
            .every(k => name.includes(k))

    const onClose = () => {
        setBenchmarkTitle("")
        props.onClose()
    }

    const onSave = (e: SubmitEvent) => {
        e.preventDefault()

        const title = benchmarkTitle()
        if (!title) {
            return
        }

        const formdata = new FormData(e.currentTarget as HTMLFormElement)
        const checkboxData = Array.from(formdata.entries())
            .reduce((a, v) => {
                if (v[1] !== "on") {
                    return a
                }
                const [checkboxName, id] = v[0].split("__")
                const [type, value] = chkData(checkboxName, id)
                // @ts-ignore
                a[type].push(value)
                return a
            }, { "models": [], "challenges": [], "unknown": [] } as { models: number[], challenges: string[], unknown: any })

        const benchmarkModels = checkboxData.models.map(id => models().find(m => m.id === id)).filter(m => m !== undefined)
        props.onSave({
            title,
            models: benchmarkModels,
            challenges: checkboxData.challenges,
            maxTokens: 1000,
            temperature: 0.3,
        })
    }

    return (
        <Dialog open={props.open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Benchmark</DialogTitle>
                    <DialogDescription>
                        <form onSubmit={onSave}>
                            <div class="flex flex-col space-y-4">
                                <div>
                                    Please confirm the details for this benchmark
                                </div>
                                <div class="flex flex-col space-y-1">
                                    <span class="flex-1">
                                        Title:
                                    </span>
                                    <div>
                                        {/* @ts-ignore */}
                                        <TextField
                                            // @ts-ignore
                                            ref={$titleRef}
                                            class={"mb-1" + (titleIsValid() ? "" : " border-red-600")}
                                            onBlur={(e) => {
                                                if (e.target.value === "") {
                                                    setTitleIsValid(false)
                                                }
                                                else {
                                                    setTitleIsValid(true)
                                                }
                                            }}
                                            onFocus={() => setTitleIsValid(true)}
                                            value={benchmarkTitle()}
                                            setValue={setBenchmarkTitle} />
                                        <span class={"text-red-600 " + (titleIsValid() && "hidden")}>This field is required</span>
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
                                                        <input name={`chkModel__${m.id}`} type="checkbox" class="mr-1" />
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
                                                        <input name={`chkChallenge__${c.id}`} type="checkbox" class="mr-1" />
                                                        {c.title}
                                                    </label>
                                                }
                                            </For>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex flex-row justify-end space-x-2">
                                    <Button variant={"outline"} onClick={onClose}>Cancel</Button>
                                    <Button variant={"default"} type="submit">Create Benchmark</Button>
                                </div>
                            </div>
                        </form>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
export default BenchmarkDialog