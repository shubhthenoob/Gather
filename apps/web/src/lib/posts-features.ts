import type { Post } from "./posts";

export const FEATURE_POSTS: Post[] = [
  {
    slug: "how-to-colour-code-highlights-on-web-pages",
    title: "How to Colour-Code Highlights on Web Pages (with Categories)",
    description: "Use colour categories to sort web highlights by topic, project or purpose. A simple system for colour-coding what you read in Chrome, and finding it again later.",
    date: "2026-11-20",
    minutes: 6,
    sections: [
      {
        paragraphs: [
          "One yellow highlighter works for a single article. Once you are reading for several projects at once, everything turns yellow and nothing stands out. Colour-coding fixes that: a glance at the page tells you why you saved each passage.",
          "This guide shows how to colour-code highlights on any web page using categories, how to choose a colour system that you will actually keep using, and how to filter by colour later.",
        ],
      },
      {
        heading: "The short answer",
        paragraphs: [
          "Install a highlighter extension that supports categories, such as Gather. Select text, click 🏷 Category, and pick or create a category. The highlight is painted in that category's colour, and you can filter your library by it.",
        ],
      },
      {
        heading: "Colour by category, not by mood",
        paragraphs: [
          "Most colour-coding systems fail because the colours have no fixed meaning. You pick green one day and blue the next. Tying each colour to a named category solves this: the name tells you what it means, and the colour just helps you spot it.",
          "In Gather, each category has a name and a colour. Pick from seven ready-made colours or choose any custom colour. Highlights with no category stay classic yellow.",
        ],
      },
      {
        heading: "Step by step in Gather",
        paragraphs: [],
        list: [
          "Select text on any web page. A small toolbar appears.",
          "Click 🏷 Category. Your most recently used categories are at the top, so the usual choice is one click.",
          "Type a name to search, or click + New category to create one. It gets the next free colour automatically.",
          "Tick more than one category if a passage belongs to several. The first one sets the colour on the page.",
          "Writing a note? The Note box has the same 🏷 Add category button, so the note and its categories are saved together.",
        ],
      },
      {
        heading: "Colour systems that work",
        paragraphs: ["Pick one approach and stick with it. Three that work well:"],
        table: {
          head: ["System", "Example categories", "Best for"],
          rows: [
            ["By project", "Thesis, Client A, Side project", "People juggling several pieces of work"],
            ["By purpose", "Quote, Evidence, Idea, To do", "Writers and researchers"],
            ["By topic", "Design, Health, Recipes, Finance", "General reading and personal learning"],
          ],
        },
      },
      {
        heading: "Find highlights by colour later",
        paragraphs: [
          "Colour-coding pays off when you go looking. In the Gather side panel, tap a category chip to see only those highlights. On the website library, open Categories to browse cards for one category, all categories, or anything uncategorised, and export a single category as Markdown.",
          "Renaming or recolouring a category updates every highlight in it instantly, so you can change your mind without redoing anything.",
        ],
      },
    ],
    faq: [
      { q: "Can I highlight in different colours in Chrome?", a: "Not with Chrome alone. A highlighter extension such as Gather lets you create colour categories and paints each highlight in its category's colour." },
      { q: "Can one highlight have more than one category?", a: "Yes. In Gather you can tick several categories for one highlight. The first category sets the colour shown on the page." },
      { q: "Can I pick my own colours?", a: "Yes. Choose from seven built-in colours or set any custom colour for a category." },
    ],
  },
  {
    slug: "how-to-organise-web-highlights-into-categories",
    title: "How to Organise Web Highlights into Categories (Without a Filing Chore)",
    description: "A low-effort way to organise everything you highlight online: automatic date and website grouping, plus optional categories that take one click.",
    date: "2026-11-20",
    minutes: 5,
    sections: [
      {
        paragraphs: [
          "Most people stop organising their highlights after a week. Folders and tags feel like homework, so everything ends up in one long list. The answer is not more structure, it is structure that costs almost nothing.",
        ],
      },
      {
        heading: "Let the tool organise the basics",
        paragraphs: [
          "Gather already sorts every highlight by the day you saved it and by website, with no effort from you. Full-text search covers the rest: type any word you remember and the passage comes back.",
          "Categories are an extra layer for the things you care about, not a requirement. A plain Save leaves a highlight uncategorised, and that is fine.",
        ],
      },
      {
        heading: "Keep categorising to one click",
        list: [
          "Recent categories appear first in the picker, so repeat choices are one tap.",
          "Create a category from the picker itself without leaving the page.",
          "Add or change categories later from the side panel or the library cards.",
          "Keep the list short. Five to ten categories is plenty; search handles the long tail.",
        ],
        paragraphs: [],
      },
      {
        heading: "Review once a week",
        paragraphs: [
          "Open the Uncategorised view once a week and file anything worth keeping. It takes a couple of minutes and keeps the important material easy to find, without slowing you down while you read.",
        ],
      },
    ],
    faq: [
      { q: "Do I have to categorise every highlight?", a: "No. Categories are optional in Gather. Highlights are always grouped by day and website and are fully searchable." },
      { q: "What happens if I delete a category?", a: "The highlights stay. They simply lose that category, and become uncategorised if it was their only one." },
    ],
  },
  {
    slug: "chrome-side-panel-for-highlights-and-notes",
    title: "Your Highlights in Chrome's Side Panel: Search, Filter and Edit Without Leaving the Page",
    description: "How to use the Gather side panel in Chrome to see a page's highlights, filter by category, search everything and copy quotes with their source.",
    date: "2026-11-20",
    minutes: 4,
    sections: [
      {
        paragraphs: [
          "Switching tabs to check your notes breaks your focus. Chrome's side panel lets an extension sit beside the page you are reading, and Gather uses it to keep your highlights one glance away.",
        ],
      },
      {
        heading: "How to open it",
        list: [
          "Click the Gather icon in Chrome's toolbar.",
          "Press Alt+G on any page.",
          "Click the Gather tab on the edge of the page.",
          "Save a highlight: the panel opens so you can see it. Close the panel and it stays closed until you open it again.",
        ],
        paragraphs: [],
      },
      {
        heading: "What you can do in the panel",
        list: [
          "This page / All: switch between the current page's highlights and everything you have saved.",
          "Search across highlights, notes and category names.",
          "Filter by category with one tap on a coloured chip.",
          "Edit a note, change categories, copy a quote with its link, or delete (with undo).",
          "Jump to the source: open the page and scroll straight to the highlight.",
          "Manage categories: rename, recolour with any colour, or create new ones.",
        ],
        paragraphs: [],
      },
    ],
    faq: [
      { q: "Does the side panel work without an account?", a: "Yes. Highlights and categories are kept on your device until you sign in." },
      { q: "Which Chrome version do I need?", a: "Chrome 116 or newer, which supports the side panel used by Gather." },
    ],
  },
  {
    slug: "highlight-web-pages-without-an-account",
    title: "Highlight Web Pages Without an Account (and Sync Later if You Want)",
    description: "Start highlighting websites in Chrome instantly, with no sign-up. Your highlights stay on your device, and move to your library if you sign in later.",
    date: "2026-11-20",
    minutes: 3,
    sections: [
      {
        paragraphs: [
          "Many highlighter extensions ask you to create an account before you can save a single word. Gather does not. Install it and start highlighting immediately.",
        ],
      },
      {
        heading: "How it works",
        list: [
          "Install Gather. A welcome page opens the side panel.",
          "Highlight, add notes and create categories straight away. Everything is stored locally in your browser.",
          "When you want your highlights on other computers, or a searchable web library, click Sign in with Google.",
          "Everything you saved before is uploaded to your private library, and matching categories are merged by name.",
        ],
        paragraphs: [],
      },
      {
        heading: "Local versus signed in",
        paragraphs: [],
        table: {
          head: ["", "No account", "Signed in"],
          rows: [
            ["Highlights, notes, categories", "Yes", "Yes"],
            ["Side panel and search", "Yes", "Yes"],
            ["Where data lives", "This browser only", "Private library, synced"],
            ["Web library and Markdown export", "No", "Yes"],
            ["Works offline", "Yes", "Yes, syncs when back online"],
          ],
        },
      },
    ],
    faq: [
      { q: "Is anything sent anywhere without an account?", a: "No. Without signing in, Gather keeps highlights in your browser's local storage only." },
      { q: "Will I lose my highlights when I sign in?", a: "No. They are uploaded to your new library automatically." },
    ],
  },
  {
    slug: "best-highlighter-extensions-with-colours-and-categories",
    title: "Best Chrome Highlighter Extensions with Colours and Categories",
    description: "Comparing web highlighters that let you highlight in multiple colours or organise highlights by category: Gather, Weava, Glasp, Diigo and Hypothesis.",
    date: "2026-11-20",
    minutes: 6,
    sections: [
      {
        paragraphs: [
          "If you highlight for more than one reason, colour and categories matter. Here is how the popular Chrome highlighters handle organisation. Details reflect each product's well-known features at the time of writing; check their sites for the latest.",
        ],
      },
      {
        heading: "Comparison",
        paragraphs: [],
        table: {
          head: ["Extension", "Colours", "Categories / organisation", "Account needed to start"],
          rows: [
            ["Gather", "Colour per category, custom colours", "Multiple categories per highlight, side panel filter, date and website library", "No"],
            ["Weava", "Multiple colours", "Folders, aimed at academic research", "Yes"],
            ["Glasp", "Several colours", "Tags and a social profile", "Yes"],
            ["Diigo", "Several colours", "Tags and bookmark lists", "Yes"],
            ["Hypothesis", "Single highlight style", "Tags and groups for shared annotation", "Yes"],
          ],
        },
      },
      {
        heading: "Why we built Gather this way",
        paragraphs: [
          "Plain colours with no names are hard to remember, and folders take effort. Gather ties every colour to a named category, keeps recent categories one click away, and lets one highlight sit in several categories. Highlights also stay private, and you can start without an account.",
        ],
      },
      {
        heading: "How to choose",
        list: [
          "Want sharing or a public profile? Glasp or Hypothesis.",
          "Deep academic work with PDFs and citations? Weava.",
          "Bookmarking plus annotation? Diigo.",
          "Fast, private highlighting with colour categories and a side panel? Gather.",
        ],
        paragraphs: [],
      },
    ],
    faq: [
      { q: "Which highlighter extension has the best colour categories?", a: "Gather links each colour to a named category, supports custom colours and multiple categories per highlight, and filters by category in the side panel." },
      { q: "Is there a free multi-colour web highlighter?", a: "Yes. Gather is free and supports colour categories." },
    ],
  },
];
