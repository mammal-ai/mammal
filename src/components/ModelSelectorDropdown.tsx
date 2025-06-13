import { createEffect, createSignal, For } from "solid-js";
import { Check, ChevronRight, ChevronsUpDown } from "lucide-solid";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../shadcn/components/Command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../shadcn/components/Popover";
import { Button } from "../shadcn/components/Button";
import { cn } from "../shadcn/utils";
import { models, providers } from "../state/ModelProvidersContext";
import { model, setModel } from "../state/ModelSettingsContext";

export const ModelSelectorDropdown = () => {
  const [open, setOpen] = createSignal(false);
  const [searchValue, setSearchValue] = createSignal("");
  const [modelId, setModelId] = createSignal<string | null>(
    model()?.uuid || null
  );
  createEffect(() => {
    setModel(impliedModel());
  });

  const impliedModel = () => {
    if (modelId() !== null) {
      return models().find((m) => m.uuid === modelId()) || null;
    }
    return null;
  };
  const impliedProvider = () => {
    if (impliedModel() !== null) {
      return (
        providers().find((p) => p.uuid === impliedModel()?.providerId) || null
      );
    }
    return null;
  };

  return (
    <Popover open={open()} onOpenChange={setOpen} placement="top">
      <PopoverTrigger>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open()}
          // class="w-[200px] justify-between active:scale-1 active:shadow"
          class="justify-between active:scale-1 active:shadow"
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            setOpen(!open());
          }}
        >
          <span class="truncate max-w-[20rem]">
            {modelId() !== null ? (
              <span class="flex flex-row items-center">
                {impliedProvider()?.icon && (
                  <img
                    class="w-4 h-4 mr-2 rounded-lg"
                    src={impliedProvider()?.icon}
                  />
                )}
                <span class="text-muted-foreground">
                  {impliedProvider()?.name}
                </span>
                <ChevronRight class="text-muted-foreground/40" />
                <span class="font-bold overflow-hidden text-ellipsis">
                  {impliedModel()?.name}
                </span>
              </span>
            ) : (
              "Select model..."
            )}
          </span>
          <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="p-0">
        <Command>
          <CommandInput
            value={searchValue()}
            onValueChange={(newValue) => setSearchValue(newValue)}
            placeholder="Search models..."
          />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <For each={providers()}>
              {(provider) => (
                <CommandGroup heading={provider.name}>
                  <For
                    each={models().filter(
                      (m) => m.providerId === provider.uuid
                    )}
                  >
                    {(model) => (
                      <CommandItem
                        class="bg-white"
                        value={model.uuid.toString()}
                        keywords={[model.name, provider.name]}
                        onSelect={(_currentValue) => {
                          setModelId(model.uuid);
                          setOpen(false);
                        }}
                      >
                        <span class="font-normal">{model.name}</span>
                        <div class="flex-1" />
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            impliedModel()?.uuid === model.uuid
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    )}
                  </For>
                </CommandGroup>
              )}
            </For>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
