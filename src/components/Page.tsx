import { JSX } from "solid-js";

type PageProps = {
  isOpen: boolean;
  children: JSX.Element;
};
export const Page = (props: PageProps) => {
  return (
    <div
      class="absolute inset-0 bg-background z-10 overflow-x-hidden overflow-y-auto max-h-screen"
      style={{
        opacity: props.isOpen ? 1 : 0,
        transform: `translateX(${props.isOpen ? 0 : "3rem"})`,
        transition: "opacity 120ms ease-in-out, transform 120ms ease-in-out",
        "pointer-events": props.isOpen ? "auto" : "none",
      }}
    >
      {props.children}
    </div>
  );
};
