import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";

export default function TooltipComponent({ children, content }: { children: React.ReactNode, content: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
