import { createSignal } from "solid-js";

export enum ModelType {
  Anthropic,
  Groq,
  Google,
  OpenAi,
  OpenAiCompatible,
  Unknown,
}

export const modelTypeFromString = (modelType: string) => {
  switch (modelType) {
    case "Anthropic":
      return ModelType.Anthropic;
    case "Groq":
      return ModelType.Groq;
    case "Google":
      return ModelType.Google;
    // case "Cohere":
    //     return ModelType.Cohere;
    // case "Mistral":
    //     return ModelType.Mistral;
    case "OpenAi":
      return ModelType.OpenAi;
    case "OpenAiCompatible":
      return ModelType.OpenAiCompatible;
    default:
      return ModelType.Unknown;
  }
};

export type Provider = {
  uuid: string;
  id: string;
  name: string;
  type: ModelType;
  endpoint: string;
  apiKey: string;
  icon?: string;
};
type UnsavedProvider = Omit<Provider, "uuid">;

type ModelMeta = {
  productionReady?: boolean;
  deprecated?: boolean;
  inputPrice?: number;
  outputPrice?: number;
  contextWindow?: number;
  maxOutputTokens?: number;
  maxTemperature?: number;
  defaultTemperature?: number;
};

export type Model = {
  uuid: string;
  name: string;
  model: string;
  providerId: string;
  available: boolean;
  meta?: ModelMeta;
};
type UnsavedModel = Omit<Model, "uuid">;

const initialProviders = localStorage.getItem("providers")
  ? JSON.parse(localStorage.getItem("providers")!)
  : [];
const initialModels = localStorage.getItem("models")
  ? JSON.parse(localStorage.getItem("models")!)
  : [];

const [providers, setProviders] = createSignal<Provider[]>(initialProviders);
const [models, setModels] = createSignal<Model[]>(initialModels);

const addProvider = (provider: UnsavedProvider) =>
  new Promise<string>((resolve) => {
    setProviders((providers) => {
      const uuid = crypto.randomUUID();
      const newProviders = [...providers, { uuid, ...provider }];
      localStorage.setItem("providers", JSON.stringify(newProviders));
      resolve(uuid);
      return newProviders;
    });
  });

const removeProvider = (uuid: string) => {
  // First cascade delete models
  models()
    .filter((m) => m.providerId === uuid)
    .forEach((m) => removeModel(m.uuid));
  setProviders((providers) => {
    const newProviders = providers.filter((p) => p.uuid !== uuid);
    localStorage.setItem("providers", JSON.stringify(newProviders));
    return newProviders;
  });
};

const addModel = (model: UnsavedModel) =>
  new Promise<string>((resolve) => {
    setModels((models) => {
      const uuid = crypto.randomUUID();
      const newModels = [...models, { uuid, ...model }];
      localStorage.setItem("models", JSON.stringify(newModels));
      resolve(uuid);
      return newModels;
    });
  });

const removeModel = (id: string) => {
  setModels((models) => {
    const newModels = models.filter((m) => m.uuid !== id);
    localStorage.setItem("models", JSON.stringify(newModels));
    return newModels;
  });
};

export {
  providers,
  models,
  addProvider,
  removeProvider,
  addModel,
  removeModel,
};
