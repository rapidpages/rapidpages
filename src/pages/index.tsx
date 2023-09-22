import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { type ReactElement } from "react";
import { ApplicationLayout } from "~/components/AppLayout";
import { api } from "~/utils/api";
import { type NextPageWithLayout } from "./_app";

const Home: NextPageWithLayout = () => {
  return <div className="flex h-full flex-grow flex-col">hello world</div>;
};

Home.getLayout = (page: ReactElement) => (
  <ApplicationLayout>{page}</ApplicationLayout>
);

export default Home;
