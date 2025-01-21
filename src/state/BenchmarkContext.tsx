import { createEffect, createSignal } from "solid-js";
import { getLocalstorageJsonOrNull } from "../util/localstorage";
import { models, providers } from "./ModelProvidersContext";
import { llmForProvider } from "../util/llm";
import { generateText } from "ai";
import { ChatMessageRole } from "./MessagesContext";
import { variableRegex } from "../util/messageVariables";
import { toaster } from "@kobalte/core";
import {
  Toast,
  ToastContent,
  ToastDescription,
  ToastProgress,
  ToastTitle,
} from "../shadcn/components/Toast";

type MetricType = "EXACT" | "CONTAINS" | "MATCH";

type Metric = {
  type: MetricType;
  case_sensitive: boolean;
  value: string;
};

export type Challenge = {
  id: string;
  messages: {
    role: ChatMessageRole;
    content: string;
  }[];
  title: string;
  metric: Metric;
};

export type UnsavedChallenge = Omit<Challenge, "id">;

export type Result = {
  modelId: string;
  challengeId: string;
  data: { [key: string]: string };
  resultContent: string;
  score: number; // [0:1]
};

export type Benchmark = {
  id: string;
  title: string;
  createdAt: string;
  challengeId: string;
  models: {
    modelId: string;
    maxTokens: number;
    temperature: number;
  }[];
  data: { [key: string]: string }[];
};

const initialChallenges = getLocalstorageJsonOrNull("challenges") || [];
const initialResults = getLocalstorageJsonOrNull("results") || [];
const initialBenchmarks = getLocalstorageJsonOrNull("benchmarks") || [];

const [challenges, setChallenges] =
  createSignal<Challenge[]>(initialChallenges);
const [results, setResults] = createSignal<Result[]>(initialResults);
const [benchmarks, setBenchmarks] =
  createSignal<Benchmark[]>(initialBenchmarks);

createEffect(() => {
  localStorage.setItem("challenges", JSON.stringify(challenges()));
});
createEffect(() => {
  localStorage.setItem("results", JSON.stringify(results()));
});
createEffect(() => {
  localStorage.setItem("benchmarks", JSON.stringify(benchmarks()));
});

const addChallenge = (challenge: UnsavedChallenge) => {
  const newChallenge = {
    id: crypto.randomUUID(),
    ...structuredClone(challenge),
  };
  setChallenges([...challenges(), newChallenge]);
  return newChallenge;
};

const removeChallenge = (treeId: string) => {
  setChallenges(challenges().filter((c) => c.id !== treeId));
};

const getVariablesFromChallenge = (challenge: Challenge) => {
  return [
    ...challenge.messages.flatMap((m) =>
      Array.from(m.content.matchAll(variableRegex))
    ),
    ...Array.from(challenge.metric.value.matchAll(variableRegex)),
  ].map((regexMatch) => regexMatch[1]);
};

const addBenchmark = (benchmark: Omit<Benchmark, "id">) => {
  const id = crypto.randomUUID();
  const newBenchmark = {
    id,
    ...structuredClone(benchmark),
  };
  setBenchmarks([...benchmarks(), newBenchmark]);
  return newBenchmark;
};

const removeBenchmark = (id: string) => {
  setBenchmarks(benchmarks().filter((b) => b.id !== id));
};

const addResult = (result: Result) => {
  // ensure not duplicate result
  const duplicate = results().find(
    (r) =>
      r.challengeId === result.challengeId &&
      r.modelId === result.modelId &&
      JSON.stringify(r.data) === JSON.stringify(result.data)
  );
  if (duplicate) {
    throw "Cannot add duplicate result (yet...)";
  }
  setResults([...results(), result]);
};

const scoreValue = (
  value: string,
  targetValue: string,
  metricType: MetricType,
  caseSensitive: boolean
) => {
  console.log(metricType, caseSensitive, targetValue, value);
  if (metricType === "EXACT") {
    return caseSensitive
      ? targetValue.toUpperCase() === value.toUpperCase()
      : targetValue === value;
  } else if (metricType === "CONTAINS") {
    return caseSensitive
      ? value.includes(targetValue)
      : value.toUpperCase().includes(targetValue.toUpperCase());
  } else if (metricType === "MATCH") {
    const regexp = new RegExp(targetValue, caseSensitive ? undefined : "i");
    return regexp.test(value);
  }
  throw "Impossible (i.e., we have a broken pattern match)";
};

const runBenchmark = async (benchmark: Benchmark) => {
  const challenge = challenges().find((c) => c.id === benchmark.challengeId);
  if (!challenge) {
    console.error(benchmark.challengeId, challenges());
    throw "Could not find challenge!";
  }

  const variables = getVariablesFromChallenge(challenge);

  const replaceVariablesInMessage = (
    message: string,
    variables: string[],
    dataRow: { [key: string]: string }
  ) =>
    message.replaceAll(/\$\{\{([^}]+)\}\}/g, (_, variable) => {
      if (variables.includes(variable)) {
        return dataRow[variable];
      }
      return `{{${variable}}}`;
    });

  // If there is no data, we still want to run the benchmark once with empty variables
  const dataRows = benchmark.data.length > 0 ? benchmark.data : [{}];

  for (const row of dataRows) {
    const messages = challenge.messages.map((message) => ({
      role: message.role,
      content: replaceVariablesInMessage(message.content, variables, row),
    }));

    if (messages.length === 0) {
      console.error(
        "No messages found while benchmarking:",
        challenge.title,
        challenge.id
      );
      continue;
    }

    for (const benchmarkModel of benchmark.models) {
      const model = models().find((m) => m.id === benchmarkModel.modelId);
      if (!model) {
        console.error(model, models());
        // throw "Could not find provider!"
        continue;
      }

      const provider = providers().find((p) => p.id === model.providerId);
      if (!provider) {
        console.error(model.providerId, providers());
        // throw "Could not find provider!"
        continue;
      }
      try {
        const llm = llmForProvider(provider);

        const result = await generateText({
          model: llm(model.model),
          system: "You are a helpful assistant.",
          messages,
          maxTokens: benchmarkModel.maxTokens || 1000,
          temperature: benchmarkModel.temperature || 0.5,
          experimental_telemetry: {
            isEnabled: false,
          },
        });

        const trimmedResult = result.text.trim();
        const score = scoreValue(
          trimmedResult,
          replaceVariablesInMessage(challenge.metric.value, variables, row),
          challenge.metric.type,
          challenge.metric.case_sensitive
        )
          ? 1
          : 0;

        addResult({
          challengeId: challenge.id,
          modelId: model.id,
          data: row,
          resultContent: trimmedResult,
          score: score,
        });
      } catch (e) {
        console.error(e);
        console.error(
          "Failed to run benchmark",
          benchmark,
          challenge,
          variables
        );
        toaster.show((props) => (
          <Toast toastId={props.toastId} variant="destructive">
            <ToastContent>
              <ToastTitle>Could not run benchmark</ToastTitle>
              <ToastDescription>
                There was a problem calling {model.name}.
              </ToastDescription>
            </ToastContent>
            <ToastProgress />
          </Toast>
        ));
      }
    }
  }
};

export {
  challenges,
  addChallenge,
  removeChallenge,
  getVariablesFromChallenge,
  benchmarks,
  addBenchmark,
  removeBenchmark,
  runBenchmark,
  results,
  addResult,
};
