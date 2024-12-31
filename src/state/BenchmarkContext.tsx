import { createEffect, createSignal } from "solid-js";
import { getLocalstorageJsonOrNull } from "../util/localstorage";
import { Model, ModelType } from "./ModelProvidersContext";

type ChallengeId = string // treeId

type Metric = {
    type: "EXACT" | "CONTAINS"
    case_sensitive: boolean
    value: string
}

export type Challenge = {
    id: ChallengeId
    title: string
    metric: Metric
}

type Result = {
    model: ModelType
    challengeId: ChallengeId // treeId
    score: number // [0:1]
}

export type Benchmark = {
    id: string
    title: string
    models: Model[]
    challenges: string[] // treeId
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

const generateResultsFor = (benchmarkId: string) => {
    console.warn("Not implemented")
    setResults([])
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


export {
    challenges,
    addChallenge,
    removeChallenge,
    benchmarks,
    addBenchmark,
    removeBenchmark,
    generateResultsFor,
    addChallengeToBenchmark,
    removeChallengeFromBenchmark,
}
