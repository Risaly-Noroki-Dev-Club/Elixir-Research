import { useMemo } from "react";

interface MarkdownBlock {
  type: "h1" | "h2" | "h3" | "paragraph" | "unordered-list" | "ordered-list" | "code";
  lines: string[];
}

export function MarkdownDocument({ content }: { content: string }) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <article className="markdown-article">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "h1") return <h1 key={key}>{block.lines[0]}</h1>;
        if (block.type === "h2") return <h2 key={key}>{block.lines[0]}</h2>;
        if (block.type === "h3") return <h3 key={key}>{block.lines[0]}</h3>;
        if (block.type === "code") {
          return (
            <pre key={key}>
              <code>{block.lines.join("\n")}</code>
            </pre>
          );
        }
        if (block.type === "unordered-list") {
          return (
            <ul key={key}>
              {block.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ordered-list") {
          return (
            <ol key={key}>
              {block.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          );
        }

        return <p key={key}>{block.lines.join(" ")}</p>;
      })}
    </article>
  );
}

function parseMarkdown(content: string) {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", lines: codeLines });
      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", lines: [line.slice(2).trim()] });
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", lines: [line.slice(3).trim()] });
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", lines: [line.slice(4).trim()] });
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2).trim());
        index += 1;
      }
      blocks.push({ type: "unordered-list", lines: items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ordered-list", lines: items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const paragraphLine = lines[index].trim();
      if (!paragraphLine || paragraphLine.startsWith("#") || paragraphLine.startsWith("- ") || /^\d+\.\s+/.test(paragraphLine) || paragraphLine.startsWith("```")) {
        break;
      }
      paragraphLines.push(paragraphLine);
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraphLines });
  }

  return blocks;
}
