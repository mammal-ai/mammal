import { createEffect, createSignal } from "solid-js";
import { getLocalstorageJsonOrNull } from "../util/localstorage";
import { Model, providers } from "./ModelProvidersContext";
import { llmForProvider } from "../util/llm";
import { generateText } from "ai";
import { getThreadEndingAt } from "./MessagesContext";

type ChallengeId = string // treeId

type Metric = {
    type: "EXACT" | "CONTAINS" | "MATCH"
    case_sensitive: boolean
    value: string
}

export type Challenge = {
    id: ChallengeId
    title: string
    metric: Metric
}

type Result = {
    model: Model
    challengeId: ChallengeId // treeId
    resultContent: string
    score: number // [0:1]
}

export type Benchmark = {
    id: string
    title: string
    models: Model[]
    challenges: string[] // treeId
    maxTokens: number
    temperature: number
}

const initialChallenges = getLocalstorageJsonOrNull("challenges") || []
const initialResults = getLocalstorageJsonOrNull("results") || []
const initialBenchmarks = getLocalstorageJsonOrNull("benchmarks") || []

const [challenges, setChallenges] = createSignal<Challenge[]>(initialChallenges)
const [results, setResults] = createSignal<Result[]>(initialResults)
const [benchmarks, setBenchmarks] = createSignal<Benchmark[]>(initialBenchmarks)

createEffect(() => {
    localStorage.setItem("challenges", JSON.stringify(challenges()))
})
createEffect(() => {
    localStorage.setItem("results", JSON.stringify(results()))
})
createEffect(() => {
    localStorage.setItem("benchmarks", JSON.stringify(benchmarks()))
})

const addChallenge = (newChallenge: Challenge) => {
    if (challenges()?.map(b => b.id).includes(newChallenge.id)) {
        console.warn("Not adding benchmark id, already present")
        return
    }
    setChallenges([
        ...challenges(),
        structuredClone(newChallenge)
    ])
}

const removeChallenge = (treeId: string) => {
    setChallenges(challenges().filter(c => c.id !== treeId))
}

const addBenchmark = (benchmark: Omit<Benchmark, "id">) => {
    const id = crypto.randomUUID()
    setBenchmarks([...benchmarks(), {
        id,
        ...benchmark
    }])
}

const removeBenchmark = (id: string) => {
    setBenchmarks(benchmarks().filter(b => b.id !== id))
}

const addChallengeToBenchmark = (challengeId: ChallengeId, benchmarkId: string) => {
    const currentBenchmarks = structuredClone(benchmarks())
    const bIndex = currentBenchmarks.findIndex(b => b.id === benchmarkId)
    currentBenchmarks[bIndex].challenges.push(challengeId)
    setBenchmarks(currentBenchmarks)
}

const removeChallengeFromBenchmark = (challengeId: ChallengeId, benchmarkId: string) => {
    console.warn("Not implemented")
}

const addResult = (result: Result) => {
    // ensure not duplicate result
    const duplicate = results().find(r => r.challengeId === result.challengeId && r.model.id === result.model.id)
    if (duplicate) {
        throw "Cannot add duplicate result (yet...)"
    }
    setResults([
        ...results(),
        result
    ])
}

const scoreValue = (value: string, metric: Metric) => {
    if (metric.type === "EXACT") {
        return metric.case_sensitive
            ? metric.value.toUpperCase() === value.toUpperCase()
            : metric.value === value
    }
    else if (metric.type === "CONTAINS") {
        return metric.case_sensitive
            ? value.toUpperCase().includes(metric.value.toUpperCase())
            : value.includes(metric.value)
    }
    else if (metric.type === "MATCH") {
        const regexp = new RegExp(metric.value, metric.case_sensitive ? "i" : undefined)
        return regexp.test(value)
    }
    throw "Impossible (i.e., we have a broken pattern match)"
}

const runBenchmark = async (benchmark: Benchmark) => {
    for (const challengeId of benchmark.challenges) {
        const challenge = challenges().find(c => c.id === challengeId)
        if (!challenge) {
            console.error(challengeId, challenges())
            throw "Could not find challenge!"
        }

        const messages = (await getThreadEndingAt(challenge.id)).map(n => ({
            role: n.data.role,
            content: n.data.message
        }))
        if (messages.length === 0) {
            console.error("No messages found while benchmarking:", challenge.title, challenge.id)
            continue
        }

        for (const model of benchmark.models) {
            const provider = providers().find(p => p.id === model.providerId)
            if (!provider) {
                console.error(model.providerId, providers())
                throw "Could not find provider!"
            }
            console.log({
                model: model,
                challengeId: challenge.id,
            })

            const llm = llmForProvider(provider);

            console.log({
                // model: groq("llama-3.1-8b-instant"),
                // model: groq("llama3-8b-8192"),
                model: llm(model.model),
                system: "You are a helpful assistant.",
                messages,
                maxTokens: benchmark.maxTokens || 1000,
                temperature: benchmark.temperature || 0.5,
                experimental_telemetry: {
                    isEnabled: false,
                },
            })

            const result = await generateText({
                // model: groq("llama-3.1-8b-instant"),
                // model: groq("llama3-8b-8192"),
                model: llm(model.model),
                system: "You are a helpful assistant.",
                messages,
                maxTokens: benchmark.maxTokens || 1000,
                temperature: benchmark.temperature || 0.5,
                experimental_telemetry: {
                    isEnabled: false,
                },
            })

            addResult({
                model: model,
                challengeId: challenge.id,
                resultContent: result.text,
                score: scoreValue(result.text, challenge.metric) ? 1 : 0
            })
        }
    }
}

export {
    challenges,
    addChallenge,
    removeChallenge,
    benchmarks,
    addBenchmark,
    removeBenchmark,
    runBenchmark,
    addChallengeToBenchmark,
    removeChallengeFromBenchmark,
    results,
    addResult,
}
