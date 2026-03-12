import { useState } from "react";

const NAV = [
  { id: "score", icon: "◎", label: "Score Engine" },
  { id: "taxonomy", icon: "⬡", label: "Skill Taxonomy" },
  { id: "subskills", icon: "⊹", label: "Sub-Skills" },
  { id: "skilldna", icon: "◬", label: "Skill DNA" },
  { id: "verification", icon: "◈", label: "Verification" },
  { id: "ai", icon: "⌬", label: "AI Engine" },
  { id: "social", icon: "⌘", label: "Social & Chat" },
  { id: "b2c", icon: "→", label: "B2C Model" },
  { id: "schema", icon: "⬕", label: "Schema" },
  { id: "flows", icon: "▣", label: "User Flows" },
];

// ─── DATA ────────────────────────────────────────────────────────────────────

const SCORE_ENGINE = {
  title: "Ahead Score Engine v2",
  subtitle: "Unbounded, granular, verification-weighted scoring",
  concept: "The Ahead Score is a perpetually growing number — there is no ceiling. Every verified sub-skill, every passed quiz, every linked project adds to it. The score compounds. A student who has been consistently learning for 2 years should score meaningfully higher than one who just joined — and the score reflects that truth.",
  pillars: [
    {
      name: "Skill Depth Score",
      weight: "40%",
      formula: "Σ (sub-skill weight × proficiency_multiplier × verification_multiplier)",
      desc: "Each skill contains N sub-skills. Each sub-skill is rated by the user (aware / familiar / proficient) and multiplied by its verification status. A verified 'proficient' sub-skill contributes far more than an unverified 'aware' self-report.",
      breakdown: [
        { label: "Self-reported, no verification", multiplier: "0.4×" },
        { label: "Quiz passed (7/10+)", multiplier: "1.0×" },
        { label: "Certification uploaded", multiplier: "1.2×" },
        { label: "GitHub repo linked + analyzed", multiplier: "1.3×" },
        { label: "Live project / Vercel link", multiplier: "1.4×" },
        { label: "Project link with AI code analysis", multiplier: "1.5×" },
      ],
    },
    {
      name: "Goal Alignment Score",
      weight: "20%",
      formula: "roadmap_completion_rate × goal_relevance_of_skills × recency_weight",
      desc: "How well the user's verified skill portfolio aligns with their stated ultimate goal. If your goal is 'FAANG SDE', but you have zero DSA verification, your alignment score drops.",
      breakdown: [
        { label: "Daily goal streak (7 days)", multiplier: "+5 pts/day" },
        { label: "Weekly milestone completed", multiplier: "+25 pts" },
        { label: "Roadmap phase completed", multiplier: "+100 pts" },
        { label: "Skills match goal cluster", multiplier: "1.0–1.3× multiplier" },
      ],
    },
    {
      name: "Learning Velocity",
      weight: "20%",
      formula: "Δ(skill_depth_score) / Δ(time) — rolling 30-day window",
      desc: "Rate of verified skill gain over the last 30 days. A user who added 8 verified sub-skills this month beats a static user with a higher total. Rewards momentum.",
      breakdown: [
        { label: "New sub-skill self-reported", multiplier: "+1 velocity pt" },
        { label: "New sub-skill verified", multiplier: "+4 velocity pts" },
        { label: "New top-level skill verified", multiplier: "+15 velocity pts" },
        { label: "30-day inactivity penalty", multiplier: "−10% velocity decay" },
      ],
    },
    {
      name: "Consistency Index",
      weight: "12%",
      formula: "log(streak_days + 1) × engagement_frequency_score",
      desc: "Platform engagement regularity, goal check-ins, and streak maintenance. Logarithmic scaling rewards long-term consistency without punishing missed days catastrophically.",
      breakdown: [
        { label: "Daily login + goal check", multiplier: "+2 pts/day" },
        { label: "7-day streak", multiplier: "+20 bonus" },
        { label: "30-day streak", multiplier: "+100 bonus" },
        { label: "Resource consumed + marked done", multiplier: "+3 pts" },
      ],
    },
    {
      name: "Peer Benchmark Modifier",
      weight: "8%",
      formula: "percentile_rank(user_score, peer_group) × 0.08",
      desc: "A normalization layer. Being in the top 5% of your college in your field adds a bonus. This keeps the score honest — a 600 at a top-tier college means more than a 600 at a smaller institution.",
      breakdown: [
        { label: "Top 1% in college", multiplier: "+80 pts modifier" },
        { label: "Top 10% in college", multiplier: "+40 pts modifier" },
        { label: "Top 25% in college", multiplier: "+20 pts modifier" },
        { label: "Below median", multiplier: "+0 modifier" },
      ],
    },
  ],
  growth: [
    "Score only moves upward — no decay except velocity and consistency sub-components.",
    "A student with 3 years of consistent verified skills could realistically reach 2000–4000+ points.",
    "Leaderboards show absolute Ahead Score, not normalized — rewarding genuine long-term growth.",
    "Rank within college is calculated by raw score relative to peers at the same institution.",
    "Global rank uses the raw score — no normalization at leaderboard level.",
  ],
};

const TAXONOMY = {
  title: "Skill Taxonomy",
  subtitle: "LinkedIn-scale breadth, with deep technical granularity",
  note: "Every top-level skill contains 8–25 sub-skills. Users pick which sub-skills they know, not just the parent skill. This is the core differentiator from every other platform.",
  domains: [
    {
      domain: "Computer Science Core",
      color: "#fff",
      skills: [
        { name: "Data Structures & Algorithms", subs: 24, example: "Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, Backtracking, Segment Trees, Tries, Heap, Sorting algorithms, BFS/DFS, Sliding Window, Two Pointers, Bit Manipulation..." },
        { name: "Operating Systems", subs: 14, example: "Process management, Threads, Deadlock, Memory Management, Virtual Memory, File Systems, CPU Scheduling, IPC, Semaphores, Paging..." },
        { name: "Computer Networks", subs: 16, example: "OSI Model, TCP/IP, HTTP/HTTPS, DNS, Routing protocols, Subnetting, NAT, Firewalls, Load Balancing, WebSockets, CDN..." },
        { name: "Database Management", subs: 18, example: "SQL queries, Joins, Indexes, Transactions, ACID, Normalization, Stored Procedures, Views, NoSQL fundamentals, Query optimization..." },
        { name: "System Design", subs: 20, example: "Load balancers, Caching strategies, CAP theorem, Microservices, Message queues, Rate limiting, Consistent hashing, DB sharding, API design..." },
        { name: "Computer Architecture", subs: 10, example: "CPU pipeline, Cache hierarchy, Memory models, RISC vs CISC, Instruction sets, Assembly basics..." },
      ],
    },
    {
      domain: "Programming Languages",
      color: "#d0d0d0",
      skills: [
        { name: "Python", subs: 18, example: "Syntax, OOP, Decorators, Generators, Asyncio, Type hints, Context managers, List comprehensions, Standard library, pip ecosystem..." },
        { name: "JavaScript / TypeScript", subs: 22, example: "ES6+, Closures, Event loop, Promises, async/await, Prototypes, TypeScript types, Generics, DOM API, Module systems..." },
        { name: "C / C++", subs: 16, example: "Pointers, Memory management, STL, Templates, RAII, Smart pointers, Compilation model, Concurrency, Makefile..." },
        { name: "Java", subs: 15, example: "OOP, Collections, Streams, Concurrency, JVM internals, Spring basics, Maven/Gradle, Annotations..." },
        { name: "Go", subs: 12, example: "Goroutines, Channels, Interfaces, Error handling, Modules, net/http, Testing..." },
        { name: "Rust", subs: 11, example: "Ownership, Borrowing, Lifetimes, Traits, Error handling, Cargo, Unsafe Rust basics..." },
      ],
    },
    {
      domain: "Web Development",
      color: "#b0b0b0",
      skills: [
        { name: "HTML", subs: 12, example: "Semantic HTML, Forms, Tables, Accessibility (ARIA), Meta tags, Canvas, SVG, Web components, SEO markup..." },
        { name: "CSS", subs: 20, example: "Box model, Flexbox, Grid, Animations, Transitions, Variables, Media queries, Pseudo-elements, Transforms, Clip-path, Filters..." },
        { name: "React", subs: 18, example: "JSX, Hooks (useState, useEffect, useMemo, useCallback, useRef), Context, Redux, React Query, Portals, Error boundaries, Performance..." },
        { name: "Next.js", subs: 14, example: "App Router, SSR, SSG, ISR, API routes, Middleware, Image optimization, Metadata API, Server components..." },
        { name: "Node.js", subs: 15, example: "Event loop, Streams, File system, HTTP module, Express, Middleware, Authentication, Error handling, Worker threads..." },
        { name: "REST API Design", subs: 12, example: "HTTP methods, Status codes, Versioning, Authentication, Pagination, Rate limiting, OpenAPI spec, Error handling..." },
        { name: "GraphQL", subs: 10, example: "Schema, Resolvers, Queries, Mutations, Subscriptions, Apollo, DataLoader, Introspection..." },
      ],
    },
    {
      domain: "AI / Machine Learning",
      color: "#909090",
      skills: [
        { name: "Machine Learning", subs: 22, example: "Linear regression, Logistic regression, Decision trees, Random forests, SVM, K-means, PCA, Cross-validation, Bias-variance, Feature engineering..." },
        { name: "Deep Learning", subs: 18, example: "Neural networks, Backpropagation, CNNs, RNNs, LSTMs, Attention mechanism, Transformers, Batch normalization, Dropout, Transfer learning..." },
        { name: "NLP", subs: 15, example: "Tokenization, Word embeddings, BERT, GPT architecture, Fine-tuning, RAG, Prompt engineering, Named entity recognition, Sentiment analysis..." },
        { name: "Computer Vision", subs: 13, example: "Image preprocessing, Object detection (YOLO), Segmentation, Feature extraction, OpenCV, CLIP, Image generation..." },
        { name: "MLOps", subs: 12, example: "Model versioning, ML pipelines, Feature stores, Model monitoring, Docker for ML, CI/CD for ML, Experiment tracking..." },
        { name: "Data Science", subs: 16, example: "Pandas, NumPy, Data cleaning, EDA, Statistical testing, Visualization (Matplotlib, Seaborn, Plotly), SQL for analysis..." },
        { name: "Reinforcement Learning", subs: 10, example: "MDP, Q-learning, Policy gradients, Actor-Critic, Multi-arm bandit, OpenAI Gym, PPO, DQN..." },
      ],
    },
    {
      domain: "DevOps & Cloud",
      color: "#707070",
      skills: [
        { name: "Docker", subs: 12, example: "Dockerfile, Layers, Multi-stage builds, Docker Compose, Networking, Volumes, Registry, Security..." },
        { name: "Kubernetes", subs: 15, example: "Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, Namespaces, Helm, HPA, StatefulSets..." },
        { name: "AWS", subs: 20, example: "EC2, S3, RDS, Lambda, API Gateway, CloudFront, IAM, VPC, ECS, CloudWatch, Route53, SQS/SNS..." },
        { name: "CI/CD", subs: 10, example: "GitHub Actions, GitLab CI, Jenkins, Pipeline design, Deployment strategies, Artifact management, Secrets management..." },
        { name: "Linux & Shell", subs: 13, example: "File system, Permissions, Processes, Cron, Bash scripting, SSH, Grep/Sed/Awk, Systemd, Networking commands..." },
        { name: "Infrastructure as Code", subs: 10, example: "Terraform, Pulumi, AWS CDK, State management, Modules, Provider configuration..." },
      ],
    },
    {
      domain: "Cybersecurity",
      color: "#505050",
      skills: [
        { name: "Web Security", subs: 14, example: "OWASP Top 10, XSS, CSRF, SQL Injection, Authentication flaws, CORS, Content Security Policy, HTTPS/TLS..." },
        { name: "Network Security", subs: 11, example: "Firewalls, IDS/IPS, VPN, Packet analysis, Port scanning, Encryption protocols..." },
        { name: "Cryptography", subs: 10, example: "Symmetric/Asymmetric encryption, RSA, AES, Hashing, Digital signatures, PKI, TLS handshake..." },
        { name: "Ethical Hacking / Penetration Testing", subs: 12, example: "Reconnaissance, Exploitation, Privilege escalation, Metasploit, Burp Suite, CTF techniques..." },
      ],
    },
    {
      domain: "Mobile Development",
      color: "#383838",
      skills: [
        { name: "React Native", subs: 13, example: "Components, Navigation, State, Native modules, Expo, Performance, Publishing..." },
        { name: "Flutter / Dart", subs: 12, example: "Widgets, State management, Animations, Platform channels, Pub packages, Build and deploy..." },
        { name: "Android (Kotlin)", subs: 14, example: "Activities, Fragments, ViewModel, LiveData, Coroutines, Jetpack Compose, Room, Retrofit..." },
        { name: "iOS (Swift)", subs: 13, example: "UIKit, SwiftUI, Core Data, URLSession, Combine, App lifecycle, App Store submission..." },
      ],
    },
    {
      domain: "Other Technical",
      color: "#282828",
      skills: [
        { name: "Version Control (Git)", subs: 11, example: "Branching, Merging, Rebasing, Cherry-pick, Stash, GitHub workflow, PR reviews, Conflict resolution..." },
        { name: "Blockchain / Web3", subs: 12, example: "Smart contracts, Solidity, Ethereum, IPFS, NFTs, DeFi, Hardhat, Web3.js, Wallets..." },
        { name: "Competitive Programming", subs: 8, example: "Contest strategy, Number theory, Geometry, String algorithms, Advanced graphs, Codeforces/Leetcode patterns..." },
        { name: "Embedded Systems / IoT", subs: 10, example: "Microcontrollers, Raspberry Pi, Arduino, Sensors, RTOS, Protocols (I2C, SPI, UART), Firmware..." },
        { name: "Game Development", subs: 11, example: "Unity, Unreal, Game loop, Physics, Shader basics, Networking for games, Audio, Asset pipeline..." },
      ],
    },
  ],
};

const SUBSKILLS = {
  title: "Sub-Skill Detail System",
  subtitle: "Granular knowledge declaration — the platform's core differentiator",
  concept: "When a user selects 'CSS' as a skill, they don't just mark themselves as a CSS developer. They expand into 20 sub-skills and tell us exactly what they know. This creates a skill fingerprint that is honest, specific, and directly actionable for AI roadmap generation.",
  levels: [
    { level: "Aware", desc: "I've heard of this / read about it / know it conceptually. I couldn't implement it from scratch.", points: 1, color: "#3a3a3a" },
    { level: "Familiar", desc: "I've used this before with reference material. I understand how it works but need to look things up.", points: 3, color: "#606060" },
    { level: "Proficient", desc: "I can implement this confidently without reference. I understand edge cases and trade-offs.", points: 7, color: "#ffffff" },
  ],
  example: {
    skill: "CSS",
    subs: [
      { name: "Box Model", chosen: "Proficient" },
      { name: "Flexbox", chosen: "Proficient" },
      { name: "CSS Grid", chosen: "Familiar" },
      { name: "Animations & Transitions", chosen: "Familiar" },
      { name: "CSS Variables", chosen: "Proficient" },
      { name: "Media Queries", chosen: "Proficient" },
      { name: "Pseudo-elements & Pseudo-classes", chosen: "Familiar" },
      { name: "Transforms & Clip-path", chosen: "Aware" },
      { name: "CSS Filters", chosen: "Aware" },
      { name: "CSS Preprocessors (Sass/Less)", chosen: "Familiar" },
    ],
  },
  ux: [
    "On skill selection, an inline drawer expands showing all sub-skills for that skill.",
    "Each sub-skill row has three toggle buttons: Aware / Familiar / Proficient. Default is none selected.",
    "User can also select 'Skip' — meaning they don't know this sub-skill yet (doesn't penalize, but doesn't add points).",
    "After selecting, the row shows a visual indicator and the contribution to their Ahead Score preview updates live.",
    "A progress bar at the top of the skill drawer shows how much of the skill taxonomy they've declared.",
    "Users can return to update sub-skill levels at any time — score updates immediately.",
  ],
};

const VERIFICATION = {
  title: "Skill Verification System",
  subtitle: "Trust but verify — multiple paths to credibility",
  concept: "Self-reported skills are the starting point, not the end. The platform actively encourages users to back their claims with evidence. Each verification method carries a different weight multiplier. Users choose which path works best for each skill.",
  methods: [
    {
      method: "Adaptive Quiz",
      icon: "◎",
      multiplier: "1.0×",
      best_for: "Any sub-skill",
      desc: "5–10 AI-generated questions per sub-skill cluster. Questions adapt in difficulty based on the user's stated proficiency level. Proficient-level questions test application, not just recall.",
      detail: [
        "Questions generated dynamically per sub-skill, not from a static bank.",
        "Minimum passing threshold: 70% (7/10 or 4/5 depending on length).",
        "Failed quiz: user drops to 'Familiar' level regardless of self-report.",
        "Quiz can be retaken after 48 hours.",
        "Partial quiz credit: 50–69% score → 'Familiar' level unlocked at 0.7× multiplier.",
        "Questions include MCQ, code-trace, fill-in-blank, and output prediction types.",
      ],
    },
    {
      method: "GitHub Repository",
      icon: "⬡",
      multiplier: "1.3×",
      best_for: "Programming, frameworks, system design",
      desc: "User submits a GitHub repo URL. The platform's AI analyzer reads the repo: languages used, complexity of code, patterns implemented, README quality, commit history, and test coverage.",
      detail: [
        "AI analysis checks: does the code actually demonstrate the claimed sub-skills?",
        "Repo must be public or user grants read access via GitHub OAuth.",
        "Analysis flags: complexity score, sub-skills evidenced, code quality markers.",
        "Manual fallback: if AI analysis is uncertain, repo is queued for lightweight human review.",
        "Private repos supported via GitHub OAuth token (not stored, only read-once).",
        "Repo can verify multiple skills/sub-skills in a single submission.",
      ],
    },
    {
      method: "Live Project / Vercel / Netlify Link",
      icon: "→",
      multiplier: "1.4×",
      best_for: "Frontend, full-stack, backend APIs",
      desc: "User submits a live deployment URL. The platform fetches the site, analyzes its features, complexity, and the technologies visibly in use. Highest trust for web skills.",
      detail: [
        "AI visits the URL and evaluates: features present, responsiveness, complexity.",
        "Cross-references with any linked GitHub source repo for full-stack verification.",
        "Checks technology indicators: bundle analysis, API responses, UI patterns.",
        "User adds a brief description of what they built and which skills it demonstrates.",
        "Re-verification available if project is updated.",
      ],
    },
    {
      method: "Certification Upload",
      icon: "◈",
      multiplier: "1.2×",
      best_for: "Cloud, ML, cybersecurity, formal courses",
      desc: "User uploads a certification image or PDF. AI reads the issuing body, course name, completion date, and score (if present). Recognized issuers get full multiplier.",
      detail: [
        "Recognized issuers (full 1.2×): Google, AWS, Meta, Microsoft, Coursera, edX, NPTEL, Udemy (rated 4.5+), Leetcode.",
        "Unknown issuers (partial 1.05×): any cert from an unrecognized source gets reduced multiplier.",
        "Expiry check: AWS/GCP certs expire — platform tracks expiry and reduces multiplier post-expiry.",
        "Cert is parsed via OCR + AI to extract structured data.",
        "PDF certificates are preferred; image fallback with quality check.",
        "Certificate metadata stored; original file is not retained after processing.",
      ],
    },
    {
      method: "External Project Link",
      icon: "⊹",
      multiplier: "1.25×",
      best_for: "General projects, portfolios, hackathons",
      desc: "Any public URL to a project — could be a blog post, a published npm package, an API endpoint, a Kaggle notebook, a Devpost entry, or similar. More flexible than Vercel-specific links.",
      detail: [
        "User provides URL + description of which skills are demonstrated.",
        "AI attempts to fetch and analyze the linked content.",
        "Kaggle: reads notebook complexity, dataset used, score achieved.",
        "npm/PyPI packages: reads package complexity, download count, documentation quality.",
        "Blog/writeup: reads technical depth and sub-skills demonstrated.",
        "Hackathon (Devpost): reads project description and tech stack.",
      ],
    },
  ],
  flow: [
    { step: "01", action: "User declares sub-skills for a parent skill (Aware / Familiar / Proficient)" },
    { step: "02", action: "Platform shows verification prompt: 'Back your claim — choose a verification method'" },
    { step: "03", action: "User selects method: Quiz, GitHub, Live Link, Cert, or Project Link" },
    { step: "04", action: "Verification runs (quiz: immediate; link/cert: async, usually < 2 minutes)" },
    { step: "05", action: "Result returned: verified ✓ or dropped to lower proficiency level" },
    { step: "06", action: "Ahead Score recalculates with new multiplier. Leaderboard updates in real-time." },
  ],
};

const AI_ENGINE = {
  title: "AI Intelligence Engine",
  subtitle: "Roadmaps, resources, and recommendations — all context-aware",
  systems: [
    {
      name: "Roadmap Generator",
      desc: "Builds a fully personalized, phased learning roadmap based on three inputs: the user's ultimate goal, their current verified skill fingerprint, and the gap analysis between the two.",
      inputs: ["Ultimate goal (e.g. 'FAANG SDE-2', 'Build and ship an AI SaaS', 'Research in NLP')", "Current verified sub-skills per domain", "Time availability (hours/week — set during onboarding)", "Preferred learning style (video / reading / project-based)"],
      outputs: ["Phase-by-phase roadmap (Foundation → Core → Advanced → Goal-specific)", "Each phase: list of skills/sub-skills to acquire with priority order", "Daily tasks: micro-actions (e.g. 'Solve 2 sliding window problems on LeetCode')", "Weekly milestones: verifiable checkpoints (e.g. 'Complete binary trees section + pass quiz')", "Estimated completion timeline per phase"],
      model: "Uses Claude/GPT-4o with a structured system prompt containing the full skill taxonomy, the user's verified skill state as JSON, and their goal. Output is structured JSON parsed into the roadmap UI.",
    },
    {
      name: "Resource Recommendation Engine",
      desc: "For each sub-skill in the roadmap, the engine recommends the best learning resources — ranked by community rating, relevance to the specific sub-skill, and the user's stated preferred learning style.",
      resource_types: [
        { type: "YouTube Videos", example: "Abdul Bari for DSA algorithms, Andrej Karpathy for neural nets" },
        { type: "Websites & Docs", example: "MDN for web, Papers With Code for ML, CP-Algorithms for competitive programming" },
        { type: "Books", example: "CLRS for algorithms, DDIA for system design, Deep Learning by Goodfellow" },
        { type: "Courses", example: "Coursera ML Specialization, MIT OCW, CS50, fast.ai" },
        { type: "Practice Platforms", example: "LeetCode, HackerRank, Kaggle, OverTheWire (security)" },
        { type: "GitHub Repos", example: "Curated awesome-lists, reference implementations, open-source projects to study" },
      ],
      ranking: "Resources are ranked using a hybrid score: static curated quality score + user rating within .ahead + recency weight + relevance-to-sub-skill embedding similarity.",
    },
    {
      name: "Quiz Generator",
      desc: "On-demand quiz generation for any sub-skill cluster. Questions are generated fresh per quiz attempt using the skill taxonomy and the user's declared proficiency level to calibrate difficulty.",
      question_types: [
        { type: "Multiple Choice", use: "Conceptual understanding, definitions, which-is-correct" },
        { type: "Code Trace", use: "Given this code, what is the output? (For programming skills)" },
        { type: "Fill in the Blank", use: "Complete the code snippet / formula" },
        { type: "Output Prediction", use: "What does this function return for input X?" },
        { type: "Short Identify", use: "Which data structure best fits this scenario? Why?" },
      ],
      calibration: "Aware-level questions test recognition. Familiar-level tests application. Proficient-level tests edge cases, optimization, and trade-offs.",
    },
    {
      name: "GitHub / Project Analyzer",
      desc: "An AI agent that reads submitted repositories and project URLs, maps the code to skill sub-skills in the taxonomy, and returns a structured verification result.",
      analysis_points: ["Languages and frameworks detected", "Design patterns identified (MVC, repository pattern, singleton, etc.)", "Complexity indicators (cyclomatic complexity, abstraction level)", "Sub-skills evidenced in code with confidence scores", "Red flags: plagiarized boilerplate, tutorial clones, minimal complexity"],
    },
    {
      name: "Adaptive Goal Suggester",
      desc: "If a user hasn't declared a goal yet, or wants to explore, this system suggests top ultimate goals based on their current skill fingerprint, field, and similar users' trajectories.",
      data_used: ["Current verified skills", "College field (CSE, AI/ML, IT)", "Top skills of students who achieved similar goals", "Job market signals (trending skills in JD analysis)"],
    },
  ],
};

const B2C = {
  title: "B2C Business Model",
  subtitle: "Free by default. Premium for power users. Institutional for colleges.",
  tiers: [
    {
      name: "Free",
      price: "₹0",
      target: "Every student",
      color: "#3a3a3a",
      features: [
        "Full skill taxonomy access (all domains)",
        "Sub-skill declaration for up to 3 domains",
        "Basic Ahead Score (Skill Depth + Consistency only)",
        "College leaderboard view",
        "AI roadmap (1 active roadmap)",
        "5 resource recommendations per skill",
        "1 quiz attempt per sub-skill per week",
        "1 GitHub repo verification",
        "Friend search + add (up to 10 friends)",
        "Basic 1-on-1 chat",
      ],
      limits: ["Limited to 3 domains", "No project/cert verification", "No country/global leaderboard", "No rank history graph"],
    },
    {
      name: "Pro",
      price: "₹199/mo",
      target: "Serious learners",
      color: "#ffffff",
      features: [
        "All skill domains unlocked (unlimited sub-skills)",
        "Full Ahead Score (all 5 pillars)",
        "All verification methods: quiz, GitHub, Vercel, cert, project link",
        "AI roadmap (unlimited, switchable goals)",
        "Unlimited resource recommendations + save to library",
        "Unlimited quiz attempts (48hr cooldown on same sub-skill)",
        "State + Country + Global leaderboard views",
        "Full rank history graph (all-time)",
        "Friends up to 100 + group chat (up to 10 friends)",
        "Priority AI roadmap regeneration",
        "Weekly Ahead Score breakdown email",
        "Profile badge: Pro",
      ],
      limits: [],
    },
    {
      name: "Pro Annual",
      price: "₹1,499/yr",
      target: "Committed users",
      color: "#e8d5a3",
      features: [
        "Everything in Pro",
        "2 months free vs monthly",
        "Ahead Score export (PDF resume supplement)",
        "Priority verification queue (< 30 min turnaround)",
        "Early access to new features",
        "Profile badge: Pro ∞",
      ],
      limits: [],
    },
    {
      name: "Campus",
      price: "Custom (per college)",
      target: "Colleges & institutions",
      color: "#888",
      features: [
        "All students get Pro features free",
        "Admin dashboard: see aggregated skill stats of enrolled students",
        "Placement cell: filter students by skill + Ahead Score for internship/job referrals",
        "Anonymous college-wide skill gap reports",
        "College branding on leaderboard",
        "API access for integration with college LMS",
        "Dedicated onboarding support",
      ],
      limits: [],
    },
  ],
  monetization: [
    { stream: "Pro subscriptions", desc: "Primary revenue. Target: 5–10% of MAU convert to Pro." },
    { stream: "Campus licensing", desc: "B2B2C: college pays flat annual fee, all students get Pro." },
    { stream: "Certification partnerships", desc: "Courses/platforms pay for featured placement in resource recommendations." },
    { stream: "Recruitment API", desc: "Companies pay to search verified skill profiles for hiring." },
    { stream: "Ahead Score API", desc: "Third-party platforms (LMS, job boards) can query normalized scores via API." },
  ],
  growth: [
    { stage: "0–6 months", action: "Seed 2–3 colleges. Free only. Focus on leaderboard virality within college WhatsApp groups." },
    { stage: "6–12 months", action: "Launch Pro. Use college leaderboard FOMO ('Your classmate is ranked #3 nationally') to drive conversion." },
    { stage: "12–18 months", action: "First Campus deals with placement-focused engineering colleges." },
    { stage: "18–30 months", action: "Recruitment API launch. Verified Ahead Scores become a hiring signal." },
    { stage: "30+ months", action: "Pan-India scale. Explore ASEAN expansion (similar engineering college culture)." },
  ],
};

const SCHEMA = {
  title: "Extended Schema",
  subtitle: "Data models for the deeper skill system",
  models: [
    {
      name: "SkillDomain",
      desc: "Top-level domain (e.g. 'AI / Machine Learning')",
      fields: [
        { f: "id", t: "uuid", n: "PK" },
        { f: "name", t: "string", n: "e.g. 'Web Development'" },
        { f: "slug", t: "string", n: "unique, URL-safe" },
        { f: "icon", t: "string", n: "emoji or icon key" },
        { f: "sort_order", t: "int", n: "display ordering" },
      ],
    },
    {
      name: "Skill",
      desc: "A skill within a domain (e.g. 'CSS' within 'Web Development')",
      fields: [
        { f: "id", t: "uuid", n: "PK" },
        { f: "domain_id", t: "uuid", n: "FK → SkillDomain" },
        { f: "name", t: "string", n: "e.g. 'CSS'" },
        { f: "slug", t: "string", n: "unique" },
        { f: "sub_skill_count", t: "int", n: "denormalized count" },
        { f: "base_weight", t: "float", n: "skill importance in scoring" },
        { f: "embedding", t: "vector(1536)", n: "pgvector, for AI matching" },
      ],
    },
    {
      name: "SubSkill",
      desc: "A specific sub-skill within a skill (e.g. 'CSS Animations' within 'CSS')",
      fields: [
        { f: "id", t: "uuid", n: "PK" },
        { f: "skill_id", t: "uuid", n: "FK → Skill" },
        { f: "name", t: "string", n: "e.g. 'CSS Animations & Transitions'" },
        { f: "description", t: "text", n: "what proficiency in this means" },
        { f: "point_value", t: "int", n: "base score contribution" },
        { f: "difficulty", t: "enum", n: "beginner | intermediate | advanced" },
        { f: "embedding", t: "vector(1536)", n: "for resource matching" },
      ],
    },
    {
      name: "UserSubSkill",
      desc: "A user's declared + verified state for a specific sub-skill",
      fields: [
        { f: "id", t: "uuid", n: "PK" },
        { f: "user_id", t: "uuid", n: "FK → User" },
        { f: "sub_skill_id", t: "uuid", n: "FK → SubSkill" },
        { f: "self_level", t: "enum", n: "aware | familiar | proficient | skipped" },
        { f: "verified_level", t: "enum", n: "null | aware | familiar | proficient" },
        { f: "verification_method", t: "enum", n: "quiz | github | vercel | cert | project | none" },
        { f: "verification_id", t: "uuid", n: "FK → Verification" },
        { f: "score_contribution", t: "float", n: "computed: points × multiplier" },
        { f: "updated_at", t: "timestamp", n: "" },
      ],
    },
    {
      name: "Verification",
      desc: "A single verification attempt and its result",
      fields: [
        { f: "id", t: "uuid", n: "PK" },
        { f: "user_id", t: "uuid", n: "FK → User" },
        { f: "method", t: "enum", n: "quiz | github | vercel | cert | project" },
        { f: "resource_url", t: "string", n: "null for quiz" },
        { f: "status", t: "enum", n: "pending | analyzing | passed | failed | partial" },
        { f: "multiplier_awarded", t: "float", n: "0.4 – 1.5" },
        { f: "ai_analysis_result", t: "jsonb", n: "structured AI output" },
        { f: "sub_skills_verified", t: "uuid[]", n: "array of SubSkill IDs confirmed" },
        { f: "submitted_at", t: "timestamp", n: "" },
        { f: "completed_at", t: "timestamp", n: "null if pending" },
      ],
    },
    {
      name: "QuizAttempt",
      desc: "A quiz session for a skill cluster",
      fields: [
        { f: "id", t: "uuid", n: "PK" },
        { f: "user_id", t: "uuid", n: "FK → User" },
        { f: "skill_id", t: "uuid", n: "FK → Skill" },
        { f: "questions", t: "jsonb", n: "array of generated Q&A objects" },
        { f: "answers_given", t: "jsonb", n: "user's answers" },
        { f: "score", t: "float", n: "0.0 – 1.0" },
        { f: "passed", t: "bool", n: "score ≥ 0.70" },
        { f: "proficiency_awarded", t: "enum", n: "aware | familiar | proficient" },
        { f: "attempted_at", t: "timestamp", n: "" },
        { f: "next_attempt_allowed_at", t: "timestamp", n: "+48hr if failed" },
      ],
    },
  ],
};


const SKILL_DNA = {
  title: "Skill DNA",
  subtitle: "Open-ended skill intelligence — if you can name it, .ahead understands it",
  concept: "The skill taxonomy covers 1000+ sub-skills, but human knowledge doesn't fit in a list. Skill DNA is the system that handles everything outside the taxonomy. When a user types any skill — no matter how niche, emerging, or custom — the platform's LLM layer understands it, scores it, maps it to related known skills, and integrates it seamlessly into the Ahead Score. No skill is left unrecognized.",
  how_it_works: [
    { step: "01", title: "User Types a Custom Skill", desc: "On the skill selection screen, below the taxonomy, there is a free-text input: 'Know something not listed? Type it.' The user types anything — 'Retrieval-Augmented Generation', 'Blender 3D rigging', 'Solana smart contracts', 'Reinforcement Learning from Human Feedback', 'Figma auto-layout', or even 'Prompt engineering for image models'." },
    { step: "02", title: "LLM Semantic Understanding", desc: "The typed skill is sent to the AI layer (Claude / GPT-4o). The model identifies: what domain this skill belongs to, what level of technical depth it implies, which known taxonomy skills it is most similar to, whether it is a sub-skill of an existing skill or a standalone skill, and an estimated rarity/demand score based on training knowledge." },
    { step: "03", title: "Auto Sub-Skill Generation", desc: "The LLM generates 5–12 contextually relevant sub-skills for the custom skill on the fly. These are not from a database — they are generated fresh, specific to what the user typed. The user then declares proficiency (Aware / Familiar / Proficient) on each generated sub-skill, exactly like the taxonomy flow." },
    { step: "04", title: "Skill DNA Fingerprint Created", desc: "The custom skill and its sub-skills are embedded using a vector embedding model (e.g. text-embedding-3-large). This embedding becomes part of the user's Skill DNA — a high-dimensional representation of their unique knowledge profile. It is stored in pgvector." },
    { step: "05", title: "Ahead Score Integration", desc: "The custom skill contributes to the Ahead Score exactly like any taxonomy skill — weighted by proficiency level and verification multiplier. The LLM also assigns a base_weight to the custom skill relative to demand and depth, which is used in scoring." },
    { step: "06", title: "Verification Still Applies", desc: "All five verification methods work for custom skills too. If you type 'RLHF' and pass a quiz (AI-generated on the fly for that skill), you get the 1.0× multiplier. Link a GitHub repo demonstrating it — 1.3×. The verification pipeline is skill-agnostic." },
    { step: "07", title: "Cross-User Aggregation", desc: "When enough users add the same custom skill (threshold: 50+ users), the platform automatically promotes it into the official taxonomy as a new verified skill. The Skill DNA system is how the taxonomy grows — crowdsourced, AI-validated, continuously expanding." },
  ],
  examples: [
    { typed: "Retrieval-Augmented Generation", mapped_to: "NLP → Advanced sub-skill", generated_subs: ["Chunking strategies", "Embedding model selection", "Vector store integration", "Re-ranking techniques", "Context window management", "RAG evaluation metrics"], demand: "Very High" },
    { typed: "Solana smart contracts", mapped_to: "Blockchain / Web3 → Solana-specific", generated_subs: ["Rust for Solana", "Anchor framework", "Account model", "PDAs (Program Derived Addresses)", "SPL tokens", "Transaction structure"], demand: "High" },
    { typed: "Figma auto-layout", mapped_to: "UI/UX Design → Component systems", generated_subs: ["Auto-layout frames", "Constraints & resizing", "Component variants", "Design tokens", "Responsive layout logic"], demand: "Medium" },
    { typed: "Blender geometry nodes", mapped_to: "3D / Creative Tech → Procedural generation", generated_subs: ["Node editor basics", "Procedural mesh generation", "Attribute manipulation", "Instancing", "Math nodes"], demand: "Medium" },
  ],
  scoring_logic: [
    "LLM assigns a demand_score (0–1) based on how sought-after the skill is in the current tech market.",
    "LLM assigns a depth_score (0–1) based on how technically complex the skill domain is.",
    "base_weight = (demand_score × 0.6) + (depth_score × 0.4) — normalized to match taxonomy skill weights.",
    "Custom skill point contribution = base_weight × proficiency_points × verification_multiplier.",
    "Custom skills are clearly labeled in the user's profile with a ◬ DNA badge so viewers know it's self-declared and AI-understood, not taxonomy-listed.",
    "If the skill is later promoted to the taxonomy, the badge updates automatically and the score is preserved.",
  ],
  dna_profile: "The union of all a user's embedded skills — taxonomy and custom — forms their Skill DNA Profile: a vector in high-dimensional space. This enables: finding users with similar skill fingerprints for friend suggestions, matching users to job descriptions by semantic skill overlap, and generating hyper-personalized roadmaps that understand not just what you know but how your knowledge cluster relates to your goal.",
};

const SOCIAL = {
  title: "Social & Chat System",
  subtitle: "Intentional connections, real conversations — friends only, no followers",
  philosophy: "The social layer of .ahead is deliberately minimal and private. There is no public feed, no follower count, no likes. The only social unit is friendship — mutual, intentional, and private. This keeps the platform focused on growth, not performance.",
  friend_system: {
    title: "Friend System",
    features: [
      { name: "User Search", desc: "Search by name, college, field, or skill. Results show: name, college, field, Ahead Score, and top 3 skills. No full profile visible until friends." },
      { name: "Friend Request", desc: "Send a friend request with an optional short note. Recipient sees: your name, college, Ahead Score, and the note. They can accept or decline." },
      { name: "Friend List", desc: "Friends list shows each friend's: name, avatar, Ahead Score (live), current rank in their college, and their declared ultimate goal." },
      { name: "Mutual Skill View", desc: "Once friends, you can see each other's full verified skill profile. You can compare your Ahead Score breakdowns side-by-side." },
      { name: "Milestone Sharing", desc: "When a friend completes a roadmap phase or verifies a new skill, a notification appears in your friends panel: 'Arjun verified System Design — Advanced ◈'. Not a feed post — a private notification." },
      { name: "Friend Limit", desc: "Free: up to 20 friends. Pro: up to 200 friends. This is intentional — quality over quantity." },
    ],
  },
  chat_system: {
    title: "Real-Time Chat",
    architecture: "WebSocket-based (Socket.io). Each friend pair has a persistent conversation. Messages are stored in PostgreSQL and loaded on chat open. New messages are pushed via WebSocket — no polling.",
    features: [
      { name: "1-on-1 Chat", desc: "Private conversation between two friends. Real-time delivery via WebSocket. Typing indicators, read receipts (single tick sent, double tick read)." },
      { name: "Message Persistence", desc: "Chat history is fully persisted in PostgreSQL. Messages load on chat open. Infinite scroll upward to load history." },
      { name: "Resource Sharing", desc: "Inside chat, you can share a resource card directly from your library (YouTube link, book, article). It renders as a rich preview card in the conversation, not a raw link." },
      { name: "Roadmap Milestone Share", desc: "Tap any completed roadmap milestone and share it to a friend's chat. It renders as a milestone card: skill name, phase, date completed." },
      { name: "Skill Challenge", desc: "Send a friend a quiz challenge on any skill. They receive a notification, take the same AI-generated quiz, and results are shared back in chat: who scored higher, breakdown per question." },
      { name: "Notifications", desc: "Push notification (in-app + browser) on new message. Badge count on chat icon in nav. Notification clears on chat open." },
    ],
    ui_layout: [
      "Chat panel slides in from the right as a fixed overlay (not a new page).",
      "Friends list on the left column of the chat panel: sorted by last message time, then online status.",
      "Online indicator: a small white dot next to the friend's avatar if they are currently active.",
      "Chat input at the bottom: plain text with a '+' button to attach resource cards or milestone shares.",
      "Messages: right-aligned (you), left-aligned (them). Clean bubbles with timestamps on hover.",
      "On mobile: chat takes full screen when open.",
    ],
  },
  group_chat: {
    title: "Group Chat",
    desc: "Pro feature. Create a group of up to 10 friends. Groups are named by the creator and are invite-only. No public groups. Use case: study groups, project teams, competitive programming pods.",
    features: [
      "Group name + optional short description set at creation.",
      "Creator can add/remove members (only from their friends list).",
      "All group members can see each other's Ahead Score within the group header.",
      "Leaderboard within the group: mini-leaderboard sorted by Ahead Score — competitive study group energy.",
      "Resource sharing and milestone sharing work the same as 1-on-1 chat.",
      "Group skill challenges: creator sends a challenge to all members simultaneously. Results appear in the group when all members complete.",
    ],
  },
  privacy: [
    "Your chat history is only visible to you and the friend you chatted with. Not to Anthropic, not to the platform admins.",
    "Your friend list is private — other users cannot see who your friends are.",
    "Your Ahead Score is public on the leaderboard by default, but you can set it to college-only or friends-only in settings.",
    "You can block a user — they are removed from your friends list and cannot re-request.",
    "You can deactivate your account — all your data is retained but your profile is hidden from search and leaderboards.",
  ],
  notifications: [
    { trigger: "Friend request received", channel: "In-app + push" },
    { trigger: "Friend request accepted", channel: "In-app" },
    { trigger: "New message from friend", channel: "In-app + push" },
    { trigger: "Friend verifies a new skill", channel: "In-app (friends panel)" },
    { trigger: "Friend completes a roadmap phase", channel: "In-app (friends panel)" },
    { trigger: "Skill challenge received", channel: "In-app + push" },
    { trigger: "Skill challenge result ready", channel: "In-app + push" },
    { trigger: "Your rank changes significantly (±5)", channel: "In-app" },
    { trigger: "Daily goal reminder (if not checked in)", channel: "Push (opt-in)" },
    { trigger: "Weekly Ahead Score summary", channel: "Email (Pro)" },
  ],
};

const FLOWS = {
  title: "Key User Flows",
  subtitle: "The journeys that define the .ahead experience",
  flows: [
    {
      name: "Skill Onboarding Flow",
      steps: [
        { n: "01", title: "Pick Your Field", desc: "CSE / AI & ML / IT / Other. This pre-filters domain recommendations." },
        { n: "02", title: "Declare Your Ultimate Goal", desc: "Choose from suggestions or type custom: 'Get into FAANG', 'Build an AI startup', 'MS in USA', 'Crack GATE', etc." },
        { n: "03", title: "Browse Skill Domains", desc: "All domains shown. User selects domains they have any skills in." },
        { n: "04", title: "Expand Skills Within Domain", desc: "Select which skills apply within the domain (e.g. select CSS, React, Node within Web Dev)." },
        { n: "05", title: "Declare Sub-Skills", desc: "For each selected skill, an inline drawer shows all sub-skills. User picks Aware / Familiar / Proficient per sub-skill." },
        { n: "06", title: "Ahead Score Preview", desc: "Live score preview updates as sub-skills are declared. Shows estimated initial rank." },
        { n: "07", title: "Verification Prompts", desc: "Platform suggests 2–3 high-value verifications to do immediately to boost score." },
        { n: "08", title: "Dashboard Unlocked", desc: "Initial roadmap is generated. Score is live. Welcome to .ahead." },
      ],
    },
    {
      name: "Verification Flow",
      steps: [
        { n: "01", title: "Verification Entry Point", desc: "User sees 'Verify' button next to any declared sub-skill. Or prompted via daily goal." },
        { n: "02", title: "Choose Method", desc: "Modal shows 5 methods with their multiplier clearly displayed. User picks one." },
        { n: "03", title: "Submit Evidence", desc: "Quiz: start quiz. GitHub/Vercel/Project: paste URL. Cert: upload file. Add optional description." },
        { n: "04", title: "Processing", desc: "Quiz: real-time. Links/certs: async (spinner shown, push notification on complete, max 5 min)." },
        { n: "05", title: "Result", desc: "Verification result returned. Sub-skill level confirmed or adjusted. Multiplier applied." },
        { n: "06", title: "Score Update", desc: "Ahead Score recalculates. Rank updates on leaderboard in real-time via WebSocket." },
      ],
    },
    {
      name: "Daily Usage Flow",
      steps: [
        { n: "01", title: "Dashboard", desc: "User sees: Ahead Score, today's rank, daily goal card, and a streak indicator." },
        { n: "02", title: "Daily Goal", desc: "AI-generated micro-task for today (tied to roadmap phase). User marks complete." },
        { n: "03", title: "Resource", desc: "Recommended resource for today's goal (YouTube / article / problem). Opened, consumed, marked done." },
        { n: "04", title: "Leaderboard Check", desc: "User checks their college rank. Views top performers. Motivated by proximity to next rank." },
        { n: "05", title: "Social", desc: "Optional: message a friend, see a friend's roadmap progress milestone." },
        { n: "06", title: "Sub-skill Update", desc: "Optional: if user learned something new, they update sub-skills → triggers verification prompt → score goes up." },
      ],
    },
  ],
};

// ─── RENDERER ────────────────────────────────────────────────────────────────

export default function AheadB2C() {
  const [active, setActive] = useState("score");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [expandedMethod, setExpandedMethod] = useState(null);

  const renderScoreEngine = () => (
    <div style={{ animation: "fadeUp 0.35s ease-out" }}>
      <Header t={SCORE_ENGINE.title} s={SCORE_ENGINE.subtitle} />
      <div style={{ color: "#888", fontSize: "0.87rem", lineHeight: 1.8, maxWidth: "640px", marginBottom: "2.5rem", padding: "1.25rem", border: "1px solid #1a1a1a", borderLeft: "2px solid #fff" }}>
        {SCORE_ENGINE.concept}
      </div>
      {SCORE_ENGINE.pillars.map((p, i) => (
        <div key={i} style={{ borderBottom: "1px solid #141414", padding: "1.75rem 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "start", marginBottom: "0.75rem" }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{p.name}</div>
            <div style={{ fontFamily: "monospace", fontSize: "1rem", color: "#fff", fontWeight: 700 }}>{p.weight}</div>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#444", marginBottom: "0.75rem", background: "#111", padding: "0.4rem 0.75rem", display: "inline-block" }}>{p.formula}</div>
          <div style={{ color: "#777", fontSize: "0.83rem", lineHeight: 1.7, marginBottom: "1rem", maxWidth: "560px" }}>{p.desc}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
            {p.breakdown.map((b, j) => (
              <div key={j} style={{ display: "flex", justifyContent: "space-between", background: "#0f0f0f", border: "1px solid #1a1a1a", padding: "0.4rem 0.75rem" }}>
                <span style={{ color: "#666", fontSize: "0.78rem" }}>{b.label}</span>
                <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#fff" }}>{b.multiplier}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ marginTop: "2rem" }}>
        <Label t="Score Growth Rules" />
        {SCORE_ENGINE.growth.map((g, i) => (
          <Row key={i} n={`0${i + 1}`} t={g} />
        ))}
      </div>
    </div>
  );

  const renderTaxonomy = () => (
    <div style={{ animation: "fadeUp 0.35s ease-out" }}>
      <Header t={TAXONOMY.title} s={TAXONOMY.subtitle} />
      <div style={{ color: "#888", fontSize: "0.83rem", lineHeight: 1.7, marginBottom: "2rem", maxWidth: "580px", borderLeft: "2px solid #fff", paddingLeft: "1rem" }}>{TAXONOMY.note}</div>
      {TAXONOMY.domains.map((d, i) => (
        <div key={i} style={{ borderBottom: "1px solid #141414" }}>
          <button onClick={() => setExpandedDomain(expandedDomain === i ? null : i)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "1.25rem 0", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#333" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontWeight: 700, fontSize: "0.92rem", color: d.color }}>{d.domain}</span>
              <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#444" }}>{d.skills.length} skills</span>
            </div>
            <span style={{ color: "#333", fontSize: "0.8rem" }}>{expandedDomain === i ? "−" : "+"}</span>
          </button>
          {expandedDomain === i && (
            <div style={{ paddingBottom: "1.25rem" }}>
              {d.skills.map((s, j) => (
                <div key={j} style={{ display: "grid", gridTemplateColumns: "220px 60px 1fr", gap: "1rem", padding: "0.65rem 0", borderTop: "1px solid #111", alignItems: "start" }}>
                  <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#ccc" }}>{s.name}</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#555" }}>{s.subs} subs</span>
                  <span style={{ fontSize: "0.76rem", color: "#555", lineHeight: 1.6 }}>{s.example}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderSubSkills = () => (
    <div style={{ animation: "fadeUp 0.35s ease-out" }}>
      <Header t={SUBSKILLS.title} s={SUBSKILLS.subtitle} />
      <div style={{ color: "#888", fontSize: "0.83rem", lineHeight: 1.7, marginBottom: "2rem", maxWidth: "600px", borderLeft: "2px solid #fff", paddingLeft: "1rem" }}>{SUBSKILLS.concept}</div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Label t="Proficiency Levels" />
        <div className="resp-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: "#1a1a1a", border: "1px solid #1a1a1a" }}>
          {SUBSKILLS.levels.map((l, i) => (
            <div key={i} style={{ background: "#0a0a0a", padding: "1.5rem" }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: l.color, marginBottom: "0.5rem" }}>{l.level}</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#555", marginBottom: "0.75rem" }}>+{l.points} pts / sub-skill</div>
              <div style={{ color: "#666", fontSize: "0.79rem", lineHeight: 1.6 }}>{l.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: "2.5rem" }}>
        <Label t={`Live Example: ${SUBSKILLS.example.skill} Sub-Skills`} />
        <div style={{ border: "1px solid #1a1a1a" }}>
          <div style={{ borderBottom: "1px solid #1a1a1a", padding: "0.6rem 1.25rem", display: "grid", gridTemplateColumns: "1fr auto", background: "#0d0d0d" }}>
            <span style={{ fontSize: "0.7rem", color: "#444", fontFamily: "monospace" }}>SUB-SKILL</span>
            <span style={{ fontSize: "0.7rem", color: "#444", fontFamily: "monospace" }}>LEVEL DECLARED</span>
          </div>
          {SUBSKILLS.example.subs.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "0.65rem 1.25rem", borderBottom: i < SUBSKILLS.example.subs.length - 1 ? "1px solid #111" : "none", alignItems: "center" }}>
              <span style={{ fontSize: "0.83rem", color: "#bbb" }}>{s.name}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: s.chosen === "Proficient" ? "#fff" : s.chosen === "Familiar" ? "#888" : "#444" }}>{s.chosen}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label t="UX Behaviour" />
        {SUBSKILLS.ux.map((u, i) => <Row key={i} n={`0${i + 1}`} t={u} />)}
      </div>
    </div>
  );

  const renderVerification = () => (
    <div style={{ animation: "fadeUp 0.35s ease-out" }}>
      <Header t={VERIFICATION.title} s={VERIFICATION.subtitle} />
      <div style={{ color: "#888", fontSize: "0.83rem", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: "600px", borderLeft: "2px solid #fff", paddingLeft: "1rem" }}>{VERIFICATION.concept}</div>
      <div style={{ marginBottom: "2.5rem" }}>
        {VERIFICATION.methods.map((m, i) => (
          <div key={i} style={{ borderBottom: "1px solid #141414" }}>
            <button onClick={() => setExpandedMethod(expandedMethod === i ? null : i)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "1.25rem 0", display: "grid", gridTemplateColumns: "32px 1fr 80px 160px auto", gap: "1rem", alignItems: "center", color: "#fff", textAlign: "left" }}>
              <span style={{ color: "#444", fontSize: "0.9rem" }}>{m.icon}</span>
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{m.method}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#fff" }}>{m.multiplier}</span>
              <span style={{ fontSize: "0.75rem", color: "#555" }}>{m.best_for}</span>
              <span style={{ color: "#333" }}>{expandedMethod === i ? "−" : "+"}</span>
            </button>
            {expandedMethod === i && (
              <div style={{ paddingBottom: "1.5rem" }}>
                <div style={{ color: "#777", fontSize: "0.83rem", lineHeight: 1.7, marginBottom: "1rem", maxWidth: "560px" }}>{m.desc}</div>
                {m.detail.map((d, j) => (
                  <div key={j} style={{ display: "flex", gap: "0.75rem", padding: "0.4rem 0", borderTop: j === 0 ? "1px solid #111" : "none" }}>
                    <span style={{ color: "#2a2a2a", fontSize: "0.65rem", flexShrink: 0, marginTop: "0.15rem" }}>◆</span>
                    <span style={{ color: "#666", fontSize: "0.8rem", lineHeight: 1.6 }}>{d}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <Label t="Verification Flow" />
      {VERIFICATION.flow.map((f, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid #111", alignItems: "start" }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#333" }}>{f.step}</span>
          <span style={{ color: "#aaa", fontSize: "0.83rem", lineHeight: 1.6 }}>{f.action}</span>
        </div>
      ))}
    </div>
  );

  const renderAI = () => (
    <div style={{ animation: "fadeUp 0.35s ease-out" }}>
      <Header t={AI_ENGINE.title} s={AI_ENGINE.subtitle} />
      {AI_ENGINE.systems.map((s, i) => (
        <div key={i} style={{ borderBottom: "1px solid #141414", padding: "2rem 0" }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>{s.name}</div>
          <div style={{ color: "#777", fontSize: "0.83rem", lineHeight: 1.7, marginBottom: "1.25rem", maxWidth: "560px" }}>{s.desc}</div>
          {s.inputs && (
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", fontFamily: "monospace" }}>Inputs</span>
              {s.inputs.map((x, j) => <Row key={j} n="—" t={x} small />)}
            </div>
          )}
          {s.outputs && (
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", fontFamily: "monospace" }}>Outputs</span>
              {s.outputs.map((x, j) => <Row key={j} n="—" t={x} small />)}
            </div>
          )}
          {s.model && <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#444", background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "0.6rem 0.9rem", marginTop: "0.75rem" }}>{s.model}</div>}
          {s.resource_types && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
              {s.resource_types.map((r, j) => (
                <div key={j} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "0.6rem 0.9rem" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#ccc", marginBottom: "0.2rem" }}>{r.type}</div>
                  <div style={{ fontSize: "0.73rem", color: "#555" }}>{r.example}</div>
                </div>
              ))}
            </div>
          )}
          {s.ranking && <div style={{ color: "#555", fontSize: "0.78rem", lineHeight: 1.6, borderTop: "1px solid #111", paddingTop: "0.75rem" }}>{s.ranking}</div>}
          {s.question_types && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {s.question_types.map((q, j) => (
                <div key={j} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "1rem", padding: "0.4rem 0", borderBottom: "1px solid #111" }}>
                  <span style={{ fontSize: "0.78rem", color: "#ccc" }}>{q.type}</span>
                  <span style={{ fontSize: "0.76rem", color: "#555" }}>{q.use}</span>
                </div>
              ))}
            </div>
          )}
          {s.calibration && <div style={{ color: "#555", fontSize: "0.78rem", lineHeight: 1.6, marginTop: "0.75rem" }}>{s.calibration}</div>}
          {s.analysis_points && s.analysis_points.map((a, j) => <Row key={j} n="—" t={a} small />)}
          {s.data_used && s.data_used.map((d, j) => <Row key={j} n="—" t={d} small />)}
        </div>
      ))}
    </div>
  );

  const renderB2C = () => (
    <div style={{ animation: "fadeUp 0.35s ease-out" }}>
      <Header t={B2C.title} s={B2C.subtitle} />
      <div className="resp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "#1a1a1a", border: "1px solid #1a1a1a", marginBottom: "2.5rem" }}>
        {B2C.tiers.map((t, i) => (
          <div key={i} style={{ background: "#0a0a0a", padding: "1.75rem", borderBottom: i < 2 ? "1px solid #1a1a1a" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ fontWeight: 800, fontSize: "1rem", color: t.color }}>{t.name}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#fff" }}>{t.price}</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#444", marginBottom: "1.25rem" }}>{t.target}</div>
            {t.features.map((f, j) => (
              <div key={j} style={{ display: "flex", gap: "0.6rem", marginBottom: "0.3rem" }}>
                <span style={{ color: "#2a5a2a", fontSize: "0.65rem", flexShrink: 0, marginTop: "0.15rem" }}>✓</span>
                <span style={{ color: "#888", fontSize: "0.78rem", lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
            {t.limits.length > 0 && (
              <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #141414" }}>
                {t.limits.map((l, j) => (
                  <div key={j} style={{ display: "flex", gap: "0.6rem", marginBottom: "0.25rem" }}>
                    <span style={{ color: "#3a1a1a", fontSize: "0.65rem", flexShrink: 0, marginTop: "0.15rem" }}>✗</span>
                    <span style={{ color: "#444", fontSize: "0.76rem" }}>{l}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <Label t="Revenue Streams" />
      {B2C.monetization.map((m, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "1.5rem", padding: "0.75rem 0", borderBottom: "1px solid #111" }}>
          <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#ccc" }}>{m.stream}</span>
          <span style={{ color: "#666", fontSize: "0.8rem", lineHeight: 1.6 }}>{m.desc}</span>
        </div>
      ))}
      <div style={{ marginTop: "2.5rem" }}>
        <Label t="Growth Timeline" />
        {B2C.growth.map((g, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "1.5rem", padding: "0.75rem 0", borderBottom: "1px solid #111" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#555" }}>{g.stage}</span>
            <span style={{ color: "#888", fontSize: "0.8rem", lineHeight: 1.6 }}>{g.action}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSchema = () => (
    <div style={{ animation: "fadeUp 0.35s ease-out" }}>
      <Header t={SCHEMA.title} s={SCHEMA.subtitle} />
      {SCHEMA.models.map((m, i) => (
        <div key={i} style={{ marginBottom: "1.5rem", border: "1px solid #1a1a1a" }}>
          <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d", display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#444" }}>model</span>
            <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.9rem" }}>{m.name}</span>
            <span style={{ fontSize: "0.72rem", color: "#555" }}>{m.desc}</span>
          </div>
          {m.fields.map((f, j) => (
            <div key={j} className="resp-row" style={{ display: "grid", gridTemplateColumns: "160px 160px 1fr", padding: "0.5rem 1.25rem", borderBottom: j < m.fields.length - 1 ? "1px solid #111" : "none" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.79rem", color: "#fff" }}>{f.f}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.77rem", color: "#555" }}>{f.t}</span>
              <span style={{ fontSize: "0.76rem", color: "#3a3a3a" }}>{f.n}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderFlows = () => (
    <div style={{ animation: "fadeUp 0.35s ease-out" }}>
      <Header t={FLOWS.title} s={FLOWS.subtitle} />
      {FLOWS.flows.map((fl, i) => (
        <div key={i} style={{ marginBottom: "2.5rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #1a1a1a" }}>{fl.name}</div>
          {fl.steps.map((s, j) => (
            <div key={j} style={{ display: "grid", gridTemplateColumns: "40px 160px 1fr", gap: "1rem", padding: "0.9rem 0", borderBottom: "1px solid #111", alignItems: "start" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#333" }}>{s.n}</span>
              <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#ccc" }}>{s.title}</span>
              <span style={{ color: "#666", fontSize: "0.81rem", lineHeight: 1.65 }}>{s.desc}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );


  const renderSkillDNA = () => (
    <div style={{ animation: "fadeUp 0.35s ease-out" }}>
      <Header t={SKILL_DNA.title} s={SKILL_DNA.subtitle} />
      <div style={{ color: "#888", fontSize: "0.85rem", lineHeight: 1.8, maxWidth: "640px", marginBottom: "2.5rem", padding: "1.25rem", border: "1px solid #1a1a1a", borderLeft: "2px solid #e8d5a3" }}>
        {SKILL_DNA.concept}
      </div>

      <Label t="How It Works" />
      {SKILL_DNA.how_it_works.map((s, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 180px 1fr", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid #111", alignItems: "start" }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#444" }}>{s.step}</span>
          <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#e8d5a3" }}>{s.title}</span>
          <span style={{ color: "#777", fontSize: "0.81rem", lineHeight: 1.7 }}>{s.desc}</span>
        </div>
      ))}

      <div style={{ marginTop: "2.5rem", marginBottom: "2.5rem" }}>
        <Label t="Live Examples — Custom Skills Typed by Users" />
        {SKILL_DNA.examples.map((ex, i) => (
          <div key={i} style={{ border: "1px solid #1a1a1a", marginBottom: "1rem" }}>
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#444", marginRight: "0.75rem" }}>◬ typed</span>
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#e8d5a3" }}>"{ex.typed}"</span>
              </div>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "#555" }}>{ex.mapped_to}</span>
                <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: ex.demand === "Very High" ? "#fff" : ex.demand === "High" ? "#aaa" : "#666" }}>demand: {ex.demand}</span>
              </div>
            </div>
            <div style={{ padding: "0.75rem 1.25rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {ex.generated_subs.map((sub, j) => (
                <span key={j} style={{ background: "#141414", border: "1px solid #222", padding: "0.25rem 0.65rem", fontSize: "0.75rem", color: "#888", fontFamily: "monospace" }}>{sub}</span>
              ))}
              <span style={{ fontSize: "0.7rem", color: "#333", alignSelf: "center", marginLeft: "0.25rem" }}>— AI-generated sub-skills</span>
            </div>
          </div>
        ))}
      </div>

      <Label t="Scoring Logic for Custom Skills" />
      {SKILL_DNA.scoring_logic.map((s, i) => <Row key={i} n={`0${i+1}`} t={s} />)}

      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #1a1a1a", borderLeft: "2px solid #e8d5a3" }}>
        <div style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", fontFamily: "monospace", marginBottom: "0.6rem" }}>Skill DNA Profile</div>
        <div style={{ color: "#777", fontSize: "0.83rem", lineHeight: 1.8 }}>{SKILL_DNA.dna_profile}</div>
      </div>
    </div>
  );

  const renderSocial = () => (
    <div style={{ animation: "fadeUp 0.35s ease-out" }}>
      <Header t={SOCIAL.title} s={SOCIAL.subtitle} />
      <div style={{ color: "#888", fontSize: "0.85rem", lineHeight: 1.8, maxWidth: "620px", marginBottom: "2.5rem", padding: "1.25rem", border: "1px solid #1a1a1a", borderLeft: "2px solid #fff" }}>
        {SOCIAL.philosophy}
      </div>

      {/* Friend System */}
      <div style={{ marginBottom: "2.5rem" }}>
        <Label t={SOCIAL.friend_system.title} />
        {SOCIAL.friend_system.features.map((f, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "1.5rem", padding: "0.85rem 0", borderBottom: "1px solid #111", alignItems: "start" }}>
            <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#ccc" }}>{f.name}</span>
            <span style={{ color: "#666", fontSize: "0.81rem", lineHeight: 1.65 }}>{f.desc}</span>
          </div>
        ))}
      </div>

      {/* Chat System */}
      <div style={{ marginBottom: "2.5rem" }}>
        <Label t={SOCIAL.chat_system.title} />
        <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#444", background: "#0d0d0d", border: "1px solid #1a1a1a", padding: "0.6rem 0.9rem", marginBottom: "1.25rem" }}>
          Architecture: {SOCIAL.chat_system.architecture}
        </div>
        {SOCIAL.chat_system.features.map((f, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "1.5rem", padding: "0.85rem 0", borderBottom: "1px solid #111", alignItems: "start" }}>
            <span style={{ fontSize: "0.83rem", fontWeight: 600, color: "#ccc" }}>{f.name}</span>
            <span style={{ color: "#666", fontSize: "0.81rem", lineHeight: 1.65 }}>{f.desc}</span>
          </div>
        ))}
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#333", fontFamily: "monospace", marginBottom: "0.75rem" }}>Chat UI Layout</div>
          {SOCIAL.chat_system.ui_layout.map((u, i) => <Row key={i} n="—" t={u} small />)}
        </div>
      </div>

      {/* Group Chat */}
      <div style={{ marginBottom: "2.5rem", border: "1px solid #1a1a1a", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{SOCIAL.group_chat.title}</div>
          <span style={{ fontSize: "0.68rem", border: "1px solid #e8d5a3", color: "#e8d5a3", padding: "0.15rem 0.5rem", fontFamily: "monospace" }}>Pro</span>
        </div>
        <div style={{ color: "#777", fontSize: "0.81rem", lineHeight: 1.7, marginBottom: "1rem" }}>{SOCIAL.group_chat.desc}</div>
        {SOCIAL.group_chat.features.map((f, i) => <Row key={i} n="—" t={f} small />)}
      </div>

      {/* Privacy */}
      <div style={{ marginBottom: "2.5rem" }}>
        <Label t="Privacy Model" />
        {SOCIAL.privacy.map((p, i) => <Row key={i} n={`0${i+1}`} t={p} />)}
      </div>

      {/* Notifications */}
      <div>
        <Label t="Notification System" />
        <div style={{ border: "1px solid #1a1a1a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", padding: "0.5rem 1.25rem", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d" }}>
            <span style={{ fontSize: "0.65rem", color: "#444", fontFamily: "monospace" }}>TRIGGER</span>
            <span style={{ fontSize: "0.65rem", color: "#444", fontFamily: "monospace" }}>CHANNEL</span>
          </div>
          {SOCIAL.notifications.map((n, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 140px", padding: "0.55rem 1.25rem", borderBottom: i < SOCIAL.notifications.length - 1 ? "1px solid #111" : "none", alignItems: "center" }}>
              <span style={{ color: "#aaa", fontSize: "0.8rem" }}>{n.trigger}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#555" }}>{n.channel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderers = { score: renderScoreEngine, taxonomy: renderTaxonomy, subskills: renderSubSkills, skilldna: renderSkillDNA, verification: renderVerification, ai: renderAI, social: renderSocial, b2c: renderB2C, schema: renderSchema, flows: renderFlows };

  const activeNav = NAV.find(n => n.id === active);

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080808;
          --bg2: #0d0d0d;
          --border: #1a1a1a;
          --border-faint: #111;
          --text: #ffffff;
          --text-muted: #aaa;
          --text-dim: #666;
          --text-ghost: #444;
          --accent: #e8d5a3;
          --sidebar-w: 220px;
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
          --font-mono: 'JetBrains Mono', 'Fira Mono', monospace;
        }

        html, body, #root { height: 100%; }

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── APP ROOT ── */
        .app-root {
          background: var(--bg);
          min-height: 100vh;
          color: var(--text);
          font-family: var(--font-body);
          display: flex;
          flex-direction: column;
        }

        /* ── TOP BAR (mobile) ── */
        .topbar {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          height: 52px;
          border-bottom: 1px solid var(--border-faint);
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--bg);
          flex-shrink: 0;
        }
        .topbar-logo {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.05rem;
          letter-spacing: -0.03em;
        }
        .topbar-section {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .hamburger {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text);
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 4px;
        }
        .hamburger span {
          display: block;
          width: 20px;
          height: 1.5px;
          background: currentColor;
          transition: all 0.2s;
        }

        /* ── BODY (sidebar + content) ── */
        .app-body {
          display: flex;
          flex: 1;
          min-height: 0;
          position: relative;
        }

        /* ── SIDEBAR (desktop) ── */
        .sidebar {
          width: var(--sidebar-w);
          flex-shrink: 0;
          border-right: 1px solid var(--border-faint);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          background: var(--bg);
          z-index: 50;
        }
        .sidebar-logo {
          padding: 1.75rem 1.5rem 1.25rem;
          border-bottom: 1px solid var(--border-faint);
          flex-shrink: 0;
        }
        .sidebar-logo-name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.2rem;
          letter-spacing: -0.03em;
        }
        .sidebar-logo-sub {
          font-size: 0.58rem;
          color: var(--text-ghost);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 0.2rem;
          font-family: var(--font-mono);
        }
        .sidebar-nav {
          flex: 1;
          padding: 0.5rem 0;
          overflow-y: auto;
        }
        .nav-btn {
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.65rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          text-align: left;
          transition: all 0.12s ease;
          border-left: 2px solid transparent;
        }
        .nav-btn.active {
          color: #fff;
          border-left-color: #fff;
          background: rgba(255,255,255,0.03);
        }
        .nav-btn:not(.active) {
          color: var(--text-muted);
        }
        .nav-btn:hover:not(.active) {
          color: #ddd;
          background: rgba(255,255,255,0.02);
        }
        .nav-icon { font-size: 0.75rem; flex-shrink: 0; }
        .nav-label { font-size: 0.8rem; }
        .nav-btn.active .nav-label { font-weight: 600; }
        .sidebar-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid var(--border-faint);
          flex-shrink: 0;
        }
        .sidebar-footer-stats {
          font-size: 0.6rem;
          color: #444;
          font-family: var(--font-mono);
          line-height: 2;
        }

        /* ── MOBILE DRAWER ── */
        .drawer-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 200;
          animation: fadeIn 0.2s ease;
        }
        .drawer-overlay.open { display: block; }
        .drawer {
          position: fixed;
          top: 0;
          left: 0;
          width: 260px;
          height: 100vh;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          z-index: 210;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.22s ease;
          overflow-y: auto;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .drawer-header {
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid var(--border-faint);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .drawer-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 1.2rem;
          line-height: 1;
          padding: 2px 6px;
        }
        .drawer-nav { padding: 0.5rem 0; flex: 1; }
        .drawer-nav-btn {
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.8rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: 0.88rem;
          text-align: left;
          border-left: 2px solid transparent;
          transition: all 0.12s;
        }
        .drawer-nav-btn.active {
          color: #fff;
          border-left-color: #fff;
          background: rgba(255,255,255,0.04);
          font-weight: 600;
        }
        .drawer-nav-btn:hover:not(.active) { color: #ddd; background: rgba(255,255,255,0.02); }

        /* ── BOTTOM TAB BAR (mobile) ── */
        .bottom-tabs {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: var(--bg);
          border-top: 1px solid var(--border-faint);
          z-index: 100;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .bottom-tabs-inner {
          display: flex;
          align-items: stretch;
          height: 100%;
          min-width: max-content;
          padding: 0 0.5rem;
        }
        .tab-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: var(--text-ghost);
          min-width: 56px;
          transition: color 0.12s;
          border-top: 2px solid transparent;
        }
        .tab-btn.active { color: #fff; border-top-color: #fff; }
        .tab-icon { font-size: 0.85rem; }
        .tab-label { font-size: 0.55rem; font-family: var(--font-mono); white-space: nowrap; }

        /* ── CONTENT AREA ── */
        .content-area {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          height: 100vh;
        }
        .content-inner {
          max-width: 860px;
          margin: 0 auto;
          padding: 3rem 3.5rem;
          animation: fadeUp 0.35s ease-out;
        }

        /* ── RESPONSIVE BREAKPOINTS ── */

        /* Tablet: hide sidebar, show topbar + drawer */
        @media (max-width: 900px) {
          .sidebar { display: none; }
          .topbar { display: flex; }
          .content-inner { padding: 1.75rem 1.5rem 5rem; }
          .content-area { height: calc(100vh - 52px); }
          .bottom-tabs { display: flex; }
          .app-body { flex-direction: column; }
        }

        /* Mobile: tighter padding */
        @media (max-width: 600px) {
          .content-inner { padding: 1.25rem 1rem 5rem; }
          .topbar { padding: 0 1rem; }
        }

        /* Wide: let content breathe more */
        @media (min-width: 1400px) {
          :root { --sidebar-w: 240px; }
          .content-inner { max-width: 1000px; padding: 3.5rem 4rem; }
        }

        /* ── RESPONSIVE GRID OVERRIDES ── */
        @media (max-width: 700px) {
          .resp-grid-2 { grid-template-columns: 1fr !important; }
          .resp-grid-3 { grid-template-columns: 1fr !important; }
          .resp-row    { grid-template-columns: 1fr !important; }
          .resp-row > *:first-child { border-bottom: 1px solid var(--border-faint); padding-bottom: 0.5rem; margin-bottom: 0.25rem; }
        }

        /* ── UTIL CLASSES ── */
        .mono { font-family: var(--font-mono); }
        .text-muted { color: var(--text-muted); }
        .text-dim { color: var(--text-dim); }
        .text-ghost { color: var(--text-ghost); }
        .text-accent { color: var(--accent); }
      `}</style>

      {/* ── MOBILE TOPBAR ── */}
      <div className="topbar">
        <div className="topbar-logo">.ahead</div>
        <div className="topbar-section">{activeNav?.icon} {activeNav?.label}</div>
        <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      <div className={`drawer-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />
      {menuOpen && (
        <div className="drawer">
          <div className="drawer-header">
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.03em" }}>.ahead</div>
              <div style={{ fontSize: "0.58rem", color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-mono)", marginTop: "2px" }}>B2C Deep-Dive</div>
            </div>
            <button className="drawer-close" onClick={() => setMenuOpen(false)}>✕</button>
          </div>
          <div className="drawer-nav">
            {NAV.map(n => (
              <button key={n.id} className={`drawer-nav-btn ${active === n.id ? "active" : ""}`}
                onClick={() => { setActive(n.id); setMenuOpen(false); }}>
                <span style={{ fontSize: "0.8rem" }}>{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── APP BODY ── */}
      <div className="app-body">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-name">.ahead</div>
            <div className="sidebar-logo-sub">B2C Deep-Dive</div>
          </div>
          <nav className="sidebar-nav">
            {NAV.map(n => (
              <button key={n.id} className={`nav-btn ${active === n.id ? "active" : ""}`}
                onClick={() => setActive(n.id)}>
                <span className="nav-icon">{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-footer-stats">
              8 domains · 100+ skills<br />
              1000+ sub-skills · 5 verify<br />
              Skill DNA ◬ · Friends + Chat
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="content-area">
          <div className="content-inner" key={active}>
            {renderers[active]?.()}
          </div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM TABS ── */}
      <div className="bottom-tabs">
        <div className="bottom-tabs-inner">
          {NAV.map(n => (
            <button key={n.id} className={`tab-btn ${active === n.id ? "active" : ""}`}
              onClick={() => setActive(n.id)}>
              <span className="tab-icon">{n.icon}</span>
              <span className="tab-label">{n.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function Header({ t, s }) {
  return (
    <div style={{ marginBottom: "2.25rem" }}>
      <h2 style={{ fontSize: "clamp(1.3rem, 3vw, 1.75rem)", fontWeight: 700, letterSpacing: "-0.02em", fontFamily: "var(--font-display, Syne, sans-serif)", marginBottom: "0.4rem", lineHeight: 1.15 }}>{t}</h2>
      <p style={{ color: "var(--text-dim, #666)", fontSize: "0.84rem", lineHeight: 1.5 }}>{s}</p>
    </div>
  );
}
function Label({ t }) {
  return (
    <div style={{ fontSize: "0.62rem", letterSpacing: "0.16em", color: "var(--text-ghost, #444)", textTransform: "uppercase", marginBottom: "1rem", marginTop: "0.25rem", fontFamily: "var(--font-mono, monospace)" }}>
      {t}
    </div>
  );
}
function Row({ n, t, small }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", padding: small ? "0.35rem 0" : "0.65rem 0", borderBottom: "1px solid #0f0f0f", alignItems: "flex-start" }}>
      <span style={{ fontFamily: "var(--font-mono, monospace)", color: "#333", fontSize: small ? "0.68rem" : "0.72rem", flexShrink: 0, paddingTop: "0.05rem" }}>{n}</span>
      <span style={{ color: "var(--text-dim, #666)", fontSize: small ? "0.79rem" : "0.83rem", lineHeight: 1.65 }}>{t}</span>
    </div>
  );
}
