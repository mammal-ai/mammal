import { LanguageModelV1 } from "@ai-sdk/provider";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, smoothStream, StreamTextResult } from "ai";
import {
  model,
  provider,
  temperature,
  maxTokens,
  providerOptions,
} from "../state/ModelSettingsContext";
import { ModelType, Provider } from "../state/ModelProvidersContext";
import { addMessage, ChatMessageRole } from "../state/MessagesContext";
import { toaster } from "@kobalte/core";
import { MissingOpenRouterSettingToast } from "./MissingOpenRouterSettingToast";

type LlmMessage = {
  role: ChatMessageRole;
  content: string;
  annotations?: { [key: string]: string }[];
};

const ORIGINAL_FETCH = window.fetch;

const GENERATE_TITLE_PROMPT = `
  Given the following message(s), respond by giving a terse subject
  line encapsulating the topic. Do not explain. Do not be creative.
  Do not use nouns like 'request' or 'question' and avoid verbal phrases.`
  .replace(/\s+/g, " ")
  .trim();

export const llmForProvider = (provider: Provider) => {
  switch (provider.type) {
    case ModelType.Anthropic:
      return createAnthropic({ apiKey: provider.apiKey });

    case ModelType.Groq:
      return createGroq({ apiKey: provider.apiKey });

    case ModelType.Google:
      return createGoogleGenerativeAI({ apiKey: provider.apiKey });

    case ModelType.OpenAi:
      return createOpenAI({ apiKey: provider.apiKey });

    case ModelType.OpenRouter:
      if (!providerOptions()?.orProviderId) {
        toaster.show(MissingOpenRouterSettingToast);
        throw new Error(
          "No OpenRouter provider selected. Please select a provider."
        );
      }

      // We add the "as" type assertion here because the OpenRouter provider doesn't extend LanguageModelV1 like the others do
      // This is a dumb type that only takes a model name, but that's all we use it for
      return createOpenRouter({
        apiKey: provider.apiKey,
        extraBody: {
          provider: {
            only: [providerOptions().orProviderId],
          },
        },
      }) as (model: string) => LanguageModelV1;

    case ModelType.OpenAiCompatible:
      return createOpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.endpoint,
      });

    default:
      throw new Error(`Unknown model type ${provider.type}`);
  }
};

export const generateTitle = async (messages: LlmMessage[]) => {
  // TODO: Something like this:
  // const llm = createGroq({
  //   apiKey: "___SOLVE_API_KEY_ISSUE__",
  // });

  // const result = await generateText({
  //   model: llm("llama-3.1-8b-instant"),
  //   system: GENERATE_TITLE_PROMPT,
  //   messages,
  //   maxTokens: 200,
  //   temperature: 0.1,
  // });

  // return result.text;
  try {
    const m = JSON.parse(messages[0].content);
    return m[0].message.split(" ").slice(0, 6).join(" ");
  } catch {}
  return messages[0].content.split(" ").slice(0, 6).join(" ");
};

export const generateNewMessage = async (messageThread: LlmMessage[]) => {
  if (!provider()) {
    throw new Error("No provider selected");
  }
  if (!model()) {
    throw new Error("No model selected");
  }

  const actualProvider = provider()!;
  const actualModel = model()!;

  const lastMessage = messageThread[messageThread.length - 1];
  const { parentId } = lastMessage?.annotations?.find(
    (a) => "parentId" in a
  ) || { parentId: null };
  if (parentId === null) {
    throw "Failed to get parentId annotation from last message, so wouldn't know where to attach message. Aborting";
  }

  const llm = llmForProvider(actualProvider);

  const result: StreamTextResult<any, any> = await streamText({
    // model: groq("llama-3.1-8b-instant"),
    // model: groq("llama3-8b-8192"),
    model: llm(actualModel.model),
    system: "You are a helpful assistant.",
    messages: messageThread,
    maxTokens: maxTokens(),
    temperature: temperature(),
    experimental_telemetry: {
      isEnabled: false,
    },
    // `smoothStream` can be configured with `delayInMs` and `chunking` params
    // but it has sensible defaults (10ms, "word")
    experimental_transform: smoothStream(),
  });

  result.text
    .then((message) => {
      addMessage(
        {
          name: model()!.name,
          role: "assistant",
          message,
          createdAt: new Date().toISOString(),
          metadata: {
            provider: actualProvider.name,
            model: actualModel.name,
            temperature: temperature(),
            maxTokens: maxTokens(),
          },
        },
        parentId
      );
    })
    .catch((error) => {
      console.error("Error generating message:", error);
    });

  return result.toTextStreamResponse();
};

const chatApiHandler = (_url: any, options?: any) => {
  const { body } = options;
  const { messages } = JSON.parse(body);

  return generateNewMessage(messages);
};

// we need to export something or the module will be tree-shaken
export const initLlm = () => {
  // we hijack fetch to support useChat, which was designed for SSR
  window.fetch = function (url, options) {
    if (url !== "https://hijacked_fetch_request/api/chat") {
      return ORIGINAL_FETCH(url, options);
    }
    return chatApiHandler(url, options);
  };
};
