import { NextResponse, type NextRequest } from "next/server";

// eslint-disable-next-line import/no-default-export
export default async function mniddleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  if (url.pathname === "/") {
    url.pathname = "/new";
    return NextResponse.redirect(url);
  }
}
