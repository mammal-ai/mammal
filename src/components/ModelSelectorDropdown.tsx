import { createEffect, createSignal, For } from "solid-js"
import { Check, ChevronRight, ChevronsUpDown } from "lucide-solid"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../shadcn/components/Command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../shadcn/components/Popover"
import { Button } from "../shadcn/components/Button"
import { cn } from "../shadcn/utils"
import { models, providers } from "../state/ModelProvidersContext"
import { model, setModel } from "../state/ModelSettingsContext"

export const ModelSelectorDropdown = () => {
    const [open, setOpen] = createSignal(false)
    const [modelId, setModelId] = createSignal<number | null>(model()?.id || null)
    // const { models, providers } = useContext(ProviderContext);

    createEffect(() => {
        setModel(impliedModel())
    })

    const impliedModel = () => {
        if (modelId() !== null) {
            return models().find(m => m.id === modelId()) || null
        }
        return null
    }
    const impliedProvider = () => {
        if (impliedModel() !== null) {
            return providers().find(p => p.id === impliedModel()?.providerId) || null
        }
        return null
    }

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
                        e.stopPropagation()
                        setOpen(!open())
                    }}
                >
                    <span class="truncate max-w-[20rem]">
                        {modelId() !== null
                            ? <span class="flex flex-row items-center">
                                {impliedProvider()?.icon && <img class="w-4 h-4 mr-2 rounded-lg" src={impliedProvider()?.icon} />}
                                <span class="text-muted-foreground">{impliedProvider()?.name}</span>
                                <ChevronRight class="text-muted-foreground/40" />
                                <span class="font-bold overflow-hidden text-ellipsis">{impliedModel()?.name}</span></span>
                            : "Select model..."}
                    </span>
                    <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            {/* <PopoverContent class="w-[200px] p-0"> */}
            <PopoverContent class="p-0">
                <Command>
                    <CommandInput placeholder="Search models..." />
                    <CommandList>
                        <CommandEmpty>No framework found.</CommandEmpty>
                        <For each={providers()}>
                            {provider => (
                                <CommandGroup heading={provider.name}>
                                    <For each={models().filter(m => m.providerId === provider.id)}>
                                        {model => (
                                            <CommandItem
                                                class="bg-white"
                                                value={model.id.toString()}
                                                keywords={[model.name, provider.name]}
                                                onSelect={(_currentValue) => {
                                                    setModelId(model.id)
                                                    setOpen(false)
                                                }}
                                            >
                                                <span class="font-normal">
                                                    {model.name}
                                                </span>
                                                <div class="flex-1" />
                                                <Check
                                                    class={cn(
                                                        "mr-2 h-4 w-4",
                                                        impliedModel()?.id === model.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        )}
                                    </For>
                                </CommandGroup>
                            )}
                        </For>
                        {/* <CommandGroup heading="Google">
                            {menuItems2.map((framework) => (
                                <CommandItem
                                    class="bg-white"
                                    value={framework}
                                    onSelect={(currentValue) => {
                                        setModelId(currentValue === modelId() ? "" : currentValue)
                                        setOpen(false)
                                    }}
                                >
                                    {framework}
                                    <div class="flex-1" />
                                    <Check
                                        class={cn(
                                            "mr-2 h-4 w-4",
                                            modelId() === framework ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup> */}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>)
}
