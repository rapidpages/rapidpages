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
import { privateApi } from "~/server/api/private";
import { PlanStatus } from "@prisma/client";
import { plans } from "~/plans";

const ComponentPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ plan, component, rsc }) => {
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
      plan={plan}
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
  const { ssg, session } = await ssgHelper(context);

  const component = await ssg.component.getComponent.fetch(componentId);

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

    return {
      props: {
        plan,
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
