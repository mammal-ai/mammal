import { Lightbulb } from "lucide-solid";
import { Page } from "../components/Page";

const DeploymentsView = (props: { isOpen: boolean }) => {
  return (
    <Page isOpen={props.isOpen}>
      <div class="h-full w-full flex flex-col items-center justify-center text-gray-400">
        <Lightbulb class="w-64 h-64" />
        <span class="font-bold text-2xl mt-6">
          Deployments is still only an idea...
        </span>
      </div>
    </Page>
  );
};
export default DeploymentsView;
