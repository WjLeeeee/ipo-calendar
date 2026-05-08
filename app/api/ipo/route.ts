import * as http from "http";
import * as cheerio from "cheerio";
export const revalidate = 3600; // 1시간마다 갱신

async function fetchHtml(path: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const options = {
      hostname: "www.38.co.kr",
      path,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      },
    };
    const req = http.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(new TextDecoder("euc-kr").decode(buffer));
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function parseDetail(html: string): { refundDate: string; listingDate: string } {
  const $ = cheerio.load(html);
  let refundDate = "";
  let listingDate = "";

  $("table tr").each((_, row) => {
    const tds = $(row).find("td");
    tds.each((i, td) => {
      const text = $(td).text().trim();
      if (text === "환불일") refundDate = $(tds[i + 1]).text().trim();
      if (text === "상장일") listingDate = $(tds[i + 1]).text().trim();
    });
  });

  return { refundDate, listingDate };
}

export async function GET() {
  const html = await fetchHtml("/html/fund/?o=k");
  const $ = cheerio.load(html);
  const ipoList: any[] = [];

  $("table tbody tr").each((_, row) => {
    const cols = $(row).find("td");
    if (cols.length < 4) return;

    const name = $(cols[0]).text().trim();
    const cleanName = name.replace(/\(.*?\)/g, "").trim();
    const period = $(cols[1]).text().trim();
    const fixedPrice = $(cols[2]).text().trim();
    const hopePrice = $(cols[3]).text().trim();
    const competition = $(cols[4]).text().trim();
    const underwriter = $(cols[5]).text().trim();
    const detailHref = $(cols[0]).find("a").attr("href") || "";

    if (cleanName && period && period.match(/^\d{4}\.\d{2}\.\d{2}~/)) {
      ipoList.push({ name: cleanName, period, fixedPrice, hopePrice, competition, underwriter, detailHref });
    }
  });

  // 상세 페이지 병렬 요청
  const detailed = await Promise.all(
    ipoList.map(async (item) => {
      if (!item.detailHref) return item;
      try {
        const detailHtml = await fetchHtml(item.detailHref);
        const { refundDate, listingDate } = parseDetail(detailHtml);
        return { ...item, refundDate, listingDate };
      } catch {
        return item;
      }
    })
  );

  return Response.json(detailed);
}