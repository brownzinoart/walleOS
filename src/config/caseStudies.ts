import type { RouteComponentId } from "@/utils/router";

export type CaseStudyId = "weready" | "listingpal" | "echo" | "briefflow";

export interface CaseStudyMetaBlock {
  label: string;
  value: string;
}

export interface CaseStudyCard {
  title: string;
  description: string;
}

export interface CaseStudyToolkitIconImage {
  type: "image";
  src: string;
  alt: string;
}

export interface CaseStudyToolkitIconGradient {
  type: "gradient";
  label: string;
  colors: [string, string];
  textColor?: string;
}

export type CaseStudyToolkitIcon =
  | CaseStudyToolkitIconImage
  | CaseStudyToolkitIconGradient;

export interface CaseStudyToolkitCard extends CaseStudyCard {
  icon: CaseStudyToolkitIcon;
}

export interface CaseStudyMilestoneStat {
  label: string;
  value: string;
}

export interface CaseStudyMilestone {
  number: string;
  title: string;
  copyHtml: string;
  stats: CaseStudyMilestoneStat[];
}

export interface CaseStudyShowcaseItem {
  image: string;
  alt: string;
  caption: string;
}

export interface CaseStudyContent {
  id: CaseStudyId;
  heroTitleFallback: string;
  heroDescriptionFallback: string;
  heroEyebrow: string;
  heroMeta: CaseStudyMetaBlock[];
  overview?: {
    eyebrow: string;
    title: string;
    copyHtml?: string;
    cards?: CaseStudyCard[];
  };
  problem: {
    eyebrow: string;
    title: string;
    copyHtml: string;
    cards: CaseStudyCard[];
  };
  capabilities: {
    eyebrow: string;
    title: string;
    cards: CaseStudyCard[];
  };
  toolkit: {
    eyebrow: string;
    title: string;
    cards: CaseStudyToolkitCard[];
  };
  process: {
    eyebrow: string;
    title: string;
    lede: string;
    milestones: CaseStudyMilestone[];
  };
  showcase: {
    eyebrow: string;
    title: string;
    items: CaseStudyShowcaseItem[];
  };
  results: {
    eyebrow: string;
    title: string;
    copyHtml: string;
    cards: CaseStudyCard[];
  };
  backLinkFallback: RouteComponentId;
}

type CaseStudyContentMap = Record<CaseStudyId, CaseStudyContent>;

export const caseStudyContent: CaseStudyContentMap = {
  weready: {
    id: "weready",
    heroTitleFallback: "WeReady",
    heroDescriptionFallback:
      "I built WeReady using AI agent orchestration (Claude Code + Codex CLI + Traycer.ai) to create a startup intelligence platform that processes 60+ data signals for evidence-based readiness scoring.",
    heroEyebrow: "Case Study",
    heroMeta: [
      {
        label: "Role",
        value: "Founder, AI Agent Orchestrator, Systems Architect",
      },
      {
        label: "Focus",
        value:
          "Multi-agent AI coordination, startup intelligence automation, evidence-based scoring",
      },
      {
        label: "Built With",
        value:
          "Claude Code + Codex CLI + Traycer.ai orchestration, Next.js, Supabase",
      },
    ],
    problem: {
      eyebrow: "The Problem",
      title: "Why I Built WeReady",
      copyHtml:
        "I was struggling to find a service that could review my code holistically—not just for technical production readiness, but also for AI hallucination concerns since I use AI engineering extensively. I realized that codebases reveal far more than just code quality.",
      cards: [
        {
          title: "The Complete Story",
          description:
            "Codebases tell your business model, design philosophy, backend architecture, frontend frameworks, and UX decisions.",
        },
        {
          title: "Investment Intelligence",
          description:
            "All these subcontexts provide a comprehensive picture of technical leadership and business acumen.",
        },
        {
          title: "Evidence-Based Analysis",
          description:
            "WeReady analyzes deeper signals that traditional code reviews completely miss for startup intelligence.",
        },
      ],
    },
    capabilities: {
      eyebrow: "Readiness Operating System",
      title: "Evidence-based scoring built for founder and investor trust",
      cards: [
        {
          title: "Evidence-based scoring",
          description:
            "WeReady ingests 60+ operational signals—from repo health and shipment cadence to GTM math—to produce a weighted Launch Readiness Score.",
        },
        {
          title: "Transparent methodology",
          description:
            "Every factor is transparent, traceable, and tuned around the questions that surface in diligence. 4 readiness pillars: product, revenue, momentum, trust.",
        },
        {
          title: "Stage-adaptive weights",
          description:
            "Dynamic weights adjust for stage from idea → seed → Series A, ensuring relevant metrics for each phase of growth.",
        },
        {
          title: "Gap flagging engine",
          description:
            "Automated flagging surfaces urgent gaps before investor meetings, with prescriptive guidance on what to fix first.",
        },
      ],
    },
    toolkit: {
      eyebrow: "AI Agent Orchestration Toolkit",
      title: "Tools Used",
      cards: [
        {
          title: "Claude Code CLI",
          description:
            "UX/UI design system implementation and architectural decisions",
          icon: {
            type: "image",
            src: "https://assets-global.website-files.com/6500ed5c1fd67be80b31c5c9/659a7b05e0e3d8b84ee12cc9_Claude_Logo.svg",
            alt: "Claude AI",
          },
        },
        {
          title: "Codex CLI",
          description: "Backend implementation and data pipeline development",
          icon: {
            type: "image",
            src: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
            alt: "GitHub Codex",
          },
        },
        {
          title: "Gemini + Traycer.ai",
          description: "Strategic planning and system architecture design",
          icon: {
            type: "image",
            src: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
            alt: "Google Gemini",
          },
        },
        {
          title: "Ollama",
          description: "Quick edits and iterations to optimize API usage",
          icon: {
            type: "image",
            src: "https://ollama.com/public/ollama.png",
            alt: "Ollama",
          },
        },
        {
          title: "VS Code + Roo",
          description: "Integrated development environment with AI assistance",
          icon: {
            type: "image",
            src: "https://code.visualstudio.com/assets/images/code-stable.png",
            alt: "VS Code",
          },
        },
        {
          title: "Design System Workflow",
          description:
            "Discover → Plan → Implement → Test methodology using specialized models for optimal results",
          icon: {
            type: "gradient",
            label: "AI",
            colors: ["#00d4ff", "#ff0080"],
          },
        },
      ],
    },
    process: {
      eyebrow: "AI Agent Orchestration",
      title: "How I built WeReady using multi-agent coordination",
      lede: "From identifying the need for startup intelligence to orchestrating Claude Code, Codex CLI, and Traycer.ai to build a production-ready platform.",
      milestones: [
        {
          number: "01",
          title: "Strategic Planning",
          copyHtml:
            "I used <strong>Traycer.ai</strong> to architect the overall system design and plan the multi-agent workflow. This helped me map out how different AI agents would coordinate to process 60+ data signals for startup intelligence.",
          stats: [
            {
              label: "Planning Tool:",
              value: "Traycer.ai for system architecture",
            },
            {
              label: "Focus:",
              value: "Multi-agent coordination strategy",
            },
          ],
        },
        {
          number: "02",
          title: "Architecture & Design",
          copyHtml:
            "I leveraged <strong>Claude Code</strong> to make critical architectural decisions, design data pipelines, and create the evidence-based scoring methodology. Claude helped optimize the agent coordination patterns.",
          stats: [
            {
              label: "Architecture Agent:",
              value: "Claude Code for design decisions",
            },
            {
              label: "Output:",
              value: "Transparent, traceable scoring system",
            },
          ],
        },
        {
          number: "03",
          title: "Implementation",
          copyHtml:
            "I used <strong>Codex CLI</strong> for rapid implementation of the data ingestion, analysis, and reporting systems. The multi-agent approach enabled building complex startup intelligence features at unprecedented speed.",
          stats: [
            {
              label: "Implementation Agent:",
              value: "Codex CLI for rapid development",
            },
            {
              label: "Result:",
              value: "Production-ready platform in months, not years",
            },
          ],
        },
        {
          number: "04",
          title: "Coordinated Intelligence",
          copyHtml:
            "The orchestrated AI agents delivered a platform that processes complex startup data into actionable intelligence. This demonstrates advanced multi-agent coordination for real-world applications.",
          stats: [
            {
              label: "Achievement:",
              value: "Successful multi-agent system deployment",
            },
            {
              label: "Impact:",
              value: "Evidence-based startup intelligence at scale",
            },
          ],
        },
      ],
    },
    showcase: {
      eyebrow: "AI Agent Orchestration Results",
      title: "From multi-agent coordination to production platform",
      items: [
        {
          image: "/images/projects/weready/pic1.webp",
          alt: "WeReady dashboard showing readiness scores",
          caption:
            "Traycer.ai system planning resulted in a unified intelligence dashboard that synthesizes 60+ data signals into actionable startup readiness insights.",
        },
        {
          image: "/images/projects/weready/pic2.webp",
          alt: "Workflow builder for diligence automation",
          caption:
            "Claude Code architectural decisions enabled sophisticated workflow automation that processes complex startup intelligence with transparent methodology.",
        },
        {
          image: "/images/projects/weready/pic3.webp",
          alt: "Mobile view of readiness milestones",
          caption:
            "Codex CLI rapid implementation delivered a responsive platform that keeps startup intelligence accessible across all devices and contexts.",
        },
      ],
    },
    results: {
      eyebrow: "Results",
      title: "What I achieved through AI agent orchestration",
      copyHtml:
        "Building WeReady demonstrated my ability to coordinate multiple AI agents for complex problem-solving, delivering a production platform that processes startup intelligence at scale with transparent methodology.",
      cards: [
        {
          title: "Multi-Agent System Mastery",
          description:
            "Successfully coordinated Traycer.ai, Claude Code, and Codex CLI to build a complex startup intelligence platform. Demonstrated advanced AI orchestration capabilities for real-world applications.",
        },
        {
          title: "Rapid MVP Development",
          description:
            "Leveraged AI agent coordination to compress development timelines dramatically. Built and deployed a production-ready platform processing 60+ data signals in months, not years.",
        },
        {
          title: "Evidence-Based Architecture",
          description:
            "Designed transparent, traceable systems with clear methodology. Every score and recommendation is backed by verifiable data sources, demonstrating technical leadership in AI system design.",
        },
      ],
    },
    backLinkFallback: "projects",
  },
  listingpal: {
    id: "listingpal",
    heroTitleFallback: "ListingPal",
    heroDescriptionFallback:
      "AI tool that generates complete real estate marketing campaigns in 90 seconds—MLS descriptions, social content, and paid ads from just an address.",
    heroEyebrow: "Case Study",
    heroMeta: [
      {
        label: "Role",
        value: "Founder, AI Agent Orchestrator, Real Estate Tech Architect",
      },
      {
        label: "Focus",
        value: "AgentSelect™ framework, marketing automation, MLS integration",
      },
      {
        label: "Built With",
        value:
          "Claude Code + Codex CLI + Traycer.ai orchestration, React, OpenAI API",
      },
    ],
    problem: {
      eyebrow: "The Problem",
      title: "Why I Built ListingPal",
      copyHtml:
        "I was part of my parents' latest house buying experience and couldn't fathom how the real estate agent was able to handle everything they had to—not to mention, my parents were enough to handle, but all the marketing involved for listings and steps needed to complete a sale were overwhelming.",
      cards: [
        {
          title: "Agent Overwhelm",
          description:
            "Real estate agents juggle multiple tools, write copy for different platforms, and optimize for each channel—all while managing demanding clients and complex sales processes.",
        },
        {
          title: "Marketing Complexity",
          description:
            "From MLS descriptions to social media content to paid ads, each platform requires different messaging, formats, and optimization strategies.",
        },
        {
          title: "Time Pressure",
          description:
            "In competitive markets, speed matters. Agents need to get listings live quickly with professional-quality marketing materials that drive results.",
        },
      ],
    },
    capabilities: {
      eyebrow: "AgentSelect™ Framework",
      title: "Complete real estate marketing campaigns in 90 seconds",
      cards: [
        {
          title: "Instant Professional Descriptions",
          description:
            "AI-crafted MLS-ready property descriptions optimized for SEO and engagement, automatically generated from property data.",
        },
        {
          title: "Customized Social Media Content",
          description:
            "Platform-specific posts, captions, and hashtags tailored for maximum reach across Facebook, Instagram, and LinkedIn.",
        },
        {
          title: "Optimized Ad Campaigns",
          description:
            "High-performing paid ad headlines, CTAs, and copy for Facebook, Google, and real estate portals with conversion tracking.",
        },
        {
          title: "MLS Data Integration",
          description:
            "Seamless connection to MLS databases for accurate, compliant content that maintains fair housing standards across all platforms.",
        },
      ],
    },
    toolkit: {
      eyebrow: "AI Agent Orchestration Toolkit",
      title: "Tools Used",
      cards: [
        {
          title: "Claude Code CLI",
          description:
            "Real estate UX patterns and marketing automation workflow design",
          icon: {
            type: "image",
            src: "https://assets-global.website-files.com/6500ed5c1fd67be80b31c5c9/659a7b05e0e3d8b84ee12cc9_Claude_Logo.svg",
            alt: "Claude AI",
          },
        },
        {
          title: "Codex CLI",
          description:
            "MLS integration and campaign generation pipeline development",
          icon: {
            type: "image",
            src: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
            alt: "GitHub Codex",
          },
        },
        {
          title: "Gemini + Traycer.ai",
          description:
            "AgentSelect™ framework architecture and real estate workflow planning",
          icon: {
            type: "image",
            src: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
            alt: "Google Gemini",
          },
        },
        {
          title: "Ollama",
          description:
            "Local testing and content generation optimization for real estate copy",
          icon: {
            type: "image",
            src: "https://ollama.com/public/ollama.png",
            alt: "Ollama",
          },
        },
        {
          title: "VS Code + Roo",
          description:
            "Integrated development environment with AI assistance for rapid prototyping",
          icon: {
            type: "image",
            src: "https://code.visualstudio.com/assets/images/code-stable.png",
            alt: "VS Code",
          },
        },
        {
          title: "Real Estate Workflow",
          description:
            "Address Input → Data Fetch → Content Generation → Multi-Platform Distribution using specialized AI models",
          icon: {
            type: "gradient",
            label: "RE",
            colors: ["#00d4ff", "#ff0080"],
          },
        },
      ],
    },
    process: {
      eyebrow: "AI Agent Orchestration",
      title: "How I built ListingPal using multi-agent coordination",
      lede: "From identifying real estate agent pain points to orchestrating Claude Code, Codex CLI, and Traycer.ai to build a production-ready marketing automation platform.",
      milestones: [
        {
          number: "01",
          title: "Market Research",
          copyHtml:
            "I used <strong>Traycer.ai</strong> to research real estate marketing workflows and identify automation opportunities. This helped me understand the complexity agents face managing multiple platforms and content types.",
          stats: [
            {
              label: "Research Tool:",
              value: "Traycer.ai for market analysis",
            },
            {
              label: "Focus:",
              value: "Real estate marketing workflow pain points",
            },
          ],
        },
        {
          number: "02",
          title: "Framework Design",
          copyHtml:
            "I leveraged <strong>Claude Code</strong> to design the AgentSelect™ framework, creating specialized AI agents for different content types. Claude helped optimize the agent coordination patterns for real estate marketing.",
          stats: [
            {
              label: "Architecture Agent:",
              value: "Claude Code for framework design",
            },
            {
              label: "Output:",
              value: "AgentSelect™ multi-agent system",
            },
          ],
        },
        {
          number: "03",
          title: "Implementation",
          copyHtml:
            "I used <strong>Codex CLI</strong> for rapid implementation of the MLS integration, content generation pipeline, and multi-platform distribution system. The multi-agent approach enabled building complex real estate marketing features at unprecedented speed.",
          stats: [
            {
              label: "Implementation Agent:",
              value: "Codex CLI for rapid development",
            },
            {
              label: "Result:",
              value: "90-second campaign generation from address input",
            },
          ],
        },
        {
          number: "04",
          title: "Production Platform",
          copyHtml:
            "The orchestrated AI agents delivered a platform that transforms a single address into complete marketing campaigns. This demonstrates advanced multi-agent coordination for real-world real estate applications.",
          stats: [
            {
              label: "Achievement:",
              value: "Production real estate marketing automation",
            },
            {
              label: "Impact:",
              value: "90-second campaigns with MLS compliance",
            },
          ],
        },
      ],
    },
    showcase: {
      eyebrow: "AgentSelect™ Framework Results",
      title:
        "From multi-agent coordination to real estate marketing automation",
      items: [
        {
          image: "/images/projects/listingpal/pic1.webp",
          alt: "ListingPal dashboard showing campaign generation",
          caption:
            "Traycer.ai market research resulted in a unified platform that generates MLS descriptions, social content, and paid ads from a single address input.",
        },
        {
          image: "/images/projects/listingpal/pic2.webp",
          alt: "Multi-platform content generation interface",
          caption:
            "Claude Code framework design enabled sophisticated AgentSelect™ coordination that generates platform-specific content with MLS compliance.",
        },
        {
          image: "/images/projects/listingpal/pic3.webp",
          alt: "Mobile view of campaign preview and publishing",
          caption:
            "Codex CLI rapid implementation delivered a responsive platform that keeps real estate marketing accessible across all devices and workflows.",
        },
      ],
    },
    results: {
      eyebrow: "Next Steps",
      title: "What's next for ListingPal",
      copyHtml:
        "The multi-agent foundation is ready, so I'm lining up a small cohort of North Carolina agents to pressure test the workflow. Their feedback will decide whether to double down on the platform, pivot the positioning, or acknowledge the signal isn't strong enough yet.",
      cards: [
        {
          title: "NC Pilot Program",
          description:
            "Coordinating sessions with Triangle and Charlotte agents to run active listings through ListingPal and stress-test the AgentSelect™ pipeline end to end.",
        },
        {
          title: "Feedback Signal",
          description:
            "Capturing qualitative insights and campaign performance metrics to validate which automations solve the highest-friction marketing tasks for operators on the ground.",
        },
        {
          title: "Build, Pivot, or Pause",
          description:
            "Using the pilot data to choose the next move: invest in a broader beta rollout, refocus the product based on unmet needs, or accept that the current thesis lacks validation.",
        },
      ],
    },
    backLinkFallback: "projects",
  },
  echo: {
    id: "echo",
    heroTitleFallback: "Echo",
    heroDescriptionFallback:
      "Submission-ready screenshots, in minutes. Echo is a SaaS platform that automates screenshot capture and accelerates route preparation and QA for pharmaceutical websites.",
    heroEyebrow: "Case Study",
    heroMeta: [
      {
        label: "Role",
        value: "Partner, Technical Architect, Pharma Automation Specialist",
      },
      {
        label: "Focus",
        value:
          "Screenshot automation, MLR compliance, pharmaceutical QA workflows",
      },
      {
        label: "Built With",
        value:
          "Claude Code + Codex CLI + Traycer.ai orchestration, Puppeteer, Node.js, AWS",
      },
    ],
    problem: {
      eyebrow: "The Problem",
      title: "Why I Built Echo",
      copyHtml:
        "After years in pharma advertising, I witnessed teams spending 8+ hours manually capturing screenshots for MLR submissions. The process was tedious, error-prone, and delayed project launches. I knew automation could transform this workflow.",
      cards: [
        {
          title: "Manual Screenshot Hell",
          description:
            "Teams manually capture 100+ screenshots across devices, dealing with animations, interactive elements, and precise framing requirements.",
        },
        {
          title: "MLR Submission Delays",
          description:
            "Route preparation bottlenecks delayed project launches by days or weeks, impacting client relationships and revenue.",
        },
        {
          title: "QA Complexity",
          description:
            "Testing forms, error states, and dynamic content like ISI trays required repetitive manual work across multiple breakpoints.",
        },
      ],
    },
    capabilities: {
      eyebrow: "Pharma Screenshot Automation",
      title: "Complete route preparation in minutes, not hours",
      cards: [
        {
          title: "Lightning-Fast Capture",
          description:
            "~100 screenshots in under 5 minutes across desktop/tablet/mobile, perfectly framed with padding. No extensions or stitching required.",
        },
        {
          title: "Project Settings Management",
          description:
            "Configure environments (staging/production), customize breakpoints, margins, and credentials for seamless automation.",
        },
        {
          title: "Global Project Conditioning",
          description:
            "IF/THEN logic handles animations and interactive elements with reposition, expand, and delay controls.",
        },
        {
          title: "Page-Level Customization",
          description:
            "Reorder, add, or remove pages; apply clicks, hovers, delays—no code required for complete control.",
        },
      ],
    },
    toolkit: {
      eyebrow: "AI Agent Orchestration Toolkit",
      title: "Tools Used",
      cards: [
        {
          title: "Claude Code CLI",
          description:
            "Pharma workflow analysis and automation architecture design",
          icon: {
            type: "image",
            src: "https://assets-global.website-files.com/6500ed5c1fd67be80b31c5c9/659a7b05e0e3d8b84ee12cc9_Claude_Logo.svg",
            alt: "Claude AI",
          },
        },
        {
          title: "Codex CLI",
          description:
            "Screenshot pipeline and browser automation implementation",
          icon: {
            type: "image",
            src: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
            alt: "GitHub Codex",
          },
        },
        {
          title: "Gemini + Traycer.ai",
          description:
            "System architecture and pharmaceutical compliance planning",
          icon: {
            type: "image",
            src: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
            alt: "Google Gemini",
          },
        },
        {
          title: "Ollama",
          description: "Local testing and optimization for screenshot quality",
          icon: {
            type: "image",
            src: "https://ollama.com/public/ollama.png",
            alt: "Ollama",
          },
        },
        {
          title: "VS Code + Roo",
          description: "Integrated development environment with AI assistance",
          icon: {
            type: "image",
            src: "https://code.visualstudio.com/assets/images/code-stable.png",
            alt: "VS Code",
          },
        },
        {
          title: "Pharma Workflow",
          description:
            "Route Analysis → Screenshot Capture → Quality Check → MLR Package using specialized automation",
          icon: {
            type: "gradient",
            label: "Rx",
            colors: ["#0353a4", "#00c6ff"],
          },
        },
      ],
    },
    process: {
      eyebrow: "AI Agent Orchestration",
      title: "How I built Echo using multi-agent coordination",
      lede: "From identifying pharma screenshot pain points to orchestrating Claude Code, Codex CLI, and Traycer.ai to build a production-ready automation platform.",
      milestones: [
        {
          number: "01",
          title: "Pharma Workflow Research",
          copyHtml:
            "I used <strong>Traycer.ai</strong> to analyze pharma route preparation workflows and identify automation opportunities in the MLR submission process.",
          stats: [
            {
              label: "Research Tool:",
              value: "Traycer.ai for marketing workflow analysis",
            },
            {
              label: "Focus:",
              value: "Route preparation bottlenecks and compliance needs",
            },
          ],
        },
        {
          number: "02",
          title: "Automation Architecture",
          copyHtml:
            "I leveraged <strong>Claude Code</strong> to design the automation system, conditional logic, and compliance safeguards that make Echo production ready.",
          stats: [
            {
              label: "Architecture Agent:",
              value: "Claude Code for automation decisions",
            },
            {
              label: "Output:",
              value: "Scalable, compliant screenshot orchestration",
            },
          ],
        },
        {
          number: "03",
          title: "Implementation",
          copyHtml:
            "I used <strong>Codex CLI</strong> to build the screenshot pipelines, route configuration UI, and capture orchestration. Codex made Puppeteer automation accessible to non-technical teams.",
          stats: [
            {
              label: "Implementation Agent:",
              value: "Codex CLI for automation scripting",
            },
            {
              label: "Result:",
              value: "100+ screenshots processed in minutes",
            },
          ],
        },
        {
          number: "04",
          title: "Production Package",
          copyHtml:
            "The orchestrated AI agents delivered a production-ready platform that accelerates pharmaceutical QA while meeting stringent MLR requirements.",
          stats: [
            {
              label: "Achievement:",
              value: "8+ hour workflows reduced to minutes",
            },
            {
              label: "Impact:",
              value: "Launch timelines protected, QA quality increased",
            },
          ],
        },
      ],
    },
    showcase: {
      eyebrow: "Pharma Automation Results",
      title: "Accelerating MLR submissions with orchestrated AI",
      items: [
        {
          image: "/images/projects/echo/pic1.webp",
          alt: "Echo automation dashboard overview",
          caption:
            "Traycer.ai workflow research created a system that transforms tedious screenshot capture into streamlined automation for every route.",
        },
        {
          image: "/images/projects/echo/pic2.webp",
          alt: "Automation settings panel",
          caption:
            "Claude Code designed dynamic controls for animations, ISI trays, and interactive elements, keeping every capture compliant.",
        },
        {
          image: "/images/projects/echo/pic3.webp",
          alt: "Puppeteer automation run results",
          caption:
            "Codex CLI implementation delivers pixel-perfect screenshots across devices, merging them into MLR-ready submission packages.",
        },
      ],
    },
    results: {
      eyebrow: "Results",
      title: "Production-grade automation for regulated workflows",
      copyHtml:
        "Echo proves how orchestrated AI shortens launch timelines, removes manual risk, and gives pharma teams the compliance confidence they need.",
      cards: [
        {
          title: "8 Hours → Minutes",
          description:
            "Automated multi-device screenshot capture accelerates route preparation without sacrificing accuracy or framing.",
        },
        {
          title: "Compliance Safe",
          description:
            "Built-in logic handles ISI trays, disclosures, and interaction states so regulatory teams trust the output.",
        },
        {
          title: "Scalable Operations",
          description:
            "Route templates let new launches inherit best practices, turning automation into a repeatable advantage.",
        },
      ],
    },
    backLinkFallback: "projects",
  },
  briefflow: {
    id: "briefflow",
    heroTitleFallback: "BriefFlow",
    heroDescriptionFallback:
      "AI tool that converts messy client inputs into structured, client-approved creative briefs in minutes to cut revision cycles and budget waste.",
    heroEyebrow: "Case Study",
    heroMeta: [
      {
        label: "Role",
        value: "Partner, AI Product Designer, Automation Specialist",
      },
      {
        label: "Focus",
        value:
          "AI-powered briefing, client workflow optimization, creative process automation",
      },
      {
        label: "Built With",
        value:
          "Claude Code + Codex CLI + Gemini + Traycer.ai, Next.js, Supabase",
      },
    ],
    overview: {
      eyebrow: "Problem - Challenge - Solution",
      title: "Overview",
      cards: [
        {
          title: "Problem",
          description: "Creative teams lose weeks to unclear client input and weak briefing processes. On average, 21–56 days vanish in review loops while 33% of marketing budgets are wasted on rework and misaligned deliverables.",
        },
        {
          title: "Challenge",
          description: "Traditional briefing depends on manual intake, back-and-forth revisions, and scattered communication. Teams burn time translating client notes into structure, while project scopes drift and accountability disappears.",
        },
        {
          title: "Solution",
          description: "BriefFlow uses AI orchestration to compress that chaos into clarity. It captures right inputs, generates structured creative briefs in minutes, and delivers client-approved outputs with audit trails—turning weeks of friction into a single, efficient workflow.",
        },
      ],
    },
    problem: {
      eyebrow: "Why We Built BriefFlow",
      title: "Why We Built BriefFlow",
      copyHtml:
        "Years in agency environments showed how dysfunctional briefing kills momentum. Teams spend 21–56 days in review loops while client trust and internal bandwidth erode. We built BriefFlow to compress that entire cycle—giving teams time back for growth, strategy, and relationship-building.",
      cards: [
        {
          title: "Briefing Process Hell",
          description:
            "Creative teams waste nearly one-third of project time on poor briefing habits and chaotic client inputs that lead to endless revisions.",
        },
        {
          title: "Budget Waste",
          description:
            "External agencies and poor briefing processes cost companies millions in wasted marketing spend and failed projects.",
        },
        {
          title: "Client Communication Gaps",
          description:
            "Teams struggle with unstructured client requirements, leading to scope creep and deliverables that miss the mark.",
        },
      ],
    },
    capabilities: {
      eyebrow: "AI-Powered Brief Creation",
      title: "We transformed messy inputs into approved briefs in minutes",
      cards: [
        {
          title: "Smart Intake Forms",
          description:
            "Conditional logic guides clients through the right questions, capturing comprehensive requirements and eliminating information gaps.",
        },
        {
          title: "AI Brief Generation",
          description:
            "Advanced AI transforms messy client inputs into professional, structured creative briefs with clear objectives and deliverables.",
        },
        {
          title: "Client Approval Flow",
          description:
            "Branded review links let clients comment, request changes, and approve briefs seamlessly with full audit trails.",
        },
        {
          title: "Export & Integration",
          description:
            "Export polished PDFs or integrate directly with project management tools, Slack, and creative platforms.",
        },
      ],
    },
    toolkit: {
      eyebrow: "AI Agent Orchestration Toolkit",
      title: "Full Toolset Used",
      cards: [
        {
          title: "Claude Code CLI",
          description:
            "Marketing workflow analysis and AI briefing architecture design",
          icon: {
            type: "image",
            src: "https://assets-global.website-files.com/6500ed5c1fd67be80b31c5c9/659a7b05e0e3d8b84ee12cc9_Claude_Logo.svg",
            alt: "Claude AI",
          },
        },
        {
          title: "Codex CLI",
          description:
            "Form logic implementation and client workflow automation",
          icon: {
            type: "image",
            src: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
            alt: "GitHub Codex",
          },
        },
        {
          title: "Gemini + Traycer.ai",
          description: "System architecture and marketing process optimization",
          icon: {
            type: "image",
            src: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg",
            alt: "Google Gemini",
          },
        },
        {
          title: "Ollama",
          description:
            "Local testing and optimization for brief generation quality without sacrificing paid tokens",
          icon: {
            type: "image",
            src: "https://ollama.com/public/ollama.png",
            alt: "Ollama",
          },
        },
        {
          title: "VS Code and/or Roo, Cline, Kilo Code",
          description: "Integrated development environment with AI assistance for quick revisions",
          icon: {
            type: "image",
            src: "https://code.visualstudio.com/assets/images/code-stable.png",
            alt: "VS Code",
          },
        },
        {
          title: "AI Agent Orchestration",
          description:
            "Multi-agent coordination methodology using specialized models for optimal results",
          icon: {
            type: "gradient",
            label: "AI",
            colors: ["#00d4ff", "#ff0080"],
          },
        },
      ],
    },
    process: {
      eyebrow: "AI Agent Orchestration",
      title: "How I built BriefFlow using multi-agent coordination",
      lede: "From identifying marketing briefing pain points to orchestrating AI tools to build a production-ready platform.",
      milestones: [
        {
          number: "01",
          title: "Marketing Research",
          copyHtml:
            "We reached out to several of our old colleagues regarding this issue we had a hunch was still present in the advertising agency world. It surely was. We met with 12 of our ex colleagues in the product mgmt and account mgmt space.",
          stats: [
            {
              label: "Research Tool:",
              value: "Open-ended zoom chats",
            },
            {
              label: "Focus:",
              value:
                "Confirming creative brief inefficiencies and client communication gaps",
            },
          ],
        },
        {
          number: "02",
          title: "AI Architecture Design",
          copyHtml:
            "I leveraged Gemini and Claude mostly to design the AI briefing system, create a design system, and focus on top notch UX/UI experiences",
          stats: [
            {
              label: "Architecture Agent:",
              value: "Claude Code & Gemini provide a great solid planning base prior to implementation, and Claude specifically, does an amazing job of providing users with the best AI engineering UX/UI practices",
            },
            {
              label: "Output:",
              value: "Smart intake forms and approval workflows",
            },
          ],
        },
        {
          number: "03",
          title: "Implementation",
          copyHtml:
            "I used <strong>Codex CLI</strong> to build rapid implementation of form builders, AI processing pipelines, and integration systems that transform chaotic inputs into structured briefs. Codex has such a sharp eye for backend implementation and efficiencies. It is able to remove a ton of fluff to enhance user and developer experiences alike through codebase optimizations",
          stats: [
            {
              label: "Implementation Agent:",
              value: "Codex CLI for workflow automation and backend reviews",
            },
            {
              label: "Result:",
              value: "Minutes instead of days for brief creation",
            },
          ],
        },
        {
          number: "04",
          title: "Production Platform",
          copyHtml:
            "The orchestrated AI agents delivered a platform that saves agencies 30% of marketing budget by eliminating briefing waste and revision cycles.",
          stats: [
            {
              label: "Achievement:",
              value: "30% reduction in briefing time and budget waste",
            },
            {
              label: "Impact:",
              value: "Structured client communication at scale, and internal efficiencies in brief approvals",
            },
          ],
        },
      ],
    },
    showcase: {
      eyebrow: "AI Brief Creation Results",
      title:
        "From multi-agent coordination to marketing workflow transformation",
      items: [
        {
          image: "/images/projects/briefflow/pic1.webp",
          alt: "BriefFlow AI briefing platform interface",
          caption:
            "Traycer.ai workflow research resulted in a unified platform that transforms chaotic client inputs into structured, approved briefs in minutes.",
        },
        {
          image: "/images/projects/briefflow/pic2.webp",
          alt: "BriefFlow smart intake forms and client approval workflow",
          caption:
            "Claude Code architectural decisions enabled sophisticated conditional logic that guides clients through comprehensive requirement gathering.",
        },
        {
          image: "/images/projects/briefflow/pic3.webp",
          alt: "BriefFlow automated brief generation and export features",
          caption:
            "Codex CLI rapid implementation delivered a responsive platform that eliminates 21-56 day review cycles and saves 30% of marketing budgets.",
        },
      ],
    },
    results: {
      eyebrow: "Results",
      title: "What We achieved through AI agent orchestration",
      copyHtml:
        "Building BriefFlow demonstrated my ability to coordinate multiple AI agents for marketing automation. The abundance of tools these days can create an overwhelming feeling of having too many choices, but the reality is, some models perform better than others when it comes to certain verticals of the AI engineering process (i.e. Codex backend, Claude frontend, Gemini planning…etc) these models can certainly do a ton maybe everything, but it depends on how well they can do things in particular which needs to be identified.",
      cards: [
        {
          title: "30% Budget Savings",
          description:
            "Successfully coordinated AI agents to eliminate briefing waste and revision cycles. Demonstrated advanced automation for marketing workflows and creative processes.",
        },
        {
          title: "Workflow Transformation",
          description:
            "Leveraged AI orchestration to build a system that transforms 21-56 day review cycles into minutes-long brief creation processes.",
        },
        {
          title: "What's Next?",
          description:
            "We have begun finalizing our codebase for security and Beta testing with some of those interviewed colleagues, it seems to be a solution that everyone is very excited to try and implement within their workflows and we are excited to get the feedback to continue to iterate on the product",
        },
      ],
    },
    backLinkFallback: "projects",
  },
};

export const CASE_STUDY_IDS = Object.keys(caseStudyContent) as CaseStudyId[];
