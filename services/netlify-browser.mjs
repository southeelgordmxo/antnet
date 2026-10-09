import chromium from "@sparticuz/chromium";
import { browserRead, closeBrowser } from "./browser-engine.mjs";

export function attachNetlifyBrowser(env) {
  if (env.NETLIFY_BROWSER_ENABLED !== "true") return;
  env.READ_BROWSER = async (url, options = {}) =>
    browserRead(
      url,
      (
        env.CRAWL_ALLOWED_HOSTS ||
        "ethereum.org,solana.com,bitcoin.org,developers.uniswap.org,docs.chain.link,aave.com"
      )
        .split(",")
        .map((h) => h.trim()),
      {
        launch: {
          args: chromium.args,
          executablePath: await chromium.executablePath(),
        },
        allowNavigation: options.allowNavigation,
        onFrame: options.antId
          ? async (bytes, frameUrl) => {
              await env.SAVE_FRAME(options.antId, bytes);
              await env.DB.prepare(
                "INSERT INTO events(id,order_id,ant_id,kind,url,message,created) VALUES(?,?,?,?,?,?,?)",
              )
                .bind(
                  crypto.randomUUID(),
                  options.orderId,
                  options.antId,
                  "frame",
                  frameUrl,
                  "Browser captured the source page",
                  new Date().toISOString(),
                )
                .run();
            }
          : undefined,
      },
    );
}
export { closeBrowser };
