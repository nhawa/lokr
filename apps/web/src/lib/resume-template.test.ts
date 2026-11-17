import { describe, expect, it } from 'vitest';
import { renderResumeTemplate, toResumeTemplateData } from './resume-template';

describe('resume PDF template', () => {
  const markdown = `# Anwar Sandi\nanwar@example.com | Jakarta, Indonesia\n\n## Summary\nPlatform engineer with **reliable systems** experience.\n\n## Experience\n### Example Co. | Senior Engineer | 2024–Present\n- Improved availability to **99.9%**.\n\n## Education\nB.Sc. Computer Science\n\n## Skills\n- TypeScript\n- PostgreSQL`;

  it('preserves section and experience order without interpreting HTML', () => {
    const resume = toResumeTemplateData(markdown);
    expect(resume.name).toBe('Anwar Sandi');
    expect(resume.contact).toContain('anwar@example.com');
    expect(resume.sections.map(section => section.title)).toEqual(['Summary', 'Experience', 'Education', 'Skills']);
    expect(renderResumeTemplate(resume)).toContain('<strong>99.9%</strong>');
    expect(renderResumeTemplate(resume)).toContain('resume-entry-date">2024–Present');
    expect(renderResumeTemplate(toResumeTemplateData('# <img src=x>'))).toContain('&lt;img src=x&gt;');
    const html = renderResumeTemplate(toResumeTemplateData('# Candidate\n\n## Experience\n### First role\n- First achievement\n### Second role\n- Second achievement\n\n## Projects\n- Built a tool'));
    expect(html.indexOf('First role')).toBeLessThan(html.indexOf('First achievement'));
    expect(html.indexOf('First achievement')).toBeLessThan(html.indexOf('Second role'));
    expect(html.indexOf('Second role')).toBeLessThan(html.indexOf('Second achievement'));
    expect(html).toContain('Projects');
    expect(html).toContain('Built a tool');
  });
});
