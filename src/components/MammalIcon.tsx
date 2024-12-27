import { JSX } from "solid-js/jsx-runtime";

export type IconProps = {
    class?: string;
    style?: JSX.CSSProperties;
};
export const MammalIcon = ({ class: className, style }: IconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        class={className}
        style={style}
        viewBox="0 0 200 200">
        <g fill="currentColor">
            <path d="M71.8 33.7a55 55 0 0 0-55.1 59.5V157c0 5.2 4.2 9.4 9.4 9.4h39.6V140a7.3 7.3 0 1 1 14.6 0v26.3h39.4V140a7.3 7.3 0 1 1 14.6 0v26.3h39.6c5.2 0 9.4-4.2 9.4-9.4V88.8a55 55 0 0 0-55-55h-22.6c-.2 9.6-1.3 20.8-.4 31 1 11.2 4 20.3 12.1 25.5a4.6 4.6 0 0 1 1.5 6.3 4.6 4.6 0 0 1-6.3 1.4C101 90.8 97.3 78 96.2 65.6c-1-11.3.2-22.9.4-31.9Zm84 33a7.3 7.3 0 1 1 0 14.6 7.3 7.3 0 0 1 0-14.6z"
            />
        </g>
    </svg>
)