import { type ReactElement } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import { type NextPageWithLayout } from "./_app";

const Home: NextPageWithLayout = () => {
  return <div className="flex h-full flex-grow flex-col">hello world</div>;
};

Home.getLayout = (page: ReactElement) => (
  <ApplicationLayout>{page}</ApplicationLayout>
);

export default Home;
