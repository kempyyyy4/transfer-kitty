/**
 * Streaming CSV reader. Yields one array of fields per row.
 * Handles quoted fields, doubled quotes inside them, and line breaks inside quotes.
 */
export async function* parseCsv(chunks: AsyncIterable<string>): AsyncGenerator<string[]> {
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  // A quote seen inside a quoted field: it either ends the field or starts a doubled quote.
  let quotePending = false;

  for await (const chunk of chunks) {
    for (const char of chunk) {
      if (quotePending) {
        quotePending = false;
        if (char === '"') {
          field += '"';
          continue;
        }
        inQuotes = false;
      }

      if (inQuotes) {
        if (char === '"') quotePending = true;
        else field += char;
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field);
        yield row;
        row = [];
        field = "";
      } else if (char !== "\r") {
        field += char;
      }
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    yield row;
  }
}
