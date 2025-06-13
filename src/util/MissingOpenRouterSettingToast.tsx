import {
  Toast,
  ToastContent,
  ToastDescription,
  ToastProgress,
  ToastTitle,
} from "../shadcn/components/Toast";

interface ToastComponentProps {
  toastId: number;
}

export const MissingOpenRouterSettingToast = (props: ToastComponentProps) => (
  <Toast toastId={props.toastId} variant="destructive">
    <ToastContent>
      <ToastTitle>OpenRouter Provider Missing</ToastTitle>
      <ToastDescription>
        Could not complete request to OpenRouter because a provider selection
        has not been made.
      </ToastDescription>
    </ToastContent>
    <ToastProgress />
  </Toast>
);
