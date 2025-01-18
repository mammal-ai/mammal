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
        class="max-w-full w-full flex flex-row border-b bg-gray-50 text-sm text-gray-600 leading-tight hover:bg-gray-100 hover:text-gray-900 border-l-transparent hover:border-l-gray-300"
        style={{
            "border-left-width": "4px",
            "border-left-style": "solid",
            ...(props.active ? {
                "border-left-color": "#3182ce",
                "background": "#eff6ff"
            } : {})
        }}
        onMouseEnter={() => props.setIsHovered(true)}
        onMouseLeave={() => props.setIsHovered(false)}
    >
        {props.children}
    </button>

export default MessageListButton