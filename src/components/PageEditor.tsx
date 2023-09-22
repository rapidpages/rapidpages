import { PlusIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { type CanvasWrapperRef } from "~/components/CanvasWrapper";
import { compileTypescript } from "~/utils/compiler";

interface MyProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
}

export const PageEditor = ({ code }: MyProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<CanvasWrapperRef>(null);
  const [dom, setDom] = useState<string | undefined>(undefined);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showNewSectionModal, setShowNewSectionModal] =
    useState<boolean>(false);

  const handleNewSectionModalClose = () => {
    setShowNewSectionModal(false);
  };

  useEffect(() => {
    // Compile and render the page
    const compileCode = async () => {
      const compiledCode = await compileTypescript(code);
      setDom(compiledCode);
    };

    // We resize the canvas to fit the screen. This is not ideal, but it works for now.
    const handleResize = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const { contentWindow } = iframeRef.current;
      if (contentWindow) {
        const { documentElement } = contentWindow.document;
        const width = documentElement.clientWidth;
        const height = documentElement.clientHeight;
        setDimensions({ width, height });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Compile the code
    compileCode();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [code]);

  const handleScroll = (event: React.WheelEvent) => {
    if (!iframeRef.current) return;
    if (!iframeRef.current.contentWindow) return;
    iframeRef.current.contentWindow.scrollBy(0, event.deltaY);

    // scrollTop = iframeRef.current.scrollTop + event.deltaY;
  };

  // useEffect(() => {
  //   const renderPage = async () => {
  //     const iframe = iframeRef.current;
  //     if (iframe && page) {
  //       const reactor = Reactor.getInstance();
  //       const reactorIFrame = reactor.getIFrame();

  //       // Prepare the react elements

  //       // We only want to set the document once
  //       if (!reactorIFrame) {
  //         reactor.setIFrame(iframe);
  //       }

  //       // Compile and render the page
  //       await reactor.compile();
  //     }
  //   };

  //   renderPage().catch(console.error);
  // }, [page]);

  return (
    <div className="absolute inset-0 flex justify-center">
      <div
        className="absolute inset-0 overflow-hidden rounded-b-lg"
        onWheel={handleScroll}
      >
        <iframe
          width="100%"
          height="100%"
          tabIndex={-1}
          title="The editor's rendered HTML document"
          srcDoc={dom}
          ref={iframeRef}
          className="pointer-events-none mx-auto my-0 block w-full min-w-[769] overflow-hidden border-0"
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
        {/* <CanvasWrapper
            className="pointer-events-none absolute left-0 top-0 z-10 box-border"
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onAILassoFinished={() => {
              console.log("finished");
            }}
          /> */}
      </div>
    </div>
  );
};
