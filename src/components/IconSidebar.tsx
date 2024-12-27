import { JSX } from "solid-js/jsx-runtime"
import { MammalIcon } from "./MammalIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "../shadcn/components/Tooltip"
import { Accessor } from "solid-js"
import { cn } from "../shadcn/utils"

const SIDEBAR_WIDTH = "3rem"

interface SidebarItemProps {
    title: string
    icon: (props: any) => JSX.Element
}

interface SidebarProps {
    items: SidebarItemProps[]
    activeItem: Accessor<number>
    setActiveItem: (index: number) => void
}
const IconSidebar = ({ items, activeItem, setActiveItem }: SidebarProps) => {
    return (
        <div
            class={`flex flex-col items-center h-screen bg-gray-50 space-y-1 border-r-[1px] border-gray-200`}
            style={{
                width: SIDEBAR_WIDTH,
            }}>
            <MammalIcon class="m-2 p-1 text-gray-50 bg-gray-800 rounded-lg" />
            {items.map((item, index) => (
                <Tooltip placement="right">
                    <TooltipTrigger>
                        <button
                            class={cn(`flex items-center justify-center w-8 h-8 p-2 m-1 rounded border-none shadow-none hover:bg-gray-200 hover:text-gray-700 active:scale-95 active:bg-gray-300`, activeItem() === index ? " text-gray-800 bg-gray-200" : " text-gray-500")}
                            onClick={() => setActiveItem(index)}>
                            <item.icon class="text" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>{item.title}</TooltipContent>
                </Tooltip>
            ))}
        </div>
    )
}
export default IconSidebar