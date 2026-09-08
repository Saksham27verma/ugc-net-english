# UGC NET English — Practice Test Pack (Sets 1 & 2)

## Files

| File | Contents |
|---|---|
| `UGC-NET-English-Practice-Set-1.md` | 150 questions + answer key + explanations |
| `UGC-NET-English-Practice-Set-2.md` | 150 questions + answer key + explanations |
| `answer-keys.json` | Machine-readable keys and unit map for auto-scoring |

## Exam rules to implement

- **Timer:** 180 minutes, single countdown for the whole paper (as in the real NET — Paper I and Paper II are not separately timed).
- **Marks:** +2 for a correct answer, 0 for wrong, 0 for unattempted. Maximum 300.
- **Question states to support:** *Not Visited*, *Not Answered*, *Answered*, *Marked for Review*, *Answered and Marked for Review* — the real NTA interface uses exactly these five, and the June 2025 paper shows the `Status` field taking values such as `Answered` and `Marked For Review`.
- **Auto-submit** when the timer hits zero; keep the answer sheet and show the result screen.

## Markdown conventions used (for your parser)

Every question follows the same shape, so a single pass is enough:

```
**Q.<n>** <question text, may span lines, may contain a markdown table>
1. <option 1>
2. <option 2>
3. <option 3>
4. <option 4>
```

Useful anchors:

- Question start: `^\*\*Q\.(\d+)\*\*`
- Option line: `^(\d)\.\s+(.*)$`
- Section heading: `^##\s+(.*)$` (gives you the unit name for topic-wise analytics)
- Paper split: `# SECTION A` … `# SECTION B`
- Everything after `# ANSWER KEY` should be withheld until the attempt is submitted — parse it separately, or strip it before serving the paper.
- Comprehension passages are block quotes (`>`) sitting directly under a `## Comprehension` heading; render them pinned beside the sub-questions the way NTA does.
- Explanation lines in the key: `^\*\*Q\.(\d+) — \((\d)\)\*\*\s+(.*)$`

The fenced `Quick key` block in each file is `q:answer` pairs, whitespace-separated — the fastest thing to score against if you don't want to parse the explanations.

## Unit map (for topic-wise result breakdown)

Both sets use the identical blueprint, so scores are comparable across attempts.

**Paper I — 5 questions per unit**

| Q range | Unit |
|---|---|
| 1–5 | Data Interpretation |
| 6–10 | Teaching Aptitude |
| 11–15 | Research Aptitude |
| 16–20 | Communication |
| 21–25 | Mathematical Reasoning |
| 26–30 | Logical Reasoning |
| 31–35 | ICT |
| 36–40 | People, Development & Environment |
| 41–45 | Higher Education System |
| 46–50 | Comprehension |

**Paper II — English**

| Q range | Unit |
|---|---|
| 51–58 | Drama |
| 59–66 | Poetry |
| 67–74 | Fiction & Short Story |
| 75–80 | Non-Fictional Prose |
| 81–90 | Language: Concepts, Theories & Pedagogy |
| 91–98 | English in India |
| 99–105 | Cultural Studies |
| 106–115 | Literary Criticism |
| 116–125 | Literary Theory Post WWII |
| 126–131 | Research Methods & Materials |
| 132–140 | American & Other Non-British Literatures |
| 141–145 | Comprehension (verse) |
| 146–150 | Comprehension (prose) |

## Result screen — what is worth showing

1. Total score out of 300, with Paper I and Paper II sub-totals (100 and 200).
2. Attempted / correct / wrong counts, and accuracy on attempted questions.
3. Unit-wise table using the map above — this is where the diagnostic value sits.
4. Time spent per question if you can capture it; the comprehension sets and the arrangement/matching questions are where candidates lose time.
5. Question-wise review with the explanation revealed only after submission.

## Score bands (out of 300)

| Score | Band |
|---|---|
| 240+ | JRF-competitive range |
| 200–238 | Comfortably above typical qualifying cut-off |
| 160–198 | Borderline; revise the weak units |
| Below 160 | Foundation-building needed |

Cut-offs vary by session and category, so treat these as working targets rather than official thresholds.

## Note on the comprehension passages

The verse and prose passages are original compositions written for these papers, so you can host them without any copyright question. If you want canonical material instead, swap in a public-domain passage of comparable difficulty (a Shakespearean soliloquy, or prose from Bacon, Ruskin or Arnold) and keep the same question types — that is exactly the pattern the June 2025 paper follows, where the Paper II verse passage came from *Measure for Measure* and the prose passage from Ruskin.
