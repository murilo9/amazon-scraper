import puppeteer from "puppeteer";

const CORS_HEADERS = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST",
    "Access-Control-Allow-Headers": "Content-Type",
  },
};

async function retryUntilSuccess(func, maxRetries = 5, delay = 500) {
  let retries = 0;

  while (retries < maxRetries) {
    const result = await func(); // Call the function
    console.log("result", result.length);
    if (result && result.length > 0) {
      return result; // Return the result if it's not empty
    }

    console.log(`Retrying... (${maxRetries - retries - 1} retries left)`);
    retries++;
    await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
  }

  throw new Error("Function failed after maximum retries.");
}

async function fetchAndParse(search: string) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(
      `https://www.amazon.com/s?k=${search.trim().split(" ").join("+")}`,
      {
        waitUntil: "domcontentloaded",
      }
    );

    // Extract data
    const data = await page.evaluate(() => {
      // Extract text from an element
      const elements = document.querySelectorAll(".s-result-item");
      const resultItems = Array.from(elements)
        .map((productElement) => {
          const title =
            productElement.querySelector(".a-link-normal h2")?.innerText;
          const price = productElement
            .querySelector(".a-offscreen")
            ?.innerHTML.toString()
            .replace("&nbsp;", " ");
          const rating = productElement
            .querySelector<HTMLSpanElement>("i.a-icon span")
            ?.innerText.split(" out of 5 stars")[0];
          const ratingsAmount = productElement.querySelector<HTMLSpanElement>(
            ".rush-component .s-csa-instrumentation-wrapper a span"
          )?.innerText;
          const imageUrl =
            productElement.querySelector<HTMLImageElement>("img.s-image")?.src;
          return {
            title,
            price,
            rating,
            ratingsAmount,
            imageUrl,
          };
        })
        .filter(({ price, rating, title }) => price && rating && title);
      return resultItems;
    });
    await browser.close();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

const server = Bun.serve({
  port: 3000,
  idleTimeout: 255,
  async fetch(req) {
    if (req.method === "OPTIONS") {
      const res = new Response("Departed", CORS_HEADERS);
      return res;
    }
    const url = new URL(req.url);
    const search = url.search.slice(1).split("=");
    const searchText = search[0] === "keyword" ? search[1] : "";

    // Fetches data from Amazon if the route is /api/scrape
    if (url.pathname === "/api/scrape" && searchText) {
      const searchResult = await retryUntilSuccess(
        async () => await fetchAndParse(searchText),
        20,
        200
      );
      console.log(searchResult);
      return new Response(JSON.stringify(searchResult), {
        headers: {
          ...CORS_HEADERS.headers,
          "Content-Type": "application/json",
        },
      });
    }

    // Returns a 404 for any other route
    const res = new Response("Not Found", {
      status: 404,
      headers: CORS_HEADERS.headers,
    });
    return res;
  },
});
