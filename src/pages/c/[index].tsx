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
import { isModern, modernTemplate } from "~/utils/utils";

const ComponentPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ component, rsc }) => {
  // Find the last revision and return it's id
  const lastRevisionId =
    component.revisions[component.revisions.length - 1]!.id;

  const source = isModern(component.code)
    ? modernTemplate(component.code)
    : component.code;

  return (
    <Component
      component={component}
      revisionId={lastRevisionId}
      code={{
        source,
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
        component,
        rsc: isModern(component.code)
          ? await renderToReactServerComponents(
              component.code,
              clientComponents,
            )
          : undefined,
      },
    };
  }
};

export default ComponentPage;
