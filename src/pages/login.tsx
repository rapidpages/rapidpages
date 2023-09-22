import Link from "next/link";
import { UserAuthForm } from "~/components/UserAuthForm";
import { type ReactElement } from "react";
import { AuthLayout } from "~/components/AuthLayout";
import { Logo } from "~/components/LogoLarge";
import { type NextPageWithLayout } from "./_app";

const LoginPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="flex flex-col">
        <Link href="/" aria-label="Home">
          <Logo className="h-10 w-auto" />
        </Link>
        <div className="mt-20">
          <h2 className="text-lg font-semibold text-gray-900">
            Sign in to your account
          </h2>
        </div>
      </div>
      <UserAuthForm />
    </>
  );
};

LoginPage.getLayout = (page: ReactElement) => (
  <AuthLayout title="Login">{page}</AuthLayout>
);

export default LoginPage;
