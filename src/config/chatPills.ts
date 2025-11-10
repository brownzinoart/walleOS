// Chat Pill Responses
// 
// Pre-composed answers for the home-page suggestion chips so the UI can display a response without making a fresh API request. Each pill maps to the `suggestionChips` array in `src/config/content.json`.

const chatPillsMarkdown = `# Chat Pill Responses

Pre-composed answers for the home-page suggestion chips so the UI can display a response without making a fresh API request. Each pill maps to the \`suggestionChips\` array in \`src/config/content.json\`.

| Chip ID | Prompt | Suggested Response |
| --- | --- | --- |
| \`who-is-wally\` | Who is Wally? | UX systems architect, Client Relations specialist, and AI implementation lead. I build practical, measurable, human‑centered AI workflows in collaboration with key stakeholders. |
| \`philosophy\` | What's your philosophy? | Clarity over hype. Automate without alienating. |
| \`career-journey\` | Tell me about your career journey. | I started in NYC agency account management (2010-2017), managing flagship pharmaceutical accounts at FCB Health, Scout Marketing, and others. I transitioned into UX design (2017-2020) by bridging account leadership with user-centered design. At Kinesso (2020-2023), I scaled a design team from 2 to 30 and shipped award-winning systems. Now I run One Block Away LLC, focusing on AI orchestration and practical implementation. |
| \`started-in-advertising\` | How did you get started in advertising? | My first major role was as an Account Coordinator at RosettaWishbone, supporting Pfizer's Prevnar 13 Adult Vaccines global initiative. One of my earliest accomplishments was organizing and executing a KOL conference in Dubai. Since I spoke Arabic, I managed everything from travel logistics to stipend distribution directly with KOLs. Account management in NYC was my professional boot camp—I consistently worked on flagship accounts, which gave me access to the decision-making table early and taught me how to strategize across creative, production, and client layers. |
| \`advertising-to-ux\` | How did you transition from advertising to UX? | After half a decade in New York, I relocated to San Diego and joined Scout Marketing, where I could explore user experience design. I became a bridge between account management and UX, mentoring under the new SVP of UX and helping the agency adopt user-centered design thinking. I leaned on client communication and translation skills—turning complex goals into clear tasks for creative, strategy, and tech teams. That phase accelerated my pivot into UX. I freelanced in NYC doing regulated healthcare UX, then joined Heartbeat Ideas full-time before moving on to Kinesso. |
| \`experience-at-kinesso\` | What was your experience like at Kinesso? | I joined as the second member of a nascent design team tasked with transforming developer-built analytics tools into consumer-ready SaaS products. We built everything from scratch and scaled from two to thirty designers across global time zones during COVID. We shipped award-winning systems (DXA, Splash), implemented UX governance, and built a team that enjoyed the work. Under IPG, Kinesso felt like a startup with enterprise resources—energizing and effective. |
| \`current-focus\` | What are you focused on now? | I focus on AI and orchestration through my company, One Block Away LLC. I treat LLMs as collaborators—apply design-thinking to AI workflows: research, plan, implement, test, repeat. I specialize in model selection, orchestration, and agentic workflows using Codex, Claude, Gemini, GLM 4.6, Cursor, and more. My goal: give teams efficiency and creative bandwidth with responsible, usable systems. |

## Update Workflow

- **Frontend sync** happens automatically. \`src/config/chatPills.ts\` parses this table at build time, and \`src/config/content.ts\` hydrates \`suggestionChips\` plus \`mockResponses\` so the UI mirrors whatever you write here.
- **Backend/RAG sync** still needs a refresh. After changing this table (or any document inside \`wallymo_llm_corpus/\`), regenerate embeddings so the vector store sees the new copy:

  \`\`\`bash
  npm run ingest:corpus
  \`\`\`

- **Safety net tests:** run the targeted check to confirm every chip picked up the latest prompt/response pair:

  \`\`\`bash
  npm run test src/__tests__/chat-pills-config.test.ts
  \`\`\`

- **Adding a new chip?** Include the new row here first. The hydration step will auto-create a \`general\` category chip if it doesn't already exist in \`src/config/content.json\`; adjust the category there if you need a more specific bucket.

> **Implementation note:** if you want these to render inside the chat UI, convert the table to the data structure your front-end expects (for example, preload them in a local map keyed by chip ID).
`;

export interface ChatPill {
  id: string;
  prompt: string;
  response: string;
}

const normalizeMarkdown = (markdown: string): string => markdown.replace(/\r\n/g, '\n');

const isHeaderRow = (line: string): boolean => /^\|\s*Chip ID\s*\|/i.test(line);
const isDividerRow = (line: string): boolean => /^\|\s*-+\s*\|/i.test(line);

const parseTableRow = (line: string): ChatPill | null => {
  const trimmed = line.trim();

  if (!trimmed.startsWith('|') || trimmed === '|') {
    return null;
  }

  const cells = trimmed
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());

  if (cells.length < 3) {
    return null;
  }

  const [idCell, promptCell, ...rest] = cells;
  const responseCell = rest.join(' | ').trim();

  const id = idCell?.replace(/`/g, '').trim() ?? '';
  const prompt = promptCell?.trim() ?? '';
  const response = responseCell.trim();

  if (!id || !prompt || !response) {
    return null;
  }

  return { id, prompt, response };
};

const parseChatPills = (markdown: string): ChatPill[] => {
  const lines = normalizeMarkdown(markdown).split('\n');
  const pills: ChatPill[] = [];
  const seenIds = new Set<string>();

  let inTable = false;

  for (const line of lines) {
    if (!inTable) {
      if (isHeaderRow(line)) {
        inTable = true;
      }
      continue;
    }

    if (isDividerRow(line)) {
      continue;
    }

    if (!line.trim()) {
      if (pills.length > 0) {
        break;
      }
      continue;
    }

    if (!line.trim().startsWith('|')) {
      if (pills.length > 0) {
        break;
      }
      continue;
    }

    const pill = parseTableRow(line);

    if (!pill) {
      continue;
    }

    if (seenIds.has(pill.id)) {
      continue;
    }

    seenIds.add(pill.id);
    pills.push(pill);
  }

  return pills;
};

export const chatPills: ChatPill[] = parseChatPills(chatPillsMarkdown);

export const chatPillMap: Map<string, ChatPill> = new Map(
  chatPills.map((pill) => [pill.id, pill]),
);

export const getChatPillById = (id: string): ChatPill | undefined => chatPillMap.get(id);