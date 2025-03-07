import { Show, useContext } from "solid-js";
import {
  Model,
  Provider,
  models,
  providers,
  removeProvider as unguardedRemoveProvider,
} from "../state/ModelProvidersContext";
import { Dog, Edit, Sparkles, Trash2 } from "lucide-solid";
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from "../shadcn/components/Accordion";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../shadcn/components/Table";
import { For } from "solid-js";
import { Button } from "../shadcn/components/Button";

const ProviderIcon = (props: { provider: Provider }) => (
  <>
    <Show when={props.provider.icon}>
      <img class="w-4 h-4 mr-2 rounded-lg" src={props.provider.icon} />
    </Show>
    <Show when={!props.provider.icon}>
      <Dog class="w-4 h-4 mr-2" />
    </Show>
  </>
);

const DeprecatedDefunctOrPreview = (props: { model: Model }) => (
  <>
    <Show when={!props.model.available}>
      <div class="text-red-400">offline</div>
    </Show>
    <Show when={props.model.meta?.deprecated && props.model.available}>
      <div class="text-amber-400">deprecated</div>
    </Show>
    <Show
      when={
        props.model.meta?.productionReady === false && props.model.available
      }
    >
      <div class="text-blue-400">preview</div>
    </Show>
  </>
);

const sureGuard =
  (sureMessage: string, fn: (...args: any[]) => any) =>
  async (...args: any[]) => {
    if (await confirm(sureMessage)) {
      return fn(...args);
    }
  };

const removeProvider = sureGuard(
  "Are you sure you want to remove this provider and all its models?\nThis action cannot be undone.",
  unguardedRemoveProvider
);

const topModels = [
  "Gemini Exp 1206 (Preview)",
  "Gemini 2.0 Flash",
  "GPT-4o",
  "Llama 3.3 70B",
];

// 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
const ModelProviderListView = () => {
  // const { models, providers, removeProvider } = useContext(ProviderContext);

  return (
    <For each={providers()}>
      {(provider) => (
        <div class="flex flex-row items-center bg-background rounded-md border px-4 py-2">
          <Accordion collapsible class="w-full" defaultValue={["item-1"]}>
            <AccordionItem value="item-1" class="border-none">
              <div class="flex flex-row items-center text-sm font-bold">
                <div class="text-lg flex flex-row items-center">
                  {/* <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" class="w-4 h-4 mr-2 grayscale" /> */}
                  <ProviderIcon provider={provider} />
                  {provider.name}
                </div>
                <div class="flex-1" />
                <Button variant={"ghost"} class="w-7 h-7 p-0" size={"sm"}>
                  <Edit class="h-4 w-4" />
                  <span class="sr-only">Toggle</span>
                </Button>
                <Button
                  variant={"ghost"}
                  class="w-7 h-7 p-0"
                  size={"sm"}
                  onClick={() => removeProvider(provider.uuid)}
                >
                  <Trash2 class="h-4 w-4" />
                  <span class="sr-only">Toggle</span>
                </Button>
                <AccordionTrigger class="w-7 h-7 p-2 rounded-lg flex items-center justify-center hover:bg-accent hover:text-accent-foreground active:bg-accent/60 active:scale-95" />
              </div>
              <AccordionContent>
                <div class="mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead class="h-8"></TableHead>
                        <TableHead class="h-8">Model</TableHead>
                        <TableHead class="h-8"></TableHead>
                        <TableHead class="h-8 text-right">
                          Context Window
                        </TableHead>
                        <TableHead class="h-8 text-right">
                          Output Tokens
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <For
                        each={models().filter(
                          (m) => m.providerId === provider.uuid
                        )}
                      >
                        {(model) => (
                          <TableRow>
                            <TableCell class="pr-2">
                              {topModels.includes(model.name) ? (
                                <Sparkles class="w-4 h-4 text-blue-400" />
                              ) : (
                                ""
                              )}
                            </TableCell>
                            <TableCell class="p-2 pl-0">
                              <div class="flex flex-col">
                                <div class="font-bold">{model.name}</div>

                                <div class="text-xs">{model.model}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DeprecatedDefunctOrPreview model={model} />
                            </TableCell>
                            <TableCell class="text-right">
                              {model.meta?.contextWindow || "-"}
                            </TableCell>
                            <TableCell class="text-right">
                              {model.meta?.maxOutputTokens || "-"}
                            </TableCell>
                          </TableRow>
                        )}
                      </For>
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </For>
  );
};
export default ModelProviderListView;
