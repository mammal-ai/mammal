import { createSignal } from "solid-js";
import { addModel, models, providers } from "./ModelProvidersContext";

type ProviderDetailsFromApi = {
  id: string;
  icon: string;
  name: string;
  vercelSdkType: string;
  endpoint: string;
};

type ModelDetailsFromApi = {
  name: string;
  model: string;
  available: boolean;
  meta?: { [key: string]: any };
};

const getProviders = async (): Promise<ProviderDetailsFromApi[]> => {
  const response = await fetch(
    "https://mammal-ai.github.io/llm-providers/providers.json"
  );
  try {
    return await response.json();
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return [];
  }
};

const getModels = async (
  providerId: string
): Promise<ModelDetailsFromApi[]> => {
  const response = await fetch(
    `https://mammal-ai.github.io/llm-providers/${providerId}.json`
    // {
    //   headers: {
    //     contentType: "application/json",
    //   },
    // }
  );
  try {
    return await response.json();
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return [];
  }
};

const checkForNewModels = async () => {
  let didAddModels = false;
  await Promise.all(
    providers().map(async (provider) => {
      const currentModelsForProvider = new Set(
        models()
          .filter((m) => m.providerId === provider.uuid)
          .map((m) => m.model)
      );
      const updatedListOfModelsForProvider = await getModels(provider.id);
      const newModels = updatedListOfModelsForProvider.filter(
        (m) => !currentModelsForProvider.has(m.model)
      );

      newModels.forEach(async (m) => {
        console.info("Adding new model:", m.model);
        await addModel({ ...m, providerId: provider.uuid });
        console.info("Added new model:", m.model);
      });

      didAddModels = didAddModels || newModels.length > 0;
    })
  );
  return didAddModels;
};

const [knownProviderList, setKnownProviderList] = createSignal<
  ProviderDetailsFromApi[]
>([]);

getProviders().then((p) => {
  setKnownProviderList(p);
  console.log("Known providers:", p);
});

export { checkForNewModels, getModels, knownProviderList };
