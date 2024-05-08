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
import { PlanStatus } from "@prisma/client";
import { privateApi } from "~/server/api/private";
import { plans } from "~/plans";

const RevisionPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ component, revisionId, rsc, plan }) => {
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
      plan={plan}
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
  const { ssg, session } = await ssgHelper(context);

  const component =
    await ssg.component.getComponentFromRevision.fetch(revisionId);

  if (!component) {
    return {
      notFound: true,
    };
  } else {
    let plan = null;

    if (session) {
      const userPlan = await privateApi.userPlan.getByUserId(session.user.id);

      if (userPlan) {
        const planInfo = plans.find((plan) => plan.id === userPlan.planId);

        if (planInfo) {
          plan = {
            type: planInfo.type,
            trial: userPlan.status !== PlanStatus.ACTIVE,
            credits: userPlan.credits,
          };
        }
      }
    }

    const code = component.revisions.find(
      (revision) => revision.id === revisionId,
    )!.code;

    return {
      props: {
        plan,
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
