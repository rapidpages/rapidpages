import { PanelResizeHandle } from "react-resizable-panels";
import { cn } from "~/utils/utils";

export const ResizeHandle = ({
  className = "",
  collapsed = false,
  id,
}: {
  className?: string;
  collapsed?: boolean;
  id?: string;
}) => {
  return (
    <PanelResizeHandle
      // ResizeHandleOuter
      className={cn([
        "--background-color:transparent flex flex-[0_0_2.5rem] items-stretch justify-stretch p-1 outline-none sm:flex-[0_0_1rem]",
        "group",
        className,
      ])}
      id={id}
    >
      <div
        // ResizeHandleInner
        className={cn([
          "relative flex-1 rounded-xl bg-transparent transition-[background-color] duration-[0.2s] ease-linear",
          "after:absolute after:left-[calc(50%_-_0.5rem)] after:top-[calc(50%_-_0.5rem)] after:flex after:h-4 after:w-4 after:items-center after:justify-center after:text-base after:text-[#39414d]",
          "[data-collapsed]:bg-[#39414d]",
          "group-[[data-resize-handle-active]]:bg-[#39414d] ",
        ])}
        data-collapsed={collapsed || undefined}
      >
        {/* Horizontal Icon */}
        <svg
          className={cn([
            "h-4 w-4 flex-[0_0_1rem] fill-current",
            "absolute left-[calc(50%_-_0.5rem)] top-[calc(50%_-_0.5rem)] text-[#39414d]",
            'group[[data-panel-group-direction="horizontal"]]:block',
            'group-[[data-panel-group-direction="vertical"]]:hidden',
            "group-[[data-resize-handle-active]]:hidden",
          ])}
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M18,16V13H15V22H13V2H15V11H18V8L22,12L18,16M2,12L6,16V13H9V22H11V2H9V11H6V8L2,12Z"
          />
        </svg>
        {/* Vertical Icon */}
        <svg
          className={cn([
            "h-4 w-4 flex-[0_0_1rem] fill-current",
            "absolute left-[calc(50%_-_0.5rem)] top-[calc(50%_-_0.5rem)] text-[#39414d]",
            'group-[[data-panel-group-direction="vertical"]]:block',
            'group-[[data-panel-group-direction="horizontal"]]:hidden',
            "group-[[data-resize-handle-active]]:hidden",
          ])}
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M8,18H11V15H2V13H22V15H13V18H16L12,22L8,18M12,2L8,6H11V9H2V11H22V9H13V6H16L12,2Z"
          />
        </svg>
      </div>
    </PanelResizeHandle>
  );
};
