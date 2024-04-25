import { type ReactElement } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import { Component } from "~/components/Component";
import type {
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import { type NextPageWithLayout } from "~/pages/_app";
import { ssgHelper } from "~/utils/ssg";
import { renderToReactServerComponents } from "~/utils/render";
import { clientComponents } from "~/utils/available-client-components";

const ComponentPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ component, rsc }) => {
  // Find the last revision and return it's id
  const lastRevisionId =
    component.revisions[component.revisions.length - 1]!.id;

  return (
    <Component
      component={component}
      revisionId={lastRevisionId}
      code={{
        source: component.code,
        rsc,
      }}
    />
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
        rsc: component.code.startsWith("import")
          ? null
          : await renderToReactServerComponents(
              component.code,
              clientComponents,
            ),
      },
    };
  }
};

export default ComponentPage;
