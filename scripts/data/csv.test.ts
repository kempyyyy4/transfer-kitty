import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

async function parse(...chunks: string[]): Promise<string[][]> {
  async function* source() {
    yield* chunks;
  }
  const rows: string[][] = [];
  for await (const row of parseCsv(source())) rows.push(row);
  return rows;
}

describe("parseCsv", () => {
  it("splits rows and fields", async () => {
    expect(await parse("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("keeps commas and line breaks that sit inside quotes", async () => {
    expect(await parse('"Smith, John","line one\nline two"\n')).toEqual([
      ["Smith, John", "line one\nline two"],
    ]);
  });

  it("turns a doubled quote into one quote", async () => {
    expect(await parse('"He said ""hi""",x\n')).toEqual([['He said "hi"', "x"]]);
  });

  it("keeps empty fields", async () => {
    expect(await parse('"a",,"c"\n')).toEqual([["a", "", "c"]]);
  });

  it("ignores Windows line endings", async () => {
    expect(await parse("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("returns a last row that has no line break after it", async () => {
    expect(await parse("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("gives the same result however the text is split into chunks", async () => {
    const text = '"a ""quoted"" one","two, three"\n"four\nfive",six\n';
    const whole = await parse(text);

    for (let cut = 1; cut < text.length; cut++) {
      expect(await parse(text.slice(0, cut), text.slice(cut))).toEqual(whole);
    }
  });
});
