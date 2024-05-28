import { Panel, PanelGroup } from "react-resizable-panels";
import { ResizeHandle } from "~/components/ResizeHandle";
import { SideMenu } from "~/components/SideMenu";
import { EditorTabs, type EditorTabsCode } from "~/components/EditorTabs";
import { ComponentProvider } from "~/context/ComponentProvider";
import { Chat } from "~/components/Chat";
import { useSession } from "next-auth/react";
import {
  type Component as ComponentType,
  type ComponentRevision,
} from "@prisma/client";
import { type ReactNode } from "react";
import { type PlanTypes } from "~/plans";

export const Component = ({
  component,
  code,
  revisionId,
  plan,
}: {
  component: ComponentType & { revisions: ComponentRevision[] };
  code: EditorTabsCode;
  revisionId: string;
  plan: {
    type: PlanTypes["type"];
    credits: number;
  } | null;
}) => {
  const { data: session } = useSession();

  const canRevise = session && session.user.id === component.authorId && plan;
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
                className="flex h-full flex-col pr-3 pb-3"
              >
                <EditorTabs code={code} revisionId={revisionId} />
                {canRevise ? (
                  plan.type === "free-unlimited" ? (
                    <Chat revisionId={revisionId} />
                  ) : plan.credits > 0 ? (
                    <>
                      <Chat revisionId={revisionId} />{" "}
                      <CreditsInfo>{plan.credits} credits left</CreditsInfo>
                    </>
                  ) : (
                    <CreditsInfo>
                      No credits left.
                      {plan.type === "free" ? " Please upgrade." : ""}
                    </CreditsInfo>
                  )
                ) : null}
              </Panel>
            </PanelGroup>
          </div>
        </ComponentProvider>
      </div>
    </>
  );
};

const CreditsInfo = ({ children }: { children: ReactNode }) => {
  return <p className="text-sm flex justify-end mt-1 px-3">{children}</p>;
};
