import { type ReactElement } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import { Component } from "~/components/Component";
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
  // Find the last revision and return it's id
  const lastRevisionId =
    component.revisions[component.revisions.length - 1]!.id;

  return (
    <Component
      component={component}
      revisionId={lastRevisionId}
      code={{
        source: component.code,
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
      },
    };
  }
};

export default ComponentPage;
