export type ResumeSection = {
  title: string;
  blocks: ({ type: 'paragraph'; text: string } | { type: 'entry'; text: string } | { type: 'list'; items: string[] })[];
};

export type ResumeTemplateData = {
  name: string;
  contact: string;
  sections: ResumeSection[];
};

const allowedSections: Record<string, ResumeSection['title']> = {
  summary: 'Summary',
  'professional summary': 'Summary',
  experience: 'Experience',
  'work experience': 'Experience',
  education: 'Education',
  skills: 'Skills',
  'technical skills': 'Skills',
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));

const inline = (value: string) => escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

/** Converts Markdown into ordered sections for the resume preview and export. */
export function toResumeTemplateData(markdown: string): ResumeTemplateData {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const name = lines.find(line => /^#\s+/.test(line))?.replace(/^#\s+/, '').trim() || 'Candidate';
  const firstHeading = lines.findIndex(line => /^#{2,3}\s+/.test(line));
  const firstContent = lines.slice(0, firstHeading < 0 ? undefined : firstHeading).find(line => line.trim() && !/^#/.test(line));
  const contact = firstContent?.replace(/^[-*]\s+/, '').trim() || '';
  const sections: ResumeSection[] = [];
  let current: ResumeSection | undefined;
  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (current && paragraph.length) current.blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
    paragraph = [];
  };

  for (const line of lines) {
    const heading = /^#{2,3}\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      if (heading[1] && /^###\s+/.test(line) && current) {
        current.blocks.push({ type: 'entry', text: heading[1].trim() });
        continue;
      }
      const title = allowedSections[heading[1].trim().toLowerCase()] || heading[1].trim();
      current = { title, blocks: [] };
      sections.push(current);
      continue;
    }
    if (!current || /^#\s+/.test(line)) continue;
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      const previous = current.blocks.at(-1);
      const item = line.replace(/^[-*]\s+/, '').trim();
      if (previous?.type === 'list') previous.items.push(item);
      else current.blocks.push({ type: 'list', items: [item] });
    } else if (line.trim()) paragraph.push(line.trim());
    else flushParagraph();
  }
  flushParagraph();

  return { name, contact, sections };
}

export const resumeTemplateCss = `
  @page { size: Letter; margin: 0.68in 0.72in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #111; }
  .resume-document { max-width: 7.06in; margin: 0 auto; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 10.15pt; line-height: 1.34; }
  .resume-header { padding: 0 0 14pt; text-align: center; }
  .resume-name { margin: 0; font-size: 18pt; font-weight: 700; letter-spacing: .01em; line-height: 1.08; }
  .resume-contact { margin: 5pt 0 0; font-size: 9.5pt; line-height: 1.25; }
  .resume-section { margin: 0 0 13pt; break-inside: avoid; page-break-inside: avoid; }
  .resume-section-heading { margin: 0 0 6pt; padding: 0 0 3pt; border-bottom: .6pt solid #111; font-size: 10.4pt; font-weight: 700; letter-spacing: .035em; line-height: 1.15; text-transform: uppercase; }
  .resume-paragraph { margin: 0 0 6pt; orphans: 3; widows: 3; }
  .resume-paragraph:last-of-type { margin-bottom: 0; }
  .resume-entry { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12pt; margin: 8pt 0 3pt; break-inside: avoid; page-break-inside: avoid; }
  .resume-entry:first-of-type { margin-top: 0; }
  .resume-entry-copy { display: grid; gap: 1pt; }
  .resume-entry-title { font-weight: 700; }
  .resume-entry-detail, .resume-entry-date { font-size: 9.5pt; }
  .resume-entry-date { white-space: nowrap; text-align: right; }
  .resume-list { margin: 6pt 0 0; padding: 0 0 0 17pt; }
  .resume-list li { margin: 0 0 3.5pt; padding-left: 1pt; break-inside: avoid; page-break-inside: avoid; orphans: 2; widows: 2; }
  .resume-list li:last-child { margin-bottom: 0; }
  .resume-document strong { font-weight: 700; }
  @media screen { .resume-document { min-height: 9.64in; padding: .68in .72in; background: #fff; box-shadow: 0 8px 28px rgba(0, 0, 0, .12); } }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .resume-document { max-width: none; } }
`;

export function renderResumeTemplate(data: ResumeTemplateData): string {
  const renderEntry = (entry: string) => {
    const values = entry.split('|').map(value => value.trim()).filter(Boolean);
    const title = values[0] || 'Experience'; const date = values.length > 2 ? values.at(-1)! : ''; const detail = values.length > 2 ? values.slice(1, -1).join(' | ') : values[1] || '';
    return `<div class="resume-entry"><div class="resume-entry-copy"><strong class="resume-entry-title">${inline(title)}</strong>${detail ? `<span class="resume-entry-detail">${inline(detail)}</span>` : ''}</div>${date ? `<time class="resume-entry-date">${inline(date)}</time>` : ''}</div>`;
  };
  const sections = data.sections.map(section => `<section class="resume-section"><h2 class="resume-section-heading">${inline(section.title)}</h2>${section.blocks.map(block => block.type === 'entry' ? renderEntry(block.text) : block.type === 'paragraph' ? `<p class="resume-paragraph">${inline(block.text)}</p>` : `<ul class="resume-list">${block.items.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`).join('')}</section>`).join('');
  return `<style>${resumeTemplateCss}</style><main class="resume-document" aria-label="Resume preview"><header class="resume-header"><h1 class="resume-name">${inline(data.name)}</h1>${data.contact ? `<p class="resume-contact">${inline(data.contact)}</p>` : ''}</header>${sections || '<section class="resume-section"><h2 class="resume-section-heading">Summary</h2><p class="resume-paragraph">No reviewed resume content is available.</p></section>'}</main>`;
}
