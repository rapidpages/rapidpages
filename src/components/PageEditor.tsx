import { useLayoutEffect, useRef } from "react";

interface PageEditorProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
}

export const PageEditor = ({ code }: PageEditorProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
  }, [code]);

  return (
    <iframe
      onLoad={() => {
        // Flush buffered code
        const value = bufferedCodeBeforeLoadedRef.current;
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({
            type: "rsc",
            value,
          }),
        );
        bufferedCodeBeforeLoadedRef.current = null;
      }}
      title="The editor's rendered HTML document"
      src="/g/index.html"
      ref={iframeRef}
      className="absolute inset-0 overflow-hidden rounded-b-lg w-full h-full"
    />
  );
};
