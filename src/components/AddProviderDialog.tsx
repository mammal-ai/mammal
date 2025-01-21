import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../shadcn/components/Select";
import { TextField } from "./TextField";
import { Button } from "../shadcn/components/Button";
import { PlusCircle, X } from "lucide-solid";
import { createSignal } from "solid-js";
import {
  providers,
  addProvider,
  addModel,
  modelTypeFromString,
} from "../state/ModelProvidersContext";
import knownProviders from "../assets/providers.json";

const CUSTOM_PROVIDER_DEFAULT = "Custom Provider";

const providerNames = [
  CUSTOM_PROVIDER_DEFAULT,
  ...knownProviders.map((p) => p.name).sort(),
];

const getEndpointByProvider = (provider: string) => {
  const knownProvider = knownProviders.find((p) => p.name === provider);
  return knownProvider?.endpoint;
};

// // To check for models, something like:
// const r = await fetch(p?.endpoint + "/models", {
//     headers: {
//         "Authorization": `Bearer ${apiKey()}`
//     }
// })
// const x = r.json()

type AddProviderFormProps = {
  show: boolean;
  onHide: () => any;
};
const AddProviderDialog = (props: AddProviderFormProps) => {
  const [selectedProvider, setSelectedProvider] = createSignal<string>(
    CUSTOM_PROVIDER_DEFAULT
  );
  const [apiKey, setApiKey] = createSignal<string>("");
  const [providerName, setProviderName] = createSignal<string>("");
  const [endpoint, setEndpoint] = createSignal<string>("");
  // const { providers, addProvider, addModel } = useContext(ProviderContext);

  const isCustomProvider = () => selectedProvider() === CUSTOM_PROVIDER_DEFAULT;

  const onAddProvider = async () => {
    const name = isCustomProvider() ? providerName() : selectedProvider();
    const p = knownProviders.find((p) => p.name === name);

    const providerId = await addProvider({
      name,
      type: modelTypeFromString(p?.type || "Unknown"),
      apiKey: apiKey(),
      endpoint: isCustomProvider()
        ? endpoint()
        : getEndpointByProvider(selectedProvider()) || "",
      ...(p?.icon ? { icon: p.icon } : {}),
    });

    if (providerId === null) {
      console.error("Failed to add provider");
      return;
    }
    setApiKey("");

    p?.models.forEach((m) => {
      addModel({
        name: m.name,
        model: m.model,
        available: m.available,
        providerId,
        meta: m.meta,
      });
    });

    props.onHide();
  };

  return (
    <div
      class="fixed inset-0 z-50 overflow-y-auto bg-background/60"
      style={{
        "backdrop-filter": "blur(2px)",
        opacity: props.show ? 1 : 0,
        transition: "opacity 0.2s",
        "pointer-events": props.show ? "auto" : "none",
      }}
    >
      <form
        class="min-w-[36rem] max-w-[42rem] mx-auto mt-12"
        style={{
          transform: props.show ? "translateY(0)" : "translateY(-1rem)",
          transition: "transform 0.2s",
        }}
      >
        <div class="flex flex-col w-full mx-auto p-6 space-y-2 bg-white rounded-lg shadow-lg">
          <div class="flex flex-row items-center justify-between">
            <span class="font-bold text-lg">Add Provider</span>
            <Button
              class="flex flex-row spaxe-x-2"
              variant={"ghost"}
              size={"icon"}
              onClick={props.onHide}
            >
              <X />
            </Button>
          </div>

          <Select
            class={"w-full"}
            placeholder="Select a Provider…"
            options={providerNames.filter((p) =>
              providers().every((pr) => pr.name !== p)
            )}
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
            )}
            onChange={setSelectedProvider}
            value={selectedProvider()}
          >
            <SelectTrigger>
              <SelectValue<string>>
                {(state) => state.selectedOption()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>

          <TextField
            class={"w-full" + (isCustomProvider() ? "" : " hidden")}
            value={providerName()}
            setValue={setProviderName}
            placeholder="Provider Name"
          />

          <TextField
            class="w-full"
            value={apiKey()}
            setValue={setApiKey}
            placeholder="API Key"
          />

          <TextField
            class={"w-full" + (isCustomProvider() ? "" : " hidden")}
            value={endpoint()}
            setValue={setEndpoint}
            placeholder="Endpoint"
          />

          <Button class="flex flex-row spaxe-x-2" onClick={onAddProvider}>
            <PlusCircle class="h-4 w-4" />
            Add Provider
          </Button>
        </div>
      </form>
    </div>
  );
};
export { AddProviderDialog };
