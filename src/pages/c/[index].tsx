import { type ReactElement } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { ApplicationLayout } from "~/components/AppLayout";
import { ResizeHandle } from "~/components/ResizeHandle";
import { SideMenu } from "~/components/SideMenu";
import { EditorTabs } from "~/components/EditorTabs";
import { ComponentProvider } from "~/context/ComponentProvider";
import { Chat } from "~/components/Chat";
import type {
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import { type NextPageWithLayout } from "~/pages/_app";
import { ssgHelper } from "~/utils/ssg";
import { useSession } from "next-auth/react";

const ComponentPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ component }) => {
  const { data: session } = useSession();
  // Find the last revision and return it's id
  const lastRevisionId =
    component.revisions[component.revisions.length - 1]!.id;

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
                <EditorTabs code={component.code} revisionId={lastRevisionId} />
                {session && session.user.id === component.authorId && (
                  <Chat revisionId={lastRevisionId} />
                )}
              </Panel>
            </PanelGroup>
          </div>
        </ComponentProvider>
      </div>
    </>
  );
};

ComponentPage.getLayout = (page: ReactElement) => (
  <ApplicationLayout>{page}</ApplicationLayout>
);

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const componentId = context.params?.index as string;
  const { ssg } = await ssgHelper(context);

  const component = await ssg.component.getComponent.fetch(componentId);

  if (!component) {
    return {
      notFound: true,
    };
  } else {
    return {
      props: {
        trpcState: ssg.dehydrate(),
        component,
      },
    };
  }
};

export default ComponentPage;
