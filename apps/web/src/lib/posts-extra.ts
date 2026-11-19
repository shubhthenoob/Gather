import type { Post } from "./posts";

export const EXTRA_POSTS: Post[] = [
  {
    slug: "what-to-look-for-in-a-chrome-highlighter-extension",
    title: "What to Look For in a Chrome Highlighter Extension (2026 Guide)",
    description: "Not all web highlighter extensions are equal. Seven things that separate a highlighter you will keep using from one you will uninstall in a week.",
    date: "2026-11-17",
    minutes: 6,
    sections: [
      {
        paragraphs: [
          "Search the Chrome Web Store for \"highlighter\" and you will find dozens of extensions. Most can paint text yellow. Far fewer are still useful a month later, when you have hundreds of highlights and need to find one.",
          "Here is a checklist for choosing a Chrome highlighter extension that actually earns its place in your browser.",
        ],
      },
      { heading: "1. Highlights that survive a refresh", paragraphs: ["The most basic test: highlight something, reload the page, and check it is still there. Many simple highlighters only change the page until you close the tab. A good one stores your highlight and redraws it every time you return, even if the page layout shifts a little."] },
      { heading: "2. It does not break the page", paragraphs: ["Some extensions wrap highlighted text in extra HTML, which can break buttons, forms or the layout of modern web apps. Look for one that draws highlights on top of the page without modifying it. Gather uses the browser's built-in highlight API for exactly this reason."] },
      { heading: "3. Notes, not just colour", paragraphs: ["A highlight tells you what mattered; a note tells you why. Being able to attach a short thought to a highlight makes your collection far more useful later."] },
      { heading: "4. One library for everything", paragraphs: ["Highlights scattered across hundreds of pages are hard to use. The best extensions collect every highlight into a single library you can browse, ideally organised automatically by date and by website so you never have to file anything."] },
      { heading: "5. Fast search", paragraphs: ["Six months from now you will remember a word or two, not the page. Full-text search across highlights and notes is the feature that turns a highlighter into a memory."] },
      { heading: "6. Your data, exportable", paragraphs: ["Avoid lock-in. Check that you can export your highlights to a standard format such as Markdown, so they can move with you into Obsidian, Notion or plain files."] },
      { heading: "7. Privacy you can read", paragraphs: ["A highlighter runs on every page you visit, so trust matters. Read the privacy policy. Prefer extensions that only save what you explicitly choose to save and do not track your browsing."] },
      {
        heading: "How Gather fits",
        paragraphs: ["We built Gather to pass every item on this list: highlights that come back when you revisit a page, no changes to the page itself, notes, an automatic date-wise library, instant search, Markdown export, and a plain-language privacy policy. It is free to try."],
      },
    ],
  },
  {
    slug: "how-to-export-web-highlights-to-markdown-obsidian-notion",
    title: "How to Export Web Highlights to Markdown, Obsidian or Notion",
    description: "Keep your web highlights in a portable format. How to export highlights and notes from Chrome as Markdown and bring them into Obsidian, Notion or any notes app.",
    date: "2026-11-16",
    minutes: 4,
    sections: [
      {
        paragraphs: [
          "Highlights are most valuable when they live alongside the rest of your notes. Markdown is the simplest way to get them there: it is plain text, readable anywhere, and supported by Obsidian, Notion, Logseq, Bear and almost every modern notes app.",
        ],
      },
      {
        heading: "Step 1: Highlight as you read",
        paragraphs: ["Install Gather in Chrome, select text on any page and click Save. Add a note if you want to remember why it mattered."],
      },
      {
        heading: "Step 2: Export a day or everything",
        paragraphs: ["Open your Gather library. On any day page, click Export day to download that day's highlights as a Markdown file. To export your whole library, use the export option in Settings."],
        list: [
          "Each website becomes a heading.",
          "Each highlight becomes a quote block.",
          "Your note appears under its highlight.",
          "The page title and link are included, so every quote stays credited.",
        ],
      },
      {
        heading: "Step 3: Bring it into your notes app",
        paragraphs: [],
        list: [
          "Obsidian: drop the .md file into your vault folder. It appears instantly and links work.",
          "Notion: use Import, choose Markdown, and select the file.",
          "Logseq, Bear, Craft and others: import or paste the Markdown directly.",
        ],
      },
      {
        heading: "Make it a weekly habit",
        paragraphs: ["Export once a week as part of a short review. You will re-read what you saved, which helps you remember it, and your notes app stays up to date without any manual copying."],
      },
    ],
  },
  {
    slug: "how-to-annotate-web-pages",
    title: "How to Annotate Web Pages: Add Notes to Any Website",
    description: "Annotating web pages helps you think, not just collect. How to add notes to any website in Chrome and keep your annotations in one searchable place.",
    date: "2026-11-14",
    minutes: 4,
    sections: [
      {
        paragraphs: [
          "Annotating is how serious readers think on paper: underline, scribble in the margin, argue with the author. On the web, most of us lose that habit because the browser gives us nowhere to write.",
          "Here is how to bring annotation back to the web.",
        ],
      },
      {
        heading: "What a good web annotation looks like",
        paragraphs: ["A useful annotation has two parts: the exact passage, and your reaction to it in your own words. The passage gives context; your words capture the thought you would otherwise forget."],
      },
      {
        heading: "Annotate any page with Gather",
        paragraphs: [],
        list: [
          "Select the passage you want to annotate.",
          "Click Add Note in the toolbar that appears.",
          "Write your thought and press Save (or Ctrl+Enter).",
          "Click the highlight any time to read or edit your note.",
        ],
      },
      {
        heading: "Annotation prompts that work",
        paragraphs: ["Stuck on what to write? Try one of these:"],
        list: [
          "\"This matters because…\"",
          "\"I disagree: …\"",
          "\"This connects to…\"",
          "\"Use this for…\"",
        ],
      },
      {
        heading: "Find your annotations later",
        paragraphs: ["Every annotation is saved to your Gather library alongside its highlight, organised by date and website. Search covers your notes too, so you can find an idea by what you wrote, not just by the original text."],
      },
    ],
  },
  {
    slug: "how-students-can-highlight-research-online-and-cite-it",
    title: "How Students Can Highlight Research Online and Cite It Later",
    description: "A practical workflow for students: highlight sources while researching online, keep every quote linked to its source, and pull them into essays without losing track.",
    date: "2026-11-13",
    minutes: 5,
    sections: [
      {
        paragraphs: [
          "Research for an essay usually means dozens of tabs, a messy document of pasted quotes, and a panic the night before when you cannot find where a quote came from. There is a calmer way.",
        ],
      },
      {
        heading: "Highlight sources as you read",
        paragraphs: ["Instead of copying quotes into a document, highlight them where they are. With Gather installed, select a passage and click Save (or 🏷 Category to file it under your essay's sections). The quote, page title, link and date are saved together automatically, which is exactly what you need for a citation."],
      },
      {
        heading: "Note why each quote matters",
        paragraphs: ["Add a quick note to each highlight: which argument it supports, which section it belongs in, or a counter-point to address. When you sit down to write, your quotes are already sorted by purpose."],
      },
      {
        heading: "Find the right quote while writing",
        paragraphs: ["Search your library by keyword or by your notes, for example \"section 2\" or \"counter-argument\". Copy a highlight and you get the quote with its source link attached, ready to paste and cite."],
      },
      {
        heading: "Never lose a source again",
        paragraphs: [
          "Because every highlight keeps its link, you can always reopen the original page to check context or grab citation details. Your library is organised by the day you read things, so you can also retrace your research session by session.",
        ],
      },
      {
        heading: "Export for your bibliography",
        paragraphs: ["When the essay is done, export your highlights as Markdown to keep a permanent record of your sources for the next assignment."],
      },
    ],
  },
  {
    slug: "why-web-highlights-disappear-and-how-to-keep-them",
    title: "Why Your Web Highlights Disappear (and How to Keep Them)",
    description: "Highlighted text on a web page vanishes when you refresh or close the tab. Here is why that happens and how to make highlights on websites permanent.",
    date: "2026-11-11",
    minutes: 3,
    sections: [
      {
        paragraphs: ["You select a sentence, maybe even paint it with a simple highlighter, and the next time you open the page it is gone. Frustrating, but there is a simple reason."],
      },
      {
        heading: "Why highlights vanish",
        paragraphs: [
          "A text selection only exists in your browser's memory for that moment. Basic highlighter tools change the page you are looking at, but nothing is saved: when the page reloads, the website sends a fresh copy and your changes are gone.",
        ],
      },
      {
        heading: "What makes a highlight permanent",
        paragraphs: ["To keep a highlight, a tool has to save it somewhere and know how to find that same text again next time, even if the page has changed slightly."],
        list: [
          "Save the exact highlighted words.",
          "Save a little text before and after, to tell apart repeated phrases.",
          "Find that text again when you revisit the page, and redraw the highlight.",
        ],
      },
      {
        heading: "How Gather keeps your highlights",
        paragraphs: [
          "Gather saves every highlight to your library with its surrounding context. When you come back to a page, it locates the passage again and redraws the highlight, without altering the page. If a page has changed so much that a passage can no longer be found, your highlight is still safe in your library.",
        ],
      },
    ],
  },
];
