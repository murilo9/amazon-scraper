import axios from "axios";
import { JSDOM } from "jsdom";
import puppeteer from "puppeteer";

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
      const resultItems = Array.from(
        document.querySelectorAll(".s-result-item")
      )
        .map((productElement) => {
          const title = productElement.querySelector("h2")?.innerText;
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
          return {
            title,
            price,
            rating,
            ratingsAmount,
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
  async fetch(req) {
    const url = new URL(req.url);
    const search = url.search.slice(1).split("=");
    const searchText = search[0] === "keyword" ? search[1] : "";

    if (url.pathname === "/api/scrape" && searchText) {
      const searchResult = await fetchAndParse(searchText);
      return new Response(JSON.stringify(searchResult), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});
