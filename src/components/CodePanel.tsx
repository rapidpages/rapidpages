import CodeMirror, { EditorState } from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";

const editorStyles = EditorView.baseTheme({
  "&": {
    fontSize: "0.875rem",
  },
  "&.cm-editor": {
    flex: "1",
    height: "100%",
    position: "relative",
  },
  ".cm-scroller": {
    position: "absolute !important",
    top: "0",
    right: "0",
    bottom: "0",
    left: "0",
    "overflow-y": "auto",
  },
  "&.cm-editor.cm-focused": {
    outline: "none",
  },
});

export const CodePanel = ({ code }: { code: string }) => {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-b-lg border border-l border-r border-t-0 border-gray-300 bg-gray-200 pt-2">
      <CodeMirror
        className="w-full flex-1 overflow-hidden rounded-b-lg border-0"
        value={code}
        theme={vscodeDark}
        extensions={[
          javascript({ jsx: true, typescript: true }),
          editorStyles,
          EditorView.lineWrapping,
          EditorState.readOnly.of(true),
        ]}
        editable={false}
      />
    </div>
  );
};
