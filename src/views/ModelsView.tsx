import { createSignal } from "solid-js";
import { Page } from "../components/Page";
import { Button } from "../shadcn/components/Button";
// import { Edit, PlusCircle, Sparkles, Trash2 } from "lucide-solid";
import { PlusCircle } from "lucide-solid";
import { AddProviderDialog } from "../components/AddProviderDialog";
import ModelProviderListView from "../components/ModelProviderListView";
// import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "../shadcn/components/Accordion";
// import {
//     Table,
//     TableHeader,
//     TableRow,
//     TableHead,
//     TableBody,
//     TableCell
// } from "../shadcn/components/Table";


// const models = [
//     { name: "Gemini Exp 1206 (Preview)", model: "gemini-exp-1206" },
//     { name: "Gemini 2.0 Flash (Preview)", model: "gemini-2.0-flash-exp" },
//     { name: "Gemini 1.5 Pro 002", model: "gemini-1.5-pro-002" },
//     { name: "Gemini Pro 1.5", model: "gemini-pro-1.5" },
//     { name: "Gemini 1.5 Flash", model: "gemini-1.5-flash" },
//     { name: "Gemini 1.5 Flash 002", model: "gemini-1.5-flash-002" },
//     { name: "Gemini 1.5 Flash 8B", model: "gemini-1.5-flash-8b" },
// ]


const ModelsView = (props: { isOpen: boolean }) => {
    const [addProviderMode, setAddProviderMode] = createSignal(false);

    return (
        <Page isOpen={props.isOpen}>
            <div class="flex flex-col space-y-4 mx-auto min-w-[36rem] max-w-[48rem] p-6 mt-2">
                <div class="flex flex-row items-center justify-between mb-2">
                    <span class="font-bold text-2xl">Model Providers</span>

                    <Button class={"flex flex-row spaxe-x-2" + (addProviderMode() ? " opacity-0" : "")} onClick={() => setAddProviderMode(true)}>
                        <PlusCircle class="h-4 w-4" />
                        Add Provider
                    </Button>
                </div>

                <AddProviderDialog show={addProviderMode()} onHide={() => setAddProviderMode(false)} />

                <ModelProviderListView />
            </div >
        </Page >
    )
}
export default ModelsView