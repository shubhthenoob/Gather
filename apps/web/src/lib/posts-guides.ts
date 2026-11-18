import type { Post } from "./posts";

// Competitor details are kept to well-known, stable traits. Re-check them (and the
// "as of" wording) whenever these articles are updated.

const COMPARE_ROWS: string[][] = [
  ["Gather", "Free", "Yes", "Yes", "Date-wise library + full-text search", "Private by default; no social feed"],
  ["Glasp", "Free tier", "Yes", "Yes", "Personal library + public profiles", "Social: highlights can be shared and followed"],
  ["Hypothesis", "Free (non-profit)", "Yes", "Yes", "Annotations by page, groups", "Built for public and group annotation"],
  ["Liner", "Free tier + paid", "Yes", "Yes", "Highlights alongside an AI research assistant", "AI search and answers are the main product"],
  ["Weava", "Free tier + paid", "Yes, multiple colours", "Yes", "Folders, PDF highlighting, citations", "Aimed at students and academics"],
  ["Readwise Reader", "Paid subscription", "Yes, in its reader", "Yes", "Read-later library with spaced review", "A full reading app, not just a highlighter"],
  ["Diigo", "Free tier + paid", "Yes", "Yes (sticky notes)", "Bookmarks with tags and annotations", "Long-running social bookmarking service"],
];

export const GUIDE_POSTS: Post[] = [
  {
    slug: "how-to-highlight-a-web-page",
    title: "How to Highlight a Web Page: The Complete Guide (Chrome, Edge and More)",
    description: "Every way to highlight text on a web page: built-in browser tricks, extensions that keep highlights after you close the tab, and how to find your highlights again later.",
    date: "2026-11-19",
    minutes: 8,
    sections: [
      {
        paragraphs: [
          "Highlighting is the oldest study habit there is, yet most browsers still cannot do it on an ordinary web page. Select a sentence, close the tab, and it is gone.",
          "This guide covers every practical way to highlight a web page, from the tricks already built into your browser to extensions that save your highlights permanently, so you can pick the one that fits how you read.",
        ],
      },
      {
        heading: "The short answer",
        paragraphs: [
          "To highlight a web page and keep the highlight, install a highlighter extension such as Gather, select the text, and click Save Highlight. The highlight stays on the page when you come back, and it is saved to a library you can search.",
          "If you only need to point someone at a passage once, Chrome's built-in \"Copy link to highlight\" is enough. Both methods are explained below.",
        ],
      },
      {
        heading: "Method 1: Chrome's \"Copy link to highlight\" (built in)",
        paragraphs: [
          "Chrome and Edge can create a link that scrolls to a passage and highlights it when someone opens it. It is useful for sharing, but it does not save anything for you.",
        ],
        list: [
          "Select the text on the page.",
          "Right-click the selection and choose Copy link to highlight.",
          "Paste the link anywhere. Opening it scrolls to the passage and marks it.",
        ],
      },
      {
        heading: "Why built-in highlighting is not enough",
        paragraphs: [
          "A highlight link only exists if you keep the link somewhere. There is no list of everything you highlighted, no notes, and no search. For reading you want to remember, you need the highlight saved for you.",
        ],
      },
      {
        heading: "Method 2: A highlighter extension (recommended)",
        paragraphs: [
          "A highlighter extension adds a real highlighter to every page. The good ones save each highlight to your account and redraw it whenever you revisit the page. Here is how it works with Gather, a free Chrome extension:",
        ],
        list: [
          "Install Gather from the Chrome Web Store and sign in with Google.",
          "Select any text. A small toolbar appears next to your selection.",
          "Click Save Highlight to mark it, or Add Note to write a thought beside it.",
          "Click a highlight any time to read or edit your note, or to remove it.",
          "Come back to the page later and your highlights are painted back where you left them.",
        ],
      },
      {
        heading: "Method 3: Copy into a notes app",
        paragraphs: [
          "Copying passages into Notion, Google Docs or Apple Notes works, but it is slow, it separates the quote from the page, and the link is easy to lose. Many people use an extension to capture, then export to their notes app once a week.",
        ],
      },
      {
        heading: "How to find your highlights later",
        paragraphs: [
          "Highlighting is only half the job; finding the passage again is the other half. In Gather, every highlight goes into a personal library that is organised automatically:",
        ],
        list: [
          "By day: see everything you highlighted on any date.",
          "By website: see everything saved from one source.",
          "By search: type any word from the highlight or from your note.",
          "Export: download a day or your whole library as Markdown.",
        ],
      },
      {
        heading: "Which method should you use?",
        paragraphs: [],
        table: {
          head: ["Method", "Keeps highlights", "Notes", "Search later", "Best for"],
          rows: [
            ["Copy link to highlight", "Only if you save the link", "No", "No", "Sharing one passage"],
            ["Highlighter extension (Gather)", "Yes, on the page and in a library", "Yes", "Yes", "Anything you want to remember"],
            ["Copy into notes app", "Yes, separately from the page", "Yes", "Depends on the app", "Long-form note-taking"],
          ],
        },
      },
    ],
    faq: [
      { q: "Can you highlight text on a website without an extension?", a: "Partly. Chrome and Edge let you right-click selected text and choose \"Copy link to highlight\", which creates a link that highlights the passage when opened. It does not save the highlight for you; for that you need an extension." },
      { q: "How do I keep highlights on a web page after refreshing?", a: "Use an extension that saves highlights to an account and redraws them on each visit, such as Gather. Highlights made by simply changing the page disappear when the page reloads." },
      { q: "Is there a free web page highlighter?", a: "Yes. Gather is free and works on any normal website in Chrome." },
      { q: "Can I add notes to highlighted text?", a: "Yes. In Gather, select text and choose Add Note, or click an existing highlight to add or edit a note." },
    ],
  },
  {
    slug: "best-chrome-highlighter-extensions",
    title: "The Best Chrome Highlighter Extensions in 2026, Compared",
    description: "An honest comparison of the best web highlighter extensions for Chrome: Gather, Glasp, Hypothesis, Liner, Weava, Readwise Reader and Diigo. Features, pricing model and who each one is for.",
    date: "2026-11-19",
    minutes: 10,
    sections: [
      {
        paragraphs: [
          "There are dozens of highlighter extensions for Chrome, and most of them can paint text yellow. The real differences show up later: can you find a highlight six months from now, does the tool respect your privacy, and is it built for how you actually read?",
          "We make Gather, so we are not neutral. We have tried to be fair: each tool below is genuinely good at something, and we say plainly when another tool is a better fit than ours. Features and pricing change, so check each product's site before deciding.",
        ],
      },
      {
        heading: "Quick comparison",
        paragraphs: ["Pricing models and features as of November 2026."],
        table: { head: ["Tool", "Price model", "Highlights on any page", "Notes", "Finding highlights later", "Notable difference"], rows: COMPARE_ROWS },
      },
      {
        heading: "1. Gather: best for a private, searchable reading memory",
        paragraphs: [
          "Gather is a free Chrome extension focused on one job: keep what matters from anything you read, and make it easy to find later. Highlights are redrawn when you revisit a page, notes sit beside the passage, and every highlight lands in a library organised by date and website, with full-text search across highlights and notes.",
          "It draws highlights using the browser's own highlight API rather than changing the page's HTML, so it does not break web apps. Your library is private; there is no social feed.",
          "Choose Gather if you want a simple, private highlighter with a strong \"find it later\" library. Look elsewhere if you need PDF highlighting, multiple highlight colours, or public sharing.",
        ],
      },
      {
        heading: "2. Glasp: best for social highlighting",
        paragraphs: [
          "Glasp is a well-known social web highlighter. You highlight and take notes on web pages, and your highlights can appear on a public profile that others can follow, with discovery of what other readers are highlighting.",
          "Choose Glasp if sharing and discovering highlights with other people is part of the appeal.",
        ],
      },
      {
        heading: "3. Hypothesis: best for public and group annotation",
        paragraphs: [
          "Hypothesis is a non-profit, open-source annotation tool widely used in education and research. Its strength is conversation: annotations can be public or shared within a private group, which makes it popular for class reading and peer review.",
          "Choose Hypothesis for collaborative annotation. It is less focused on a personal, date-organised library.",
        ],
      },
      {
        heading: "4. Liner: best if you want an AI research assistant",
        paragraphs: [
          "Liner began as a highlighter and has grown into an AI-powered research and search assistant. Highlighting is still available, but the product centres on AI answers and source finding.",
          "Choose Liner if AI-assisted search is what you want, with highlighting as a supporting feature.",
        ],
      },
      {
        heading: "5. Weava: best for academic highlighting with colours and PDFs",
        paragraphs: [
          "Weava is a highlighter aimed at students and researchers, with multiple highlight colours, folders, PDF support and citation features.",
          "Choose Weava if colour-coding and PDF highlighting matter most.",
        ],
      },
      {
        heading: "6. Readwise Reader: best all-in-one reading app",
        paragraphs: [
          "Readwise Reader is a paid read-it-later app with excellent highlighting, plus Readwise's spaced-review emails and integrations with many note-taking tools. You read inside Reader rather than on the original page.",
          "Choose Readwise Reader if you want a complete reading workflow and are happy to pay a subscription.",
        ],
      },
      {
        heading: "7. Diigo: best for bookmarking with annotations",
        paragraphs: [
          "Diigo is one of the longest-running social bookmarking and annotation services, combining bookmarks, tags, highlights and sticky notes.",
          "Choose Diigo if bookmark organisation with tags is your main need.",
        ],
      },
      {
        heading: "How to choose",
        paragraphs: [],
        list: [
          "Want a free, private highlighter you can search later: Gather.",
          "Want to share highlights publicly: Glasp.",
          "Annotating together with a class or team: Hypothesis.",
          "Want AI answers first: Liner.",
          "Need colours and PDFs for academic work: Weava.",
          "Want a full paid reading app: Readwise Reader.",
        ],
      },
    ],
    faq: [
      { q: "What is the best highlighter extension for Chrome?", a: "It depends on what you need. For a free, private highlighter with a searchable, date-organised library, Gather is a strong choice. Glasp suits social sharing, Hypothesis suits group annotation, Weava suits colour-coded academic work, and Readwise Reader suits people who want a full paid reading app." },
      { q: "What is the best free web highlighter?", a: "Gather is free and saves highlights and notes from any website into a searchable library. Glasp, Hypothesis and Diigo also offer free use." },
      { q: "Which highlighter extensions keep highlights after closing the tab?", a: "All of the tools in this comparison save highlights to an account and show them again when you return, including Gather, Glasp, Hypothesis, Liner, Weava and Diigo." },
    ],
  },
  {
    slug: "best-web-highlighter-for-researchers",
    title: "The Best Web Highlighter for Researchers (and How to Build a Research Workflow)",
    description: "What researchers need from a web highlighter, which tools fit which kind of research, and a simple workflow for capturing, annotating and citing online sources.",
    date: "2026-11-19",
    minutes: 7,
    sections: [
      {
        paragraphs: [
          "Research online produces a flood of material: papers viewed as web pages, reports, documentation, news and datasets. The hard part is not reading it, but keeping the right passages with their sources, and finding them again when you write.",
        ],
      },
      {
        heading: "What researchers need from a highlighter",
        paragraphs: [],
        list: [
          "Source kept with every passage: the URL, page title and date, so anything can be cited.",
          "Notes in context: your interpretation beside the exact text it refers to.",
          "Search across everything: months of reading, searchable by any word.",
          "A timeline: the ability to retrace a research session by date.",
          "Export: get findings into Obsidian, Notion, Zotero notes or a manuscript.",
          "Privacy: unpublished research should stay private.",
        ],
      },
      {
        heading: "Which tool fits which research",
        paragraphs: [],
        table: {
          head: ["Need", "Good fit", "Why"],
          rows: [
            ["Private, searchable library of web sources", "Gather", "Date and website organisation, full-text search, Markdown export, private by default"],
            ["Annotating readings with a group or class", "Hypothesis", "Public and private group annotation, open source"],
            ["Colour-coded highlighting including PDFs", "Weava", "Multiple colours, folders and PDF support"],
            ["Reference management and citations", "Zotero (alongside a highlighter)", "Dedicated citation manager; pairs well with any web highlighter"],
          ],
        },
      },
      {
        heading: "A research workflow that works",
        paragraphs: [],
        list: [
          "Capture: highlight only the passages that answer your research question.",
          "Annotate: add one line saying what the passage shows and how you might use it.",
          "Tag through notes: start notes with a theme, such as \"method:\" or \"counter:\", so a search pulls related passages together.",
          "Review weekly: scroll through the last week's highlights to spot patterns early.",
          "Synthesise: search by theme, copy passages with their links, and export to your writing tool.",
        ],
      },
      {
        heading: "Using Gather for research",
        paragraphs: [
          "Gather saves each highlight with its page title, link and date, keeps your notes beside it, and organises everything by day and by website. Search covers both highlights and notes, and the copy button gives you the quote, your note and the link together, ready to cite.",
          "Gather works on web pages in Chrome. For PDFs, use a PDF reader or a tool like Weava, and keep Gather for web sources.",
        ],
      },
    ],
    faq: [
      { q: "What is the best highlighter for academic research online?", a: "For a private, searchable library of web sources, Gather works well. For group annotation, Hypothesis is widely used. For colour-coded highlighting including PDFs, Weava is a common choice. Many researchers pair a highlighter with a reference manager such as Zotero." },
      { q: "How do I keep track of sources while researching online?", a: "Use a highlighter that saves the page title, link and date with every highlight, such as Gather, then copy highlights with their links when writing." },
    ],
  },
  {
    slug: "gather-vs-glasp",
    title: "Gather vs Glasp: Which Web Highlighter Should You Use?",
    description: "Gather and Glasp both highlight web pages in Chrome. The difference: Glasp is social, Gather is private and built around finding highlights later. A fair comparison.",
    date: "2026-11-18",
    minutes: 5,
    sections: [
      {
        paragraphs: [
          "Gather and Glasp both let you highlight and annotate any web page in Chrome and keep those highlights in a library. They are built around different ideas, so the right choice depends on what you want from highlighting.",
        ],
      },
      {
        heading: "The main difference",
        paragraphs: [
          "Glasp is a social highlighter: your highlights can live on a public profile, you can follow other readers, and discovering what others highlight is part of the experience.",
          "Gather is private by design: there is no profile or feed. It focuses on a personal library organised by date and website, with fast search, so you can find any highlight later.",
        ],
      },
      {
        heading: "Side by side",
        paragraphs: ["As of November 2026; check each product for current details."],
        table: {
          head: ["", "Gather", "Glasp"],
          rows: [
            ["Highlight any web page", "Yes", "Yes"],
            ["Notes on highlights", "Yes", "Yes"],
            ["Library organisation", "Automatic by date and website", "Personal library and profile"],
            ["Social features", "None, private by default", "Public profiles, following, discovery"],
            ["Export", "Markdown", "Several export and integration options"],
            ["Price", "Free", "Free tier available"],
          ],
        },
      },
      {
        heading: "Choose Gather if",
        paragraphs: [],
        list: ["You want your reading kept private.", "You care most about finding a highlight again quickly.", "You like a simple tool that does one thing well."],
      },
      {
        heading: "Choose Glasp if",
        paragraphs: [],
        list: ["You enjoy sharing what you read.", "You want to discover highlights from other people.", "You want a broader set of integrations."],
      },
    ],
    faq: [
      { q: "Is Gather a good Glasp alternative?", a: "Yes, if you want a private highlighter. Gather has no social profile or feed and focuses on a date-organised, searchable personal library." },
      { q: "Are Gather highlights public?", a: "No. Your Gather library is private to your account." },
    ],
  },
  {
    slug: "gather-vs-hypothesis",
    title: "Gather vs Hypothesis: Personal Highlighting or Group Annotation?",
    description: "Hypothesis is built for public and group annotation; Gather is built for a private, searchable reading library. How they compare and when to use each.",
    date: "2026-11-18",
    minutes: 4,
    sections: [
      {
        paragraphs: [
          "Hypothesis and Gather both let you annotate any web page, but they solve different problems. Hypothesis is about annotating together; Gather is about remembering what you read on your own.",
        ],
      },
      {
        heading: "Side by side",
        paragraphs: ["As of November 2026; check each product for current details."],
        table: {
          head: ["", "Gather", "Hypothesis"],
          rows: [
            ["Highlight and annotate any page", "Yes", "Yes"],
            ["Who sees annotations", "Only you", "Public, private, or a group you choose"],
            ["Organisation", "Automatic by date and website, full-text search", "Annotations by page, filterable by user and group"],
            ["Typical use", "Personal reading memory", "Classes, research groups, public discussion"],
            ["Organisation behind it", "Independent product", "Non-profit, open source"],
          ],
        },
      },
      {
        heading: "When to use which",
        paragraphs: [
          "Use Hypothesis when the annotations are meant to be read by others, such as a class discussing a reading or a team reviewing a document.",
          "Use Gather when you want your own highlights and notes kept privately and easy to find later. Many people use both: Hypothesis for group work, Gather for everything else they read.",
        ],
      },
    ],
    faq: [
      { q: "Can I use Gather and Hypothesis together?", a: "Yes. They are separate extensions. Many people use Hypothesis for group annotation and Gather for their personal reading library." },
    ],
  },
  {
    slug: "gather-vs-liner",
    title: "Gather vs Liner: A Simple Highlighter or an AI Research Assistant?",
    description: "Liner has grown into an AI research assistant; Gather stays a focused, private web highlighter with a searchable library. Which one fits how you read?",
    date: "2026-11-18",
    minutes: 4,
    sections: [
      {
        paragraphs: [
          "Liner started as a web highlighter and is now best known as an AI-powered search and research assistant. Gather is a focused highlighter: save the passages you choose, add notes, and find them again later.",
        ],
      },
      {
        heading: "Side by side",
        paragraphs: ["As of November 2026; check each product for current details."],
        table: {
          head: ["", "Gather", "Liner"],
          rows: [
            ["Highlight any web page", "Yes", "Yes"],
            ["Main focus", "Your own highlights and notes", "AI search and answers"],
            ["Finding highlights later", "Date and website library, full-text search", "Saved highlights within the Liner app"],
            ["Price", "Free", "Free tier with paid plans"],
          ],
        },
      },
      {
        heading: "Which should you pick?",
        paragraphs: [
          "Pick Liner if you want an AI assistant to search and summarise sources for you. Pick Gather if you want a lightweight, private record of what you chose to keep, in your own words.",
        ],
      },
    ],
  },
  {
    slug: "best-glasp-alternatives",
    title: "The Best Glasp Alternatives for Highlighting the Web",
    description: "Looking for a Glasp alternative? Private, academic and all-in-one options compared: Gather, Hypothesis, Weava, Readwise Reader, Liner and Diigo.",
    date: "2026-11-17",
    minutes: 5,
    sections: [
      {
        paragraphs: [
          "Glasp is a popular social highlighter. If you want something different, perhaps more private, more academic, or a complete reading app, here are the strongest alternatives and who each is for.",
        ],
      },
      {
        heading: "Alternatives at a glance",
        paragraphs: ["As of November 2026; check each product for current details."],
        table: { head: ["Tool", "Price model", "Highlights on any page", "Notes", "Finding highlights later", "Notable difference"], rows: COMPARE_ROWS.filter((r) => r[0] !== "Glasp") },
      },
      {
        heading: "Our picks",
        paragraphs: [],
        list: [
          "Most private: Gather, a free highlighter with no social features and a searchable, date-organised library.",
          "For group annotation: Hypothesis, the non-profit, open-source annotation tool.",
          "For academic work: Weava, with colours, folders and PDF support.",
          "For an all-in-one reading app: Readwise Reader, a paid subscription.",
          "For AI-first research: Liner.",
          "For bookmarks with annotations: Diigo.",
        ],
      },
    ],
    faq: [
      { q: "What is a private alternative to Glasp?", a: "Gather is a free Chrome highlighter with no public profiles or feeds. Your highlights and notes stay private in a searchable library." },
    ],
  },
];
