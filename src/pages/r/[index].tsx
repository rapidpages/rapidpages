import { type ReactElement } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import type {
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import { type NextPageWithLayout } from "~/pages/_app";
import { ssgHelper } from "~/utils/ssg";
import { Component } from "~/components/Component";
import { clientComponents } from "~/utils/available-client-components";
import { renderToReactServerComponents } from "~/utils/render";

const RevisionPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ component, revisionId, rsc }) => {
  const code = component.revisions.find(
    (revision) => revision.id === revisionId,
  )!.code;

  return (
    <Component
      component={component}
      revisionId={revisionId}
      code={{ source: code, rsc }}
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
    const code = component.revisions.find(
      (revision) => revision.id === revisionId,
    )!.code;

    return {
      props: {
        trpcState: ssg.dehydrate(),
        component,
        revisionId,
        rsc: code.startsWith("import")
          ? null
          : await renderToReactServerComponents(code, clientComponents),
      },
    };
  }
};

export default RevisionPage;
