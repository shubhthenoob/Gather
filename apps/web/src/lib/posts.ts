export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date
  minutes: number;
  sections: { heading?: string; paragraphs: string[]; list?: string[]; table?: { head: string[]; rows: string[][] } }[];
  /** Questions answered at the end of the article (also published as FAQPage structured data). */
  faq?: { q: string; a: string }[];
  updated?: string; // ISO date
}

import { EXTRA_POSTS } from "./posts-extra";
import { GUIDE_POSTS } from "./posts-guides";

const BASE_POSTS: Post[] = [
  {
    slug: "how-to-highlight-text-on-any-website-in-chrome",
    title: "How to Highlight Text on Any Website in Chrome",
    description: "Chrome has no built-in highlighter for web pages. Here is how to highlight text on any website, keep the highlights when you come back, and add notes to them.",
    date: "2026-11-17",
    minutes: 4,
    sections: [
      {
        paragraphs: [
          "You can highlight text in a PDF or an e-book, but most of what we read happens on ordinary web pages, and Chrome has no highlighter for those. Select a sentence, close the tab, and it is gone.",
          "This guide shows a simple way to highlight text on any website in Chrome, so the highlight is still there when you return and you can find it again later.",
        ],
      },
      {
        heading: "Why a normal copy-paste is not enough",
        paragraphs: [
          "Many people copy useful passages into a notes app. It works, but it is slow, it loses the link back to the page, and you rarely look at those notes again. A highlight that lives on the page, and in one searchable library, is far more useful.",
        ],
      },
      {
        heading: "Highlight web pages with the Gather extension",
        paragraphs: ["Gather is a free Chrome extension built for exactly this. Once it is installed:"],
        list: [
          "Select any text on a web page. A small toolbar appears next to your selection.",
          "Click Save Highlight. The text turns yellow on the page.",
          "Click Add Note instead if you want to write a thought next to it.",
          "Come back to the page any time and your highlights are painted back where you left them.",
        ],
      },
      {
        heading: "Find your highlights later",
        paragraphs: [
          "Every highlight is also saved to your personal library, organised by date and by website. You can search across everything you have ever highlighted, open the original page in one click, and export your highlights as Markdown.",
          "The page itself is never modified, so highlighting works on news sites, blogs, documentation and most other pages you read.",
        ],
      },
      {
        heading: "Tips for highlighting well",
        paragraphs: [],
        list: [
          "Highlight less than you think. One or two sentences per article are easier to revisit than whole paragraphs.",
          "Add a short note saying why it mattered to you. Future you will thank you.",
          "Review your library once a week. It takes five minutes and turns reading into knowledge you keep.",
        ],
      },
    ],
  },
  {
    slug: "how-to-save-quotes-from-articles-and-find-them-later",
    title: "How to Save Quotes From Articles and Actually Find Them Later",
    description: "Bookmarks and screenshots pile up and get forgotten. A practical system for saving quotes from articles so you can find the exact line when you need it.",
    date: "2026-11-15",
    minutes: 5,
    sections: [
      {
        paragraphs: [
          "You read a great line in an article. A week later you want to quote it in a talk, an essay or a message, and you cannot remember where it was. Sound familiar?",
          "The problem is rarely saving. It is finding. Here is a system that solves both.",
        ],
      },
      {
        heading: "Why bookmarks and screenshots fail",
        paragraphs: [
          "A bookmark saves the whole page, not the sentence you cared about, so you have to re-read the article to find it. Screenshots are worse: they cannot be searched, they fill your camera roll, and they lose the link to the source.",
        ],
      },
      {
        heading: "Save the exact words, with the source attached",
        paragraphs: [
          "The best quote collection stores three things together: the exact words, where they came from, and when you saved them. With those three, any quote can be found and credited in seconds.",
          "Gather does this automatically. Highlight a line in Chrome, click Save Highlight, and Gather stores the text, the page title, the link and the date.",
        ],
      },
      {
        heading: "Add a note while the idea is fresh",
        paragraphs: [
          "The moment you save a quote is the moment you know why it matters. Write it down: \"use in Monday's presentation\" or \"counter-argument to chapter 3\". Notes are searchable too, so you can later find quotes by what you meant to do with them.",
        ],
      },
      {
        heading: "Find any quote in seconds",
        paragraphs: ["When you need a quote, you rarely remember the exact words. You remember a word or two, the site, or roughly when you read it. A good library lets you search all three:"],
        list: [
          "Search by any word in the quote or in your note.",
          "Browse by day to find what you read last Tuesday.",
          "Browse by website to see everything you saved from one source.",
        ],
      },
      {
        heading: "Copy it with the citation",
        paragraphs: [
          "When you find it, copy it with the source attached. In Gather, the copy button gives you the quote, your note and the link, ready to paste into a document or message.",
        ],
      },
    ],
  },
  {
    slug: "a-simple-system-for-remembering-what-you-read-online",
    title: "A Simple System for Remembering What You Read Online",
    description: "Most of what we read online is forgotten within days. A lightweight, three-step habit for remembering the ideas that matter, without a complicated note-taking system.",
    date: "2026-11-12",
    minutes: 4,
    sections: [
      {
        paragraphs: [
          "We read more than ever, and remember less. Articles, threads, newsletters and documentation flow past every day, and within a week almost all of it is gone.",
          "You do not need a complex second-brain setup to fix this. You need a habit small enough to actually keep.",
        ],
      },
      {
        heading: "Step 1: Capture only what stops you",
        paragraphs: [
          "While reading, notice the sentences that make you pause: a surprising fact, a clear explanation, a line you wish you had written. Highlight those and nothing else. Being selective is what makes review possible later.",
        ],
      },
      {
        heading: "Step 2: Write one line about why",
        paragraphs: [
          "Right after highlighting, add a short note in your own words. Explaining an idea, even in a few words, is one of the most reliable ways to remember it. It also tells future you why the highlight mattered.",
        ],
      },
      {
        heading: "Step 3: Review once a week",
        paragraphs: [
          "Set aside five minutes each week to look back over what you saved. Re-reading your own highlights is quick, and repetition spaced over days is what moves ideas into long-term memory.",
          "In Gather, your library is already organised by day, so a weekly review is just scrolling through the last seven pages.",
        ],
      },
      {
        heading: "Keep the friction low",
        paragraphs: [
          "Any system that takes more than a couple of seconds will be abandoned. That is why Gather lives in the browser: select text, click save, keep reading. Everything is organised for you, so the only thinking you do is about the ideas themselves.",
        ],
      },
    ],
  },
];

/** All articles, newest first. */
export const POSTS: Post[] = [...GUIDE_POSTS, ...EXTRA_POSTS, ...BASE_POSTS].sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
