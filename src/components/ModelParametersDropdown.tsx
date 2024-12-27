import { createSignal } from "solid-js"
import { Settings } from "lucide-solid"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../shadcn/components/Popover"
import { Button } from "../shadcn/components/Button"
import { model, temperature, setTemperature, maxTokens, setMaxTokens } from "../state/ModelSettingsContext"
import { Slider, SliderFill, SliderLabel, SliderThumb, SliderTrack, SliderValueLabel } from "../shadcn/components/Slider"

const DEFAULT_MAX_TOKEN_VALUE = 2 * (10 ** 6)
const DEFAULT_MAX_TEMPERATURE_VALUE = 2

const scaleUp = (maxTokens: number) => {
    return Math.round(Math.pow(2, maxTokens / 18));
};
const scaleDown = (logTokens: number) => {
    return Math.round(18 * Math.log2(logTokens));
};

export const ModelParametersDropdown = () => {
    const [open, setOpen] = createSignal(false)
    const maxMaxTokensValue = () => scaleDown(model()?.meta?.maxOutputTokens || model()?.meta?.contextWindow || DEFAULT_MAX_TOKEN_VALUE)
    const maxTemperatureValue = () => model()?.meta?.maxTemperature || DEFAULT_MAX_TEMPERATURE_VALUE

    return (
        <Popover open={open()} onOpenChange={setOpen} placement="top">
            <PopoverTrigger>
                <Button
                    variant="outline"
                    size="icon"
                    role="combobox"
                    aria-expanded={open()}
                    // class="w-[200px] justify-between active:scale-1 active:shadow"
                    class="active:scale-1 active:shadow"
                    onClick={(e: MouseEvent) => {
                        e.stopPropagation()
                        setOpen(!open())
                    }}
                >
                    <Settings class="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent class="p-2">
                <div class="flex flex-col space-y-4 overflow-hidden bg-popover text-popover-foreground p-4"
                    onClick={e => e.stopPropagation()}>
                    <div class="font-bold">
                        Model Settings
                    </div>
                    <Slider
                        minValue={0}
                        maxValue={maxTemperatureValue()}
                        value={[temperature()]}
                        onChange={setTemperature}
                        onInput={setTemperature}
                        step={0.1}
                        getValueLabel={(params) => params.values.toString()}
                        class="space-y-3"
                    >
                        <div class="flex w-full justify-between">
                            <SliderLabel>Temperature</SliderLabel>
                            <SliderValueLabel />
                        </div>
                        <SliderTrack>
                            <SliderFill />
                            <SliderThumb />
                        </SliderTrack>
                    </Slider>
                    <Slider
                        minValue={1}
                        maxValue={maxMaxTokensValue()}
                        value={[scaleDown(maxTokens())]}
                        onChange={(v) => setMaxTokens(scaleUp(parseInt(v[0].toString())))}
                        // onInput={(v) => setMaxTokens(scaleUp(parseInt(v[0])))}
                        step={1}
                        getValueLabel={(_params) => maxTokens().toString()}
                        class="space-y-3"
                    >
                        <div class="flex w-full justify-between">
                            <SliderLabel>Max Tokens</SliderLabel>
                            <SliderValueLabel />
                        </div>
                        <SliderTrack>
                            <SliderFill />
                            <SliderThumb />
                        </SliderTrack>
                    </Slider>
                </div>
            </PopoverContent>
        </Popover>)
}
