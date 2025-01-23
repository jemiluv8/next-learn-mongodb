import { NextRequest } from "next/server";
import { getSignedURL, GetSignedURLParams } from "@/app/lib/actions/aws";

export async function POST(request: NextRequest) {
  try {
    const requestData = (await request.json()) as GetSignedURLParams;
    const response = await getSignedURL(requestData);
    return Response.json(response);
  } catch (error) {
    return Response.json({ error: "Something went wrong", rawError: error });
  }
}
