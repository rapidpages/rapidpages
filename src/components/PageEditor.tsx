import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { compileTypescript } from "~/utils/compiler";

interface MyProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
}

export const PageEditor = ({ code }: MyProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const bufferedCodeBeforeLoadedRef = useRef<string | null>(code);

  useLayoutEffect(() => {
    if (bufferedCodeBeforeLoadedRef.current == null) {
      // Done buffering, iframe.onLoad has fired so we can post single chunks.
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ type: "rsc", value: code, done: code === "[done]" }),
      );
    } else {
      // iframe.onLoad hasn't fired yet so we should buffer.
      bufferedCodeBeforeLoadedRef.current += `${code}`;
    }

    // if (code === "[done]") {
    //   iframeRef.current?.contentWindow?.postMessage(
    //     JSON.stringify({ type: "rsc", value: code, done: code === "[done]" }),
    //   );
    // } else {
    //   bufferedCodeBeforeLoadedRef.current += `${code}\n`;
    // }

    // // We resize the canvas to fit the screen. This is not ideal, but it works for now.
    // const handleResize = () => {
    //   const iframe = iframeRef.current;
    //   if (!iframe) return;
    //   const { contentWindow } = iframeRef.current;
    //   if (contentWindow) {
    //     const { documentElement } = contentWindow.document;
    //     const width = documentElement.clientWidth;
    //     const height = documentElement.clientHeight;
    //     setDimensions({ width, height });
    //   }
    // };
    // handleResize();
    // window.addEventListener("resize", handleResize);

    // return () => {
    //   window.removeEventListener("resize", handleResize);
    // };
  }, [code]);

  const handleScroll = (event: React.WheelEvent) => {
    if (!iframeRef.current) return;
    if (!iframeRef.current.contentWindow) return;
    iframeRef.current.contentWindow.scrollBy(0, event.deltaY);

    // scrollTop = iframeRef.current.scrollTop + event.deltaY;
  };

  return (
    <div className="absolute inset-0 flex justify-center">
      <div
        className="absolute inset-0 overflow-hidden rounded-b-lg"
        onWheel={handleScroll}
      >
        <iframe
          onLoad={() => {
            // Flush buffered code
            const value = bufferedCodeBeforeLoadedRef.current;
            console.log("onLoad", value);
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({
                type: "rsc",
                value,
              }),
            );
            bufferedCodeBeforeLoadedRef.current = null;
          }}
          width="100%"
          height="100%"
          tabIndex={-1}
          title="The editor's rendered HTML document"
          src="/g/index.html"
          ref={iframeRef}
          className="mx-auto my-0 block w-full min-w-[769] overflow-hidden border-0"
        />
        <div className="pointer-events-none absolute inset-y-0 flex max-w-full">
          <svg
            id="SVGOverlay"
            className="overflow-visible"
            width={dimensions.width}
            height={dimensions.height}
            ref={svgRef}
            // style="transform: translate3d(0px, 0px, 0px);"
          >
            <rect id="SVGSelection"></rect>
            <rect id="SVGHover"></rect>
          </svg>
        </div>
      </div>
    </div>
  );
};
