import { ContentStatus, ContentType, type Market, type Prisma, type SeoMetadata, type Template, type Broker, } from "@prisma/client";
import Link from "next/link";
import { SaveContentButton } from "@/components/admin/save-content-button";
import { contentStatusLabels, contentTypeLabels, getMarkdownBody, } from "@/lib/content";
type ContentFormItem = {
    id: string;
    title: string;
    slug: string;
    marketId: string;
    templateId: string;
    contentType: ContentType;
    status: ContentStatus;
    body: Prisma.JsonValue;
    canonicalPath: string;
    authorName: string | null;
    reviewerName: string | null;
    publishedAt: Date | null;
    seoMetadata: SeoMetadata | null;
    translationGroup: {
        key: string;
    } | null;
    brokers: Pick<Broker, "id" | "name" | "slug">[];
};
type ContentFormProps = {
    action: (formData: FormData) => void | Promise<void>;
    error?: string;
    item?: ContentFormItem;
    markets: Pick<Market, "id" | "code" | "name" | "languageCode" | "locale" | "isGlobal">[];
    brokers: Pick<Broker, "id" | "name" | "slug">[];
    saved?: boolean;
    templates: Pick<Template, "id" | "key" | "name" | "kind" | "isActive">[];
};
const editableStatuses = [
    ContentStatus.DRAFT,
    ContentStatus.REVIEW,
    ContentStatus.PUBLISHED,
    ContentStatus.ARCHIVED,
] as const;
export function ContentForm({ action, error, item, brokers, markets, saved, templates }: ContentFormProps) {
    const isEditing = Boolean(item);
    return <form action={action} className="content-editor">
    {item && <input name="id" type="hidden" value={item.id}/>}
    <header className="editor-heading"><div><Link className="editor-back" href="/admin/content">← All content</Link><h1>{isEditing ? "Edit article" : "Create an article"}</h1><p>Your workspace for writing, reviewing and publishing.</p></div><div className="editor-heading-actions">{item?.status === ContentStatus.PUBLISHED && <Link className="button button-outline" href={item.canonicalPath} target="_blank" rel="noopener noreferrer">View article ↗</Link>}<SaveContentButton editing={isEditing}/></div></header>
    {error && <div role="alert" className="editor-alert error">{error}</div>}
    {saved && <div role="status" className="editor-alert success">✓ Content saved successfully.</div>}
    <div className="editor-grid"><div className="editor-main">
      <section className="editor-paper"><div className="paper-label"><span>ARTICLE CONTENT</span><span>Markdown</span></div><label htmlFor="title">Article title</label><input className="editor-title" defaultValue={item?.title} id="title" name="title" required placeholder="Give your article a clear, descriptive title"/><div className="body-label"><label htmlFor="body">Body content</label><span>Use ## for headings · **bold** · - for lists</span></div><textarea className="body-editor" defaultValue={getMarkdownBody(item?.body)} id="body" name="body" placeholder="Start writing your article…" aria-describedby="body-help"/><p id="body-help" className="field-help">Write in Markdown. Affiliate links are managed through the attached brokers and campaigns.</p></section>
      <section className="editor-panel seo-panel"><div className="panel-heading"><span className="panel-icon" aria-hidden="true">⌕</span><div><h2>Search appearance</h2><p>Help readers understand your article in search results.</p></div><span className="panel-badge">SEO</span></div><label htmlFor="seoTitle">SEO title<input defaultValue={item?.seoMetadata?.title} id="seoTitle" name="seoTitle" placeholder="A concise title for search results"/></label><label htmlFor="metaDescription">Meta description<textarea defaultValue={item?.seoMetadata?.description} id="metaDescription" name="metaDescription" rows={4} placeholder="Summarize what readers will learn from this article."/></label><p className="field-help">Keep the title focused and write a useful, specific description.</p></section>
      <section className="editor-panel"><div className="panel-heading"><div><h2>Editorial metadata</h2><p>Give your readers a clear sense of who is behind the article.</p></div></div><div className="editor-field-pair"><label htmlFor="authorName">Author<input defaultValue={item?.authorName ?? ""} id="authorName" name="authorName" placeholder="Author name"/></label><label htmlFor="reviewerName">Reviewer<input defaultValue={item?.reviewerName ?? ""} id="reviewerName" name="reviewerName" placeholder="Reviewer name"/></label></div><label htmlFor="translationGroupKey">Translation group<input defaultValue={item?.translationGroup?.key ?? ""} id="translationGroupKey" name="translationGroupKey" placeholder="Shared topic key (optional)"/></label><p className="field-help">Use the same group key for translated versions of this article.</p></section>
    </div><aside className="editor-aside" aria-label="Article settings">
      <section className="editor-panel publishing-panel"><div className="panel-heading"><h2>Publishing</h2><span className="panel-badge">Workflow</span></div><label htmlFor="status">Content status<select defaultValue={item?.status ?? ContentStatus.DRAFT} id="status" name="status">{editableStatuses.map(status => <option key={status} value={status}>{contentStatusLabels[status]}</option>)}</select></label><p className="field-help">Select a status, then save. Publishing checks the required content and SEO fields.</p>{item?.publishedAt && <p className="publish-date">First published {item.publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>}<SaveContentButton editing={isEditing}/></section>
      <section className="editor-panel"><div className="panel-heading"><h2>Route & language</h2></div><label htmlFor="slug">URL slug<input defaultValue={item?.slug} id="slug" name="slug" required/></label><label htmlFor="marketId">Market / language<select defaultValue={item?.marketId ?? markets[0]?.id} id="marketId" name="marketId" required>{markets.map(market => <option key={market.id} value={market.id}>{market.name} · {market.locale}</option>)}</select></label><label htmlFor="contentType">Content type<select defaultValue={item?.contentType ?? ContentType.ARTICLE} id="contentType" name="contentType" required>{Object.values(ContentType).map(type => <option key={type} value={type}>{contentTypeLabels[type]}</option>)}</select></label>{item?.canonicalPath && <div className="route-preview"><span>Current URL</span><code>{item.canonicalPath}</code></div>}</section>
      <section className="editor-panel"><div className="panel-heading"><h2>Article template</h2></div><label htmlFor="templateId">Layout<select defaultValue={item?.templateId ?? templates[0]?.id} id="templateId" name="templateId" required>{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label><p className="field-help">Determines the article structure and required content blocks.</p></section>
      <section className="editor-panel"><div className="panel-heading"><h2>Attached brokers</h2></div><div className="broker-checkboxes">{brokers.map(broker => <label key={broker.id}><input type="checkbox" name="brokerIds" value={broker.id} defaultChecked={item?.brokers.some(selected => selected.id === broker.id) ?? false}/><span>{broker.name}<small>{broker.slug}</small></span></label>)}</div><p className="field-help">Used for broker facts and affiliate CTAs. Select the brokers relevant to this article.</p></section>
    </aside></div>
  </form>;
}
