import { launchRunner } from "../../services/netlify-runtime.mjs";
import { authConfigured } from "../../services/operator-auth.mjs";
export default async function handler() {
  if (
    authConfigured(process.env) &&
    process.env.URL &&
    process.env.PUBLIC_COLONY === "true"
  )
    await launchRunner(process.env.URL, process.env.OPERATOR_SECRET);
}
export const config = { schedule: "* * * * *" };
