import { defineConfig } from "tinacms";

export default defineConfig({
  branch:
    process.env.TINA_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.HEAD ||
    "main",

  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || "",
  token: process.env.TINA_TOKEN || "",

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [
      // ── Archive pages (the main claims & sources content) ──
      {
        name: "archive",
        label: "Archive",
        path: "content/archive",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "subtitle",
            label: "Subtitle",
          },
          {
            type: "string",
            name: "section",
            label: "Section",
            description: "Which section this belongs to (A, B, C, D)",
            options: [
              { label: "A — The Founding Tradition", value: "A" },
              { label: "B — Through American Identity", value: "B" },
              { label: "C — Transcendence Across Identities", value: "C" },
              { label: "D — Displacement & Contestation", value: "D" },
            ],
          },
          {
            type: "number",
            name: "order",
            label: "Order",
            description: "Sort order within the section (1, 2, 3...)",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
            templates: [
              // ── Custom block: Footnote ──
              {
                name: "Footnote",
                label: "Footnote",
                fields: [
                  {
                    type: "number",
                    name: "number",
                    label: "Footnote Number",
                    required: true,
                  },
                  {
                    type: "rich-text",
                    name: "citation",
                    label: "Citation Text",
                    description:
                      "The full citation — author, title, publisher, year, page numbers, and any commentary.",
                  },
                ],
              },
              // ── Custom block: Footnote Reference (inline marker) ──
              {
                name: "FootnoteRef",
                label: "Footnote Reference",
                inline: true,
                fields: [
                  {
                    type: "number",
                    name: "number",
                    label: "Footnote Number",
                    required: true,
                  },
                ],
              },
              // ── Custom block: Captioned Image ──
              {
                name: "CaptionedImage",
                label: "Image with Caption",
                fields: [
                  {
                    type: "image",
                    name: "src",
                    label: "Image",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "alt",
                    label: "Alt Text",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "caption",
                    label: "Caption",
                    description: "Displayed below the image",
                  },
                  {
                    type: "string",
                    name: "credit",
                    label: "Credit / Source",
                    description: "Attribution line (e.g., 'Library of Congress')",
                  },
                ],
              },
              // ── Custom block: Data Table ──
              {
                name: "DataTable",
                label: "Table",
                fields: [
                  {
                    type: "string",
                    name: "caption",
                    label: "Table Caption",
                  },
                  {
                    type: "object",
                    name: "columns",
                    label: "Columns",
                    list: true,
                    fields: [
                      {
                        type: "string",
                        name: "header",
                        label: "Column Header",
                        required: true,
                      },
                      {
                        type: "string",
                        name: "width",
                        label: "Width",
                        description: "Optional CSS width (e.g., '200px', '30%')",
                      },
                    ],
                  },
                  {
                    type: "object",
                    name: "rows",
                    label: "Rows",
                    list: true,
                    fields: [
                      {
                        type: "string",
                        name: "cells",
                        label: "Cell Values",
                        list: true,
                        description: "One value per column, in order",
                      },
                    ],
                  },
                ],
              },
              // ── Custom block: Call-out / Card ──
              {
                name: "Callout",
                label: "Callout Card",
                fields: [
                  {
                    type: "string",
                    name: "type",
                    label: "Type",
                    options: [
                      { label: "Claim", value: "claim" },
                      { label: "Warrant", value: "warrant" },
                      { label: "Qualifier", value: "qualifier" },
                      { label: "Rebuttal", value: "rebuttal" },
                      { label: "Note", value: "note" },
                    ],
                  },
                  {
                    type: "rich-text",
                    name: "content",
                    label: "Content",
                  },
                ],
              },
            ],
          },
        ],
      },

      // ── Static pages (About, Home, etc.) ──
      {
        name: "page",
        label: "Pages",
        path: "content/pages",
        format: "mdx",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "subtitle",
            label: "Subtitle",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
            templates: [
              {
                name: "CaptionedImage",
                label: "Image with Caption",
                fields: [
                  {
                    type: "image",
                    name: "src",
                    label: "Image",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "alt",
                    label: "Alt Text",
                    required: true,
                  },
                  {
                    type: "string",
                    name: "caption",
                    label: "Caption",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});
