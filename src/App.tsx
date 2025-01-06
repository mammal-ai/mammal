import { createSignal } from "solid-js";
import IconSidebar from "./components/IconSidebar";
import { Bot, ChartColumn, Folders, HardDriveUpload, MessageSquareText } from "lucide-solid";
import "./App.css";
import MessagesView from "./views/MessagesView";
import ModelsView from "./views/ModelsView";
import OrganizerView from "./views/OrganizerView";
import DeploymentsView from "./views/DeploymentsView";
import BenchmarksView from "./views/BenchmarksView";
import { Page } from "./components/Page";
// import { ModelProviderProvider } from "./state/ModelProviderContext";
// import { ModelSettingsProvider } from "./state/ModelSettingsContext";

const sidebarItems = [{
  title: "Conversations",
  icon: MessageSquareText
}, {
  title: "Organize",
  icon: Folders
}, {
  title: "Benchmarks",
  icon: ChartColumn
}, {
  title: "Deployments",
  icon: HardDriveUpload
}, {
  title: "Models",
  icon: Bot
}]

function App() {
  const [activeItem, setActiveItem] = createSignal(0);

  return (
    <main class="flex flex-row w-screen h-screen">
      <IconSidebar items={sidebarItems} activeItem={activeItem} setActiveItem={setActiveItem} />
      <div class='relative flex-1 flex h-full overflow-hidden'>
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
    </main>
  );
}

export default App;
