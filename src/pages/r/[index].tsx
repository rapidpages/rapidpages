import { type ReactElement } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import type {
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import { type NextPageWithLayout } from "~/pages/_app";
import { ssgHelper } from "~/utils/ssg";
import { Component } from "~/components/Component";

const RevisionPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ component, revisionId }) => {
  const code = component.revisions.find(
    (revision) => revision.id === revisionId,
  )!.code;

  return (
    <Component
      component={component}
      revisionId={revisionId}
      code={{ source: code }}
    />
  );
};

RevisionPage.getLayout = (page: ReactElement) => (
  <ApplicationLayout>{page}</ApplicationLayout>
);

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const revisionId = context.params?.index as string;
  const { ssg } = await ssgHelper(context);

  const component =
    await ssg.component.getComponentFromRevision.fetch(revisionId);

  if (!component) {
    return {
      notFound: true,
    };
  } else {
    return {
      props: {
        trpcState: ssg.dehydrate(),
        component,
        revisionId,
      },
    };
  }
};

export default RevisionPage;
