export interface Audience {
  slug: string;
  name: string; // e.g. "Students"
  title: string; // <title>
  description: string;
  headline: string;
  intro: string;
  pains: string[];
  benefits: { title: string; body: string }[];
  workflow: string[];
  faq: { q: string; a: string }[];
}

export const AUDIENCES: Audience[] = [
  {
    slug: "students",
    name: "Students",
    title: "Gather for Students: Highlight Research and Cite Sources Easily",
    description: "A free Chrome highlighter for students. Highlight online sources while researching, add notes, and find every quote with its link when writing essays.",
    headline: "Research faster. Cite without the panic.",
    intro: "Highlight sources as you research, note which argument each quote supports, and find the right line with its link when it is time to write.",
    pains: ["Dozens of tabs and a messy doc of pasted quotes", "Forgetting where a quote came from", "Re-reading whole articles to find one line"],
    benefits: [
      { title: "Every quote keeps its source", body: "The text, page title, link and date are saved together, which is what you need for a citation." },
      { title: "Sort quotes by purpose", body: "Add notes like \"intro\" or \"counter-argument\" and search by them when writing." },
      { title: "Retrace your research", body: "Your library is organised by day, so you can revisit each research session." },
    ],
    workflow: ["Open a source and highlight the key passages.", "Add a note saying which part of your essay it supports.", "When writing, search your notes and copy the quote with its link."],
    faq: [
      { q: "Is Gather free for students?", a: "Yes, Gather is free." },
      { q: "Does it work on journal and university sites?", a: "It works on any normal web page you can open in Chrome, including most journal and library sites viewed as web pages." },
    ],
  },
  {
    slug: "researchers",
    name: "Researchers",
    title: "Gather for Researchers: Highlight, Annotate and Search Web Sources",
    description: "Highlight and annotate web sources, keep findings organised by date and site, and search everything you have read. A free research tool for Chrome.",
    headline: "Every finding, one search away.",
    intro: "Capture findings from papers, reports and articles on the web, annotate them in context, and search across months of reading in seconds.",
    pains: ["Findings scattered across bookmarks, docs and screenshots", "Losing the context around an important passage", "Not remembering which source said what"],
    benefits: [
      { title: "Annotate in context", body: "Notes sit beside the exact passage they refer to, on the page and in your library." },
      { title: "Full-text search", body: "Search highlights and notes together, across every source you have read." },
      { title: "Portable", body: "Export to Markdown and bring findings into Obsidian, Notion or your writing tool." },
    ],
    workflow: ["Highlight key findings while reading.", "Annotate with your interpretation or a link to your hypothesis.", "Search and export when synthesising."],
    faq: [
      { q: "Can I export my annotations?", a: "Yes, as Markdown, per day or for your whole library." },
      { q: "Are my research notes private?", a: "Yes. Your library is private to your account." },
    ],
  },
  {
    slug: "writers",
    name: "Writers",
    title: "Gather for Writers: Collect Quotes and Ideas From the Web",
    description: "Build a swipe file of quotes, facts and ideas from everything you read online. Highlight, add notes, and find the perfect line when you write.",
    headline: "Your swipe file, built while you read.",
    intro: "Collect striking lines, facts and ideas from across the web, tag them with notes, and find the perfect quote the moment you need it.",
    pains: ["Great lines forgotten by the time you sit down to write", "Facts you cannot re-find to credit", "Inspiration buried in a notes app you never open"],
    benefits: [
      { title: "Capture in one click", body: "Highlight and save without leaving the page or breaking your reading flow." },
      { title: "Find by memory", body: "Search a word you remember, the site, or the day you read it." },
      { title: "Copy with credit", body: "Copy a quote with its source link attached, ready to paste and attribute." },
    ],
    workflow: ["Highlight anything that sparks an idea.", "Add a note: \"use for newsletter\", \"opening line\".", "Search your notes when drafting and copy what you need."],
    faq: [
      { q: "Can I copy quotes with their source?", a: "Yes. The copy button includes the quote, your note and the link." },
      { q: "Does it work on blogs and newsletters?", a: "Yes, on any web page you open in Chrome." },
    ],
  },
  {
    slug: "professionals",
    name: "Professionals",
    title: "Gather for Professionals: Remember What You Read for Work",
    description: "Keep the key points from industry articles, docs and reports. Highlight on any site, add context, and find it again for meetings and decisions.",
    headline: "Remember what you read for work.",
    intro: "Industry news, documentation, reports: keep the parts that matter, with your own context, and find them again before the meeting.",
    pains: ["Reading lots, remembering little", "Hunting for that one stat before a meeting", "Sharing insights without the source"],
    benefits: [
      { title: "Keep the key points", body: "Highlight the stat, the decision, the definition, and nothing else." },
      { title: "Add your context", body: "Note why it matters for your team or project." },
      { title: "Share with sources", body: "Copy a highlight with its link into Slack, email or docs." },
    ],
    workflow: ["Highlight key points in articles and docs.", "Note the project or decision it relates to.", "Search before meetings and share with the source attached."],
    faq: [
      { q: "Does Gather work on documentation sites?", a: "Yes, on any normal web page in Chrome." },
      { q: "Is my data shared with anyone?", a: "No. Your library is private and never sold." },
    ],
  },
];

export function getAudience(slug: string) {
  return AUDIENCES.find((a) => a.slug === slug);
}
