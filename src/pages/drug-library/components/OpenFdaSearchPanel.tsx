import { CheckCircle2, ExternalLink, Search } from "lucide-react";
import { Panel } from "../../../components/ui/Panel";
import type { OpenFdaCatalogCandidate, OpenFdaCatalogSearchResult } from "../../../features/drug-data/types";
import { useI18n } from "../../../i18n/I18nProvider";

interface OpenFdaSearchPanelProps {
  query: string;
  result: OpenFdaCatalogSearchResult | null;
  isSearching: boolean;
  error: string | null;
  onAddCandidate: (candidate: OpenFdaCatalogCandidate) => void;
}

export function OpenFdaSearchPanel({ query, result, isSearching, error, onAddCandidate }: OpenFdaSearchPanelProps) {
  const { t } = useI18n();

  return (
    <Panel title={t("drugLibrary.remoteTitle")} icon={<Search size={17} />} wide>
      <p className="panel-copy">{t("drugLibrary.remoteCopy")}</p>

      {!query.trim() ? <div className="table-feedback compact-feedback">{t("drugLibrary.remoteIdle")}</div> : null}
      {result?.resolvedMapping ? (
        <div className="mapping-banner">
          <CheckCircle2 size={18} />
          <span>
            {t("drugLibrary.remoteResolved", {
              query: result.query,
              canonical: result.resolvedMapping.canonicalName,
              matched: result.resolvedMapping.matchedAlias
            })}
          </span>
        </div>
      ) : null}
      {result?.unmatchedCjk ? <div className="table-feedback compact-feedback">{t("drugLibrary.remoteUnmapped")}</div> : null}
      {isSearching ? <div className="table-feedback compact-feedback">{t("drugLibrary.remoteLoading")}</div> : null}
      {error ? <div className="table-feedback compact-feedback">{t("drugLibrary.remoteError")} {error}</div> : null}
      {!isSearching && !error && query.trim() && !result?.unmatchedCjk && result && result.candidates.length === 0 ? <div className="table-feedback compact-feedback">{t("drugLibrary.remoteEmpty")}</div> : null}

      {result?.candidates.length ? (
        <div className="remote-card-grid">
          {result.candidates.map((candidate) => (
            <article key={candidate.id} className="remote-candidate-card">
              <div className="remote-candidate-header">
                <div>
                  <strong>{candidate.brandName}</strong>
                  <span>{candidate.genericName}</span>
                </div>
                <em>{t("drugLibrary.draftBadge")}</em>
              </div>
              <dl>
                <div>
                  <dt>{t("drugLibrary.mappingSource")}</dt>
                  <dd>{candidate.resolvedMapping?.matchedAlias ?? candidate.canonicalName}</dd>
                </div>
                <div>
                  <dt>{t("drugLibrary.manufacturer")}</dt>
                  <dd>{candidate.manufacturer}</dd>
                </div>
                <div>
                  <dt>{t("drugLibrary.route")}</dt>
                  <dd>{candidate.route.join(", ") || "-"}</dd>
                </div>
                <div>
                  <dt>{t("drugLibrary.dosageForm")}</dt>
                  <dd>{candidate.dosageForm}</dd>
                </div>
                <div>
                  <dt>{t("drugLibrary.productNdc")}</dt>
                  <dd>{candidate.productNdc}</dd>
                </div>
              </dl>
              <div className="remote-candidate-actions">
                <button type="button" className="secondary-link" onClick={() => window.open(`https://api.fda.gov/drug/ndc.json?search=${encodeURIComponent(candidate.query)}`, "_blank", "noopener,noreferrer")}>
                  <ExternalLink size={15} />
                  {t("drugLibrary.fdaPreview")}
                </button>
                <button type="button" className="primary-button" onClick={() => onAddCandidate(candidate)}>
                  {t("drugLibrary.addFromOpenFda")}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
