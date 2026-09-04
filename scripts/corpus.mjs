export const designCorpus = [
  // ==========================================
  // DAILYS DESIGN LANGUAGE
  // ==========================================
  {
    id: "design.visual-restraint",
    type: "design_rule",
    title: "Dailys Visual Restraint",
    content: "Dailys relies on a near-black foundation (var(--background)) with warm off-white typography (var(--foreground)). Restrained gold accents (var(--accent)) should only be used for active states or primary buttons. Never flood the screen with color. This ensures a calm, focused environment that doesn't exhaust the user.",
    metadata: { style: ["minimal", "dark"] }
  },
  {
    id: "design.typography-hierarchy",
    type: "design_rule",
    title: "Dailys Typography Hierarchy",
    content: "Typography is built on two fonts: a clean sans-serif for reading (Inter/system) and a mono-data font (Geist Mono/JetBrains) for numbers, metadata, and labels. Hierarchy relies on size and muted colors (var(--muted)), not heavy font weights. Avoid using bold text unless it's a primary heading.",
    metadata: { style: ["typography"] }
  },
  {
    id: "design.borders-panels",
    type: "design_rule",
    title: "Dailys Borders & Panels",
    content: "Use var(--card) for panel backgrounds and var(--card-border) for thin, subtle borders. Avoid heavy drop shadows. Panels should feel flat, embedded, and distinct only through a 1px border or slight background lightness difference. This creates a tactile, physical feel rather than a floating web feel.",
    metadata: { style: ["panels", "minimal"] }
  },

  // ==========================================
  // LAYOUT SKILLS
  // ==========================================
  {
    id: "layout.minimal",
    type: "design_skill",
    title: "Minimal Layout",
    content: "INTENT: Create calm, distraction-free workspaces.\nPRINCIPLES: Emphasize negative space with large gaps (gap: 'lg'). Limit the number of widgets to 2 or 3. Remove all redundant or secondary information. The layout should feel open and breathing.\nUSEFUL_COMPONENTS: focus, recent_notes.\nANTI_PATTERNS: stats_row, complex grids, 4+ columns.",
    metadata: { intent: ["calm", "deep-work"], style: ["minimal"] }
  },
  {
    id: "layout.dense",
    type: "design_skill",
    title: "Dense Command Center",
    content: "INTENT: Maximize information density without excessive decoration for power users.\nPRINCIPLES: Use tight spacing (gap: 'sm' or 'none'). Prefer multi-column grids (3 columns on desktop). Utilize data-heavy widgets that can be scanned quickly.\nUSEFUL_COMPONENTS: stats_row, weekly_chart, category_breakdown, upcoming_tasks.\nANTI_PATTERNS: excessive padding, sparse layouts.",
    metadata: { intent: ["developer", "power-user"], style: ["dense"] }
  },
  {
    id: "layout.split-pane",
    type: "design_skill",
    title: "Split-Pane Layout",
    content: "INTENT: Provide two major contextual areas, simulating a physical notebook or IDE.\nPRINCIPLES: Strictly a 2-column grid. Usually a narrower left column (e.g., '1fr') for navigation/context, and a wider right column (e.g., '3fr') for deep content.\nUSEFUL_COMPONENTS: upcoming_tasks (left), recent_notes (right).\nANTI_PATTERNS: 3 or 4 columns, equal width columns.",
    metadata: { intent: ["research", "writing"], style: ["split-pane"] }
  },
  {
    id: "layout.asymmetric",
    type: "design_skill",
    title: "Asymmetric Layout",
    content: "INTENT: Emphasize one primary focal point while retaining supporting context.\nPRINCIPLES: Use a grid with uneven columns (e.g., [1fr, 300px]). The primary widget gets the large column to draw the eye, while secondary widgets stack in the smaller column.\nUSEFUL_COMPONENTS: recent_notes (main), focus (sidebar).\nANTI_PATTERNS: equal sized grids, symmetrical balance.",
    metadata: { intent: ["creative", "focus"], style: ["asymmetric"] }
  },

  // ==========================================
  // WORKSPACE INTENTS
  // ==========================================
  {
    id: "intent.task-first",
    type: "design_skill",
    title: "Task-First Workspace",
    content: "INTENT: Prioritize execution, task management, and daily planning.\nPRINCIPLES: The 'upcoming_tasks' widget must be the largest, primary visual surface. Reduce secondary information that doesn't aid execution. Analytics should be minimized, moved to the bottom, or removed entirely.\nUSEFUL_COMPONENTS: upcoming_tasks, focus.",
    metadata: { intent: ["task-first", "planning"], component: ["upcoming_tasks"] }
  },
  {
    id: "intent.notes-first",
    type: "design_skill",
    title: "Notes-First Workspace",
    content: "INTENT: Prioritize writing, journaling, and knowledge retrieval.\nPRINCIPLES: 'recent_notes' should dominate the layout, ideally taking up the full width or the main column. Tasks and analytics are purely secondary and should be hidden or placed in a small sidebar.\nUSEFUL_COMPONENTS: recent_notes.",
    metadata: { intent: ["notes-first", "research"], component: ["recent_notes"] }
  },
  {
    id: "intent.analytics-first",
    type: "design_skill",
    title: "Analytics-First Workspace",
    content: "INTENT: Focus on review, performance metrics, and high-level trends.\nPRINCIPLES: Data visualization takes priority. Use full-width charts (weekly_chart) and prominent stat rows (stats_row) at the top of the page.\nUSEFUL_COMPONENTS: stats_row, weekly_chart, category_breakdown.\nANTI_PATTERNS: hiding charts in small columns, burying stats_row at the bottom.",
    metadata: { intent: ["analytics-first", "review"], component: ["stats_row", "weekly_chart"] }
  },
  {
    id: "intent.research",
    type: "design_skill",
    title: "Research Workspace",
    content: "INTENT: Combine knowledge (notes) with visualization (graph) for deep conceptual work.\nPRINCIPLES: Notes and Graph are the main focus. They should either share a split-pane or stack vertically with significant height. Tasks are secondary or removed. Dense but highly organized.\nUSEFUL_COMPONENTS: recent_notes, focus, graph.",
    metadata: { intent: ["research", "deep-work"], component: ["recent_notes", "graph"] }
  },

  // ==========================================
  // COMPONENT GUIDANCE
  // ==========================================
  {
    id: "component.upcoming-tasks",
    type: "component_guidance",
    title: "Upcoming Tasks Widget",
    content: "PURPOSE: Shows actionable todos and daily tasks. IDEAL PLACEMENT: Needs vertical height to show lists. Do not place in short horizontal rows. MINIMUM SIZE: At least 1 column in a 3-column layout, but prefers more width. Emphasize in task-first layouts.",
    metadata: { component: ["upcoming_tasks"] }
  },
  {
    id: "component.recent-notes",
    type: "component_guidance",
    title: "Recent Notes Widget",
    content: "PURPOSE: Shows recent writing, journals, and documents. IDEAL PLACEMENT: Main content area. Needs significant width for comfortable reading of titles and excerpts. Incompatible with tiny narrow sidebar columns.",
    metadata: { component: ["recent_notes"] }
  },
  {
    id: "component.stats-row",
    type: "component_guidance",
    title: "Stats Row Widget",
    content: "PURPOSE: High-level quantitative metrics. IDEAL PLACEMENT: Top of the page, full width. Do not squish into narrow columns, as it contains 4 horizontal metrics that will wrap poorly.",
    metadata: { component: ["stats_row"] }
  },
  {
    id: "component.weekly-chart",
    type: "component_guidance",
    title: "Weekly Chart Widget",
    content: "PURPOSE: Bar chart of weekly activity. IDEAL PLACEMENT: Requires width to render bars properly. Often placed directly below Stats Row. Great for analytics-first layouts, terrible for tiny sidebars.",
    metadata: { component: ["weekly_chart"] }
  },
  {
    id: "component.focus",
    type: "component_guidance",
    title: "Focus Widget",
    content: "PURPOSE: Shows the single most important item or current goal. IDEAL PLACEMENT: Top corner or sidebar. Very flexible, can be small. Great pairing with large note or task widgets.",
    metadata: { component: ["focus"] }
  },
  {
    id: "component.category-breakdown",
    type: "component_guidance",
    title: "Category Breakdown Widget",
    content: "PURPOSE: Donut chart of task/note categories. IDEAL PLACEMENT: Square aspect ratio is fine. Good for sidebars or placed next to a weekly chart. Does not need full width.",
    metadata: { component: ["category_breakdown"] }
  },
  {
    id: "component.graph",
    type: "component_guidance",
    title: "Graph Widget Rules",
    content: "PURPOSE: Visualization of network connections and conceptual links. IDEAL PLACEMENT: Graph needs massive visual area. Never put it in a tiny panel or narrow sidebar. In graph-first layouts, it should be the dominant, full-width component. Often paired with notes.",
    metadata: { component: ["graph"] }
  },

  // ==========================================
  // LAYOUT PATTERNS
  // ==========================================
  {
    id: "pattern.single-primary",
    type: "layout_pattern",
    title: "Single Primary Pattern",
    content: "COMPOSITION: One massive widget (like upcoming_tasks or recent_notes) taking up 70% of the screen, with a 30% sidebar for supporting context (focus, category_breakdown). Use an asymmetric grid.",
    metadata: { style: ["asymmetric", "single-primary"] }
  },
  {
    id: "pattern.bento-workspace",
    type: "layout_pattern",
    title: "Bento Workspace Pattern",
    content: "COMPOSITION: A grid of mixed widget sizes (e.g., 2 columns, where one column has a tall widget, and the other has two stacked short widgets). Creates a strong, rigid visual hierarchy where everything fits perfectly.",
    metadata: { style: ["bento", "dense"] }
  },

  // ==========================================
  // ANTI-PATTERNS
  // ==========================================
  {
    id: "antipattern.hierarchy",
    type: "design_rule",
    title: "Hierarchy Anti-Patterns",
    content: "ANTI-PATTERN: Do not create too many equal-sized widgets; it removes the focal point. ANTI-PATTERN: Do not put heavy data charts above the primary header. ANTI-PATTERN: Avoid redundant information (e.g., two task widgets on the same surface). Every layout needs one clear primary focal point.",
    metadata: { style: ["anti-pattern", "hierarchy"] }
  },
  {
    id: "antipattern.spacing",
    type: "design_rule",
    title: "Spacing Anti-Patterns",
    content: "ANTI-PATTERN: Extremely sparse layouts with isolated, floating widgets that feel disconnected. ANTI-PATTERN: Overcrowded dashboards with no gap. Always use standardized gaps ('sm', 'md', 'lg') and maintain edge alignment. Do not use random pixel spacing.",
    metadata: { style: ["anti-pattern", "density"] }
  },
  {
    id: "antipattern.widget-sizing",
    type: "design_rule",
    title: "Widget Sizing Anti-Patterns",
    content: "ANTI-PATTERN: Putting a wide table or chart (stats_row, weekly_chart) into a narrow 1-column sidebar. ANTI-PATTERN: Stretching a simple text widget (focus) across a massive full-width row where it looks empty.",
    metadata: { style: ["anti-pattern", "sizing"] }
  },

  // ==========================================
  // RESPONSIVE DESIGN
  // ==========================================
  {
    id: "responsive.mobile-layout",
    type: "design_rule",
    title: "Responsive Constraints",
    content: "Keep mobile in mind. A layout with more than 3 columns will break heavily on small screens. Prefer 1 or 2 columns for general usability, unless specifically designing a dense desktop dashboard. Stacking is safer than complex grids.",
    metadata: { style: ["responsive"] }
  }
];
