import { JSX, Setter } from "solid-js";
import { cn } from "../shadcn/utils";

const DEFAULT_CLASSES = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-shadow file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

type TextFieldProps = {
    class?: string;
    placeholder?: string;
    value: string;
    setValue: Setter<string>;
    onBlur?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>,
    onFocus?: JSX.FocusEventHandlerUnion<HTMLInputElement, FocusEvent>,
    onKeyUp?: JSX.EventHandlerUnion<HTMLInputElement, KeyboardEvent, JSX.EventHandler<HTMLInputElement, KeyboardEvent>>;
    ref?: HTMLInputElement;
};
const TextField = (props: TextFieldProps) =>
    <input
        ref={props?.ref}
        type="text"
        class={cn(DEFAULT_CLASSES, props.class)}
        placeholder={props.placeholder}
        value={props.value}
        onInput={e => props.setValue(e.currentTarget.value)}
        onChange={e => props.setValue(e.currentTarget.value)}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        onKeyUp={props.onKeyUp}
    />
export { TextField };