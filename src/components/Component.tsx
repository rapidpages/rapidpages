import { Panel, PanelGroup } from "react-resizable-panels";
import { ResizeHandle } from "~/components/ResizeHandle";
import { SideMenu } from "~/components/SideMenu";
import { EditorTabs } from "~/components/EditorTabs";
import { ComponentProvider } from "~/context/ComponentProvider";
import { Chat } from "~/components/Chat";
import { useSession } from "next-auth/react";

export const Component = ({ component, code, revisionId }) => {
  const { data: session } = useSession();

  return (
    <>
      <div className="flex h-full flex-grow flex-col">
        <ComponentProvider>
          <div className="flex min-w-0 flex-grow overflow-hidden bg-neutral-100">
            <PanelGroup direction="horizontal">
              {/* Left Menu */}
              <Panel defaultSize={20} minSize={20} className="py-3 pl-3">
                <SideMenu revisions={component.revisions} />
              </Panel>
              {/* Preview Area */}
              <ResizeHandle />
              <Panel
                defaultSize={80}
                minSize={30}
                className="flex h-full flex-col pr-3"
              >
                <EditorTabs code={code} revisionId={revisionId} />
                {session && session.user.id === component.authorId && (
                  <Chat revisionId={revisionId} />
                )}
              </Panel>
            </PanelGroup>
          </div>
        </ComponentProvider>
      </div>
    </>
  );
};
