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
  id: string;
  name: string;
  type: ModelType;
  endpoint: string;
  apiKey: string;
  icon?: string;
};
type UnsavedProvider = Omit<Provider, "id">;

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
  id: string;
  name: string;
  model: string;
  providerId: string;
  available: boolean;
  meta?: ModelMeta;
};
type UnsavedModel = Omit<Model, "id">;

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
      const id = crypto.randomUUID();
      const newProviders = [...providers, { id, ...provider }];
      localStorage.setItem("providers", JSON.stringify(newProviders));
      resolve(id);
      return newProviders;
    });
  });

const removeProvider = (id: string) => {
  // First cascade delete models
  models()
    .filter((m) => m.providerId === id)
    .forEach((m) => removeModel(m.id));
  setProviders((providers) => {
    const newProviders = providers.filter((p) => p.id !== id);
    localStorage.setItem("providers", JSON.stringify(newProviders));
    return newProviders;
  });
};

const addModel = (model: UnsavedModel) =>
  new Promise<string>((resolve) => {
    setModels((models) => {
      const id = crypto.randomUUID();
      const newModels = [...models, { id, ...model }];
      localStorage.setItem("models", JSON.stringify(newModels));
      resolve(id);
      return newModels;
    });
  });

const removeModel = (id: string) => {
  setModels((models) => {
    const newModels = models.filter((m) => m.id !== id);
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
