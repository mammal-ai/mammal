import { createSignal } from "solid-js";
import { Page } from "../components/Page";
import { Button } from "../shadcn/components/Button";
import { PlusCircle } from "lucide-solid";
import { AddProviderDialog } from "../components/AddProviderDialog";
import ModelProviderListView from "../components/ModelProviderListView";

const ModelsView = (props: { isOpen: boolean }) => {
  const [addProviderMode, setAddProviderMode] = createSignal(false);

  return (
    <Page isOpen={props.isOpen}>
      <div class="flex flex-col space-y-4 mx-auto min-w-[36rem] max-w-[48rem] p-6 mt-2">
        <div class="flex flex-row items-center justify-between mb-2">
          <span class="font-bold text-2xl">Model Providers</span>

          <Button
            class={
              "flex flex-row spaxe-x-2" +
              (addProviderMode() ? " opacity-0" : "")
            }
            onClick={() => setAddProviderMode(true)}
          >
            <PlusCircle class="h-4 w-4" />
            Add Provider
          </Button>
        </div>

        <AddProviderDialog
          show={addProviderMode()}
          onHide={() => setAddProviderMode(false)}
        />

        <ModelProviderListView />
      </div>
    </Page>
  );
};
export default ModelsView;
