export async function readApiResponse(response: Response) {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    if (
      response.status === 401 ||
      response.status === 403 ||
      response.redirected ||
      response.ok
    )
      throw new Error(
        "Your hosting session may have expired. Reload this page to sign in again.",
      );
    throw new Error(
      `The colony is temporarily unavailable (${response.status}). Please retry.`,
    );
  }
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Request failed. Please retry.");
  return data;
}
