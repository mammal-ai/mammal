import { createEffect, createSignal } from "solid-js";
import { Model, Provider } from "./ModelProvidersContext";
import { providers } from "./ModelProvidersContext";
import { getLocalstorageJsonOrNull } from "../util/localstorage";

const DEFAULT_TEMPERATURE = 0.5;
const DEFAULT_MAX_TOKENS = 1024;

const initialModel = getLocalstorageJsonOrNull("model");
const initialProvider = getLocalstorageJsonOrNull("provider");
const initialTemperature =
  Number.parseFloat(getLocalstorageJsonOrNull("temperature")) ||
  DEFAULT_TEMPERATURE;
const initialMaxTokens =
  Number.parseInt(getLocalstorageJsonOrNull("maxTokens")) || DEFAULT_MAX_TOKENS;

const [model, setModel] = createSignal<Model | null>(initialModel);
const [provider, setProvider] = createSignal<Provider | null>(initialProvider);
const [temperature, setTemperature] = createSignal(initialTemperature);
const [maxTokens, setMaxTokens] = createSignal(initialMaxTokens);
const [providerOptions, setProviderOptions] = createSignal<Record<string, any>>(
  {}
);

createEffect(() => {
  localStorage.setItem("model", JSON.stringify(model()));
});
createEffect(() => {
  localStorage.setItem("provider", JSON.stringify(provider()));
});
createEffect(() => {
  localStorage.setItem("temperature", JSON.stringify(temperature()));
});
createEffect(() => {
  localStorage.setItem("maxTokens", JSON.stringify(maxTokens()));
});
createEffect(() => {
  localStorage.setItem("providerOptions", JSON.stringify(providerOptions()));
});

createEffect(() => {
  const newModel = model();
  if (
    newModel &&
    newModel.meta &&
    newModel.meta.maxTemperature &&
    newModel.meta.maxTemperature < temperature()
  ) {
    setTemperature(
      newModel.meta?.defaultTemperature || newModel.meta.maxTemperature
    );
  }
});

createEffect(() => {
  const newModel = model();
  if (
    newModel &&
    newModel.meta &&
    newModel.meta.maxOutputTokens &&
    newModel.meta.maxOutputTokens < maxTokens()
  ) {
    setMaxTokens(newModel.meta.maxOutputTokens);
  }
});

createEffect(() => {
  const newModel = model();
  if (newModel) {
    setProvider(
      providers().find((p) => p.uuid === newModel.providerId) || null
    );
  }
});

createEffect(() => {
  localStorage.setItem("providerOptions", JSON.stringify(providerOptions()));
});

export {
  model,
  provider,
  setModel,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  providerOptions,
  setProviderOptions,
};
