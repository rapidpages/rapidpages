"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { cn } from "~/utils/utils";
import { useRouter } from "next/router";

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>;

export const UserAuthForm = ({ className, ...props }: UserAuthFormProps) => {
  const router = useRouter();

  return (
    <div className={cn("mt-6 grid gap-6", className)} {...props}>
      {/* <button
        type="button"
        className="inline-flex w-full items-center justify-center rounded-lg border bg-white px-5  text-center text-sm font-medium text-black hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-[#24292F]/50 dark:hover:bg-[#050708]/30 dark:focus:ring-slate-500"
        onClick={() => signIn("google", { callbackUrl: "/" })}
      >
        <svg
          width="46px"
          height="46px"
          viewBox="0 0 46 46"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
              filterUnits="objectBoundingBox"
              id="filter-1"
            >
              <feOffset
                dx="0"
                dy="1"
                in="SourceAlpha"
                result="shadowOffsetOuter1"
              ></feOffset>
              <feGaussianBlur
                stdDeviation="0.5"
                in="shadowOffsetOuter1"
                result="shadowBlurOuter1"
              ></feGaussianBlur>
              <feColorMatrix
                values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.168 0"
                in="shadowBlurOuter1"
                type="matrix"
                result="shadowMatrixOuter1"
              ></feColorMatrix>
              <feOffset
                dx="0"
                dy="0"
                in="SourceAlpha"
                result="shadowOffsetOuter2"
              ></feOffset>
              <feGaussianBlur
                stdDeviation="0.5"
                in="shadowOffsetOuter2"
                result="shadowBlurOuter2"
              ></feGaussianBlur>
              <feColorMatrix
                values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.084 0"
                in="shadowBlurOuter2"
                type="matrix"
                result="shadowMatrixOuter2"
              ></feColorMatrix>
              <feMerge>
                <feMergeNode in="shadowMatrixOuter1"></feMergeNode>
                <feMergeNode in="shadowMatrixOuter2"></feMergeNode>
                <feMergeNode in="SourceGraphic"></feMergeNode>
              </feMerge>
            </filter>
            <rect id="path-2" x="0" y="0" width="40" height="40" rx="2"></rect>
          </defs>
          <g
            id="Google-Button"
            stroke="none"
            strokeWidth="1"
            fill="none"
            fillRule="evenodd"
          >
            <g id="9-PATCH" transform="translate(-608.000000, -160.000000)"></g>
            <g
              id="btn_google_light_normal"
              transform="translate(-1.000000, -1.000000)"
            >
              <g
                id="button"
                transform="translate(4.000000, 4.000000)"
                filter="url(#filter-1)"
              >
                <g id="button-bg">
                  <use fill="#FFFFFF" fillRule="evenodd"></use>
                  <use fill="none"></use>
                  <use fill="none"></use>
                  <use fill="none"></use>
                </g>
              </g>
              <g
                id="logo_googleg_48dp"
                transform="translate(15.000000, 15.000000)"
              >
                <path
                  d="M17.64,9.20454545 C17.64,8.56636364 17.5827273,7.95272727 17.4763636,7.36363636 L9,7.36363636 L9,10.845 L13.8436364,10.845 C13.635,11.97 13.0009091,12.9231818 12.0477273,13.5613636 L12.0477273,15.8195455 L14.9563636,15.8195455 C16.6581818,14.2527273 17.64,11.9454545 17.64,9.20454545 L17.64,9.20454545 Z"
                  id="Shape"
                  fill="#4285F4"
                ></path>
                <path
                  d="M9,18 C11.43,18 13.4672727,17.1940909 14.9563636,15.8195455 L12.0477273,13.5613636 C11.2418182,14.1013636 10.2109091,14.4204545 9,14.4204545 C6.65590909,14.4204545 4.67181818,12.8372727 3.96409091,10.71 L0.957272727,10.71 L0.957272727,13.0418182 C2.43818182,15.9831818 5.48181818,18 9,18 L9,18 Z"
                  id="Shape"
                  fill="#34A853"
                ></path>
                <path
                  d="M3.96409091,10.71 C3.78409091,10.17 3.68181818,9.59318182 3.68181818,9 C3.68181818,8.40681818 3.78409091,7.83 3.96409091,7.29 L3.96409091,4.95818182 L0.957272727,4.95818182 C0.347727273,6.17318182 0,7.54772727 0,9 C0,10.4522727 0.347727273,11.8268182 0.957272727,13.0418182 L3.96409091,10.71 L3.96409091,10.71 Z"
                  id="Shape"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M9,3.57954545 C10.3213636,3.57954545 11.5077273,4.03363636 12.4404545,4.92545455 L15.0218182,2.34409091 C13.4631818,0.891818182 11.4259091,0 9,0 C5.48181818,0 2.43818182,2.01681818 0.957272727,4.95818182 L3.96409091,7.29 C4.67181818,5.16272727 6.65590909,3.57954545 9,3.57954545 L9,3.57954545 Z"
                  id="Shape"
                  fill="#EA4335"
                ></path>
                <path d="M0,0 L18,0 L18,18 L0,18 L0,0 Z" id="Shape"></path>
              </g>
              <g id="handles_square"></g>
            </g>
          </g>
        </svg>
        Sign in with Google
      </button> */}
      <button
        type="button"
        className="inline-flex w-full items-center justify-center rounded-lg border bg-white px-5  text-center text-sm font-medium text-black hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-[#24292F]/50 dark:hover:bg-[#050708]/30 dark:focus:ring-slate-500"
        onClick={() =>
          signIn("github", {
            callbackUrl:
              typeof router.query?.redirect === "string"
                ? router.query.redirect
                : "/",
          })
        }
      >
        <svg
          width="46px"
          height="46px"
          viewBox="-24 -28 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
            transform="scale(2.8)"
            fill="#1B1F23"
          />
        </svg>
        Sign in with Github
      </button>
    </div>
  );
};
