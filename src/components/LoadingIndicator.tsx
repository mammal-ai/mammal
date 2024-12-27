import { Accessor } from "solid-js"
import "./LoadingIndicator.css"

type LoadingIndicatorProps = {
    isLoading: Accessor<boolean>
}
export const LoadingIndicator = ({ isLoading }: LoadingIndicatorProps) => <div class="flex items-center justify-center w-full scale-75"><span class="loader"
    style={{
        opacity: isLoading() ? 1 : 0,
        transition: "opacity 120ms ease-in-out",
        "pointer-events": isLoading() ? "auto" : "none",
    }}
></span></div>