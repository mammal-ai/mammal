import { onMount, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import IconSidebar from "./components/IconSidebar";
import {
  Bot,
  ChartColumn,
  Folders,
  HardDriveUpload,
  MessageSquareText,
} from "lucide-solid";
import "./App.css";
import { ToastRegion, ToastList } from "./shadcn/components/Toast";
import MessagesView from "./views/MessagesView";
import ModelsView from "./views/ModelsView";
import OrganizerView from "./views/OrganizerView";
import DeploymentsView from "./views/DeploymentsView";
import BenchmarksView from "./views/BenchmarksView";
import { Page } from "./components/Page";
import { checkForNewModels } from "./state/UpdatedModelProviderInfo";

function App() {
  const [activeItem, setActiveItem] = createSignal(0);

  const [sidebarItems, setSidebarItems] = createStore([
    {
      title: "Conversations",
      icon: MessageSquareText,
      badge: false,
    },
    {
      title: "Organize",
      icon: Folders,
      badge: false,
    },
    {
      title: "Benchmarks",
      icon: ChartColumn,
      badge: false,
    },
    {
      title: "Deployments",
      icon: HardDriveUpload,
      badge: false,
    },
    {
      title: "Models",
      icon: Bot,
      badge: false,
    },
  ]);

  onMount(async () => {
    console.log("Checking for new models");
    const newModels = await checkForNewModels();
    console.log("New models:", newModels);
    const modelsIndex = sidebarItems.findIndex(
      (item) => item.title === "Models"
    );
    if (modelsIndex === -1) {
      console.error("Models is not found in sidebar items");
      return;
    }
    setSidebarItems(modelsIndex, "badge", newModels);
  });

  return (
    <main class="flex flex-row w-screen h-screen">
      <IconSidebar
        items={sidebarItems}
        activeItem={activeItem}
        setActiveItem={setActiveItem}
      />
      <div class="relative flex-1 flex h-full overflow-hidden">
        <MessagesView />
        {/* We could wrap MessagesView in a Page, but I prefer the feeling that it is stable and other things move on top of it
            In particular, I don't like the MessageList Sidebar sliding into place.
            So this feels more appropriate */}
        <Page isOpen={activeItem() !== 0}>
          <OrganizerView isOpen={activeItem() === 1} />
          <BenchmarksView isOpen={activeItem() === 2} />
          <DeploymentsView isOpen={activeItem() === 3} />
          <ModelsView isOpen={activeItem() === 4} />
        </Page>
      </div>
      <ToastRegion>
        <ToastList />
      </ToastRegion>
    </main>
  );
}

export default App;
