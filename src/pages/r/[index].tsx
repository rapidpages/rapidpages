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
import { isModern, modernTemplate } from "~/utils/utils";

const RevisionPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ component, revisionId, rsc }) => {
  let source = component.revisions.find(
    (revision) => revision.id === revisionId,
  )!.code;

  if (isModern(source)) {
    source = modernTemplate(source);
  }

  return (
    <Component
      component={component}
      revisionId={revisionId}
      code={{ source, rsc }}
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
        component,
        revisionId,
        rsc: isModern(code)
          ? await renderToReactServerComponents(code, clientComponents)
          : undefined,
      },
    };
  }
};

export default RevisionPage;
