import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ParsedReport {
  periodEndDate: Date;
  title: string;
  teams: ParsedTeam[];
}

export interface ParsedTeam {
  name: string;
  lead: string;
  accomplishments: ParsedItem[];
  goals: ParsedItem[];
  blockers: ParsedItem[];
  risks: ParsedItem[];
}

export interface ParsedItem {
  section: string | null;
  description: string;
  ticketId: string | null;
  ticketUrl: string | null;
}

/**
 * Parse a single HTML report file
 */
export async function parseHtmlReport(htmlPath: string): Promise<ParsedReport> {
  const html = await fs.readFile(htmlPath, 'utf-8');
  const $ = cheerio.load(html);

  // Extract date from title
  const title = $('title').text();
  const dateMatch = title.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  const periodEndDate = dateMatch
    ? new Date(`${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`)
    : new Date();

  const teams: ParsedTeam[] = [];

  // Each slide represents a team (skip title slide if present)
  $('.slide').each((index, slideEl) => {
    const $slide = $(slideEl);

    // Skip if this is a title slide
    if ($slide.hasClass('title-slide')) return;

    const teamName = $slide.find('h2').first().text().trim();
    const teamLead = $slide.find('.team-lead').first().text().trim();

    if (!teamName || teamName.length === 0) return;

    console.log(`  Parsing team: ${teamName}`);

    // Parse accomplishments
    const accomplishments = parseSection($slide, $, 'Accomplishments Last Period');

    // Parse goals
    const goals = parseSection($slide, $, 'Goals This Period');

    // Parse blockers
    const blockers = parseSimpleSection($slide, $, 'Blockers and Work Arounds');

    // Parse risks
    const risks = parseSimpleSection($slide, $, 'Critical Risks and Mitigations');

    teams.push({
      name: teamName,
      lead: teamLead,
      accomplishments,
      goals,
      blockers,
      risks
    });
  });

  return {
    periodEndDate,
    title,
    teams
  };
}

/**
 * Parse a section with subsections (accomplishments, goals)
 */
function parseSection(
  $slide: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI,
  sectionTitleFragment: string
): ParsedItem[] {
  const items: ParsedItem[] = [];
  let currentSection: string | null = null;

  // Find all section boxes
  $slide.find('.section-box').each((_, boxEl) => {
    const $box = $(boxEl);
    const boxTitle = $box.find('.section-title').first().text().trim();

    // Check if this is the section we're looking for
    if (!boxTitle.includes(sectionTitleFragment.split(' /')[0])) return;

    // Parse items grouped by h3 sections and ul lists
    $box.contents().each((_, el) => {
      const $el = $(el);
      const tagName = el.tagName;

      if (tagName === 'h3') {
        currentSection = $el.text().trim();
      } else if (tagName === 'ul') {
        $el.find('li').each((_, liEl) => {
          const $li = $(liEl);
          const text = $li.text().trim();

          if (!text || text.length === 0) return;

          // Extract ticket link if present
          const $link = $li.find('a').first();
          const ticketUrl = $link.attr('href') || null;
          const ticketId = ticketUrl ? extractTicketId(ticketUrl) : null;

          // Clean description (remove ticket ID and formatting)
          let description = text;
          if (ticketId) {
            // Remove patterns like "- 89536", "89536", "- (89536)"
            description = description
              .replace(new RegExp(`\\s*-?\\s*\\(?${ticketId}\\)?\\s*$`), '')
              .replace(new RegExp(`\\s*${ticketId}\\s*$`), '')
              .trim();
          }

          // Remove "- " prefix if present
          if (description.startsWith('- ')) {
            description = description.substring(2).trim();
          }

          items.push({
            section: currentSection || 'General',
            description,
            ticketId,
            ticketUrl
          });
        });
      }
    });
  });

  return items;
}

/**
 * Parse a simple section (blockers, risks) that may not have subsections
 */
function parseSimpleSection(
  $slide: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI,
  sectionTitleFragment: string
): ParsedItem[] {
  const items: ParsedItem[] = [];

  // Find the section box
  $slide.find('.section-box').each((_, boxEl) => {
    const $box = $(boxEl);
    const boxTitle = $box.find('.section-title').first().text().trim();

    // Check if this is the section we're looking for
    if (!boxTitle.includes(sectionTitleFragment.split(' and')[0])) return;

    // Check for "No blockers" or "No risks" message
    const italic = $box.find('p[style*="italic"]').text();
    if (italic.includes('No blockers') ||
        italic.includes('No critical risks') ||
        italic.includes('no blockers') ||
        italic.includes('N/A')) {
      return; // Skip empty sections
    }

    // Parse ul/li items (may have h3 headers)
    let currentSection: string | null = null;

    $box.contents().each((_, el) => {
      const $el = $(el);
      const tagName = el.tagName;

      if (tagName === 'h3') {
        currentSection = $el.text().trim();
      } else if (tagName === 'ul') {
        $el.find('li').each((_, liEl) => {
          const $li = $(liEl);
          const text = $li.text().trim();

          if (!text || text.length === 0) return;

          // Extract ticket link if present
          const $link = $li.find('a').first();
          const ticketUrl = $link.attr('href') || null;
          const ticketId = ticketUrl ? extractTicketId(ticketUrl) : null;

          // Clean description
          let description = text;
          if (ticketId) {
            description = description
              .replace(new RegExp(`\\s*-?\\s*\\(?${ticketId}\\)?\\s*$`), '')
              .replace(new RegExp(`\\s*${ticketId}\\s*$`), '')
              .trim();
          }

          if (description.startsWith('- ')) {
            description = description.substring(2).trim();
          }

          items.push({
            section: currentSection,
            description,
            ticketId,
            ticketUrl
          });
        });
      }
    });

    // Also check for direct paragraph content (some sections may have paragraphs instead of lists)
    if (items.length === 0) {
      $box.find('p').each((_, pEl) => {
        const $p = $(pEl);
        const text = $p.text().trim();

        // Skip empty paragraphs and italic placeholder text
        if (!text ||
            text.length === 0 ||
            text.includes('No blockers') ||
            text.includes('No critical risks') ||
            text.includes('N/A')) {
          return;
        }

        items.push({
          section: null,
          description: text,
          ticketId: null,
          ticketUrl: null
        });
      });
    }
  });

  return items;
}

/**
 * Extract ticket ID from Azure DevOps URL
 */
function extractTicketId(url: string): string | null {
  const match = url.match(/text=(\d+)/);
  return match ? match[1] : null;
}

/**
 * Migrate all HTML reports in a directory
 */
export async function migrateAllReports(weeksDir: string) {
  const files = await fs.readdir(weeksDir);
  const htmlFiles = files.filter(f => f.endsWith('.html')).sort();

  console.log(`\nFound ${htmlFiles.length} HTML files to parse\n`);

  const results = [];

  for (const file of htmlFiles) {
    const filePath = path.join(weeksDir, file);
    console.log(`Parsing ${file}...`);

    try {
      const parsed = await parseHtmlReport(filePath);
      console.log(`  ✓ Successfully parsed ${parsed.teams.length} teams`);
      results.push({ file, data: parsed, success: true });
    } catch (error: any) {
      console.error(`  ✗ Error parsing ${file}:`, error.message);
      results.push({ file, error: error.message, success: false });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`\n✓ Successfully parsed ${successCount}/${htmlFiles.length} reports\n`);

  return results;
}
