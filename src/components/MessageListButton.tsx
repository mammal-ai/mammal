import { Accessor, JSX, Setter } from "solid-js"

type MessageListButtonProps = {
    active: boolean
    isHovered: Accessor<boolean>
    setIsHovered: Setter<boolean>
    onClick: () => void
    children: JSX.Element
}
const MessageListButton = (props: MessageListButtonProps) =>
    <button
        onClick={props.onClick}
        class="max-w-full w-full flex flex-row border-b bg-gray-50 text-sm text-gray-600 leading-tight hover:bg-gray-100 hover:text-gray-900 border-r-transparent hover:border-r-gray-300"
        style={{
            "border-right-width": "4px",
            "border-right-style": "solid",
            ...(props.active ? {
                "border-right-color": "#3182ce",
            } : {})
        }}
        onMouseEnter={() => props.setIsHovered(true)}
        onMouseLeave={() => props.setIsHovered(false)}
    >
        {props.children}
    </button>

export default MessageListButton