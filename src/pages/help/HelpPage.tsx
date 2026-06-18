import { BookOpenText } from "lucide-react";
import { MarkdownDocument } from "../../features/help/MarkdownDocument";
import type { HelpDocDefinition } from "../../features/help/helpDocs";

export function HelpPage({ doc }: { doc: HelpDocDefinition }) {
  return (
    <section className="help-page">
      <div className="page-heading help-heading">
        <div className="heading-icon">
          <BookOpenText size={32} />
        </div>
        <div>
          <h1>{doc.title}</h1>
          <p>Markdown-driven operational guidance for the local-first console.</p>
        </div>
      </div>
      <div className="help-surface">
        <MarkdownDocument content={doc.content} />
      </div>
    </section>
  );
}
