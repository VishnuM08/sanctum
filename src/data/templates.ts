import type { CoverConfig } from '../types';

export type TemplateCategory =
  | 'Work' | 'School' | 'Life' | 'Project Management';

export const TEMPLATE_CATEGORY_META: { label: TemplateCategory; icon: string; desc: string }[] = [
  { label: 'Work',               icon: '💼', desc: 'Operations, marketing, engineering & more' },
  { label: 'School',             icon: '🎓', desc: 'Study planners, notes, career building' },
  { label: 'Life',               icon: '🌿', desc: 'Finance, health, habits & personal projects' },
  { label: 'Project Management', icon: '📊', desc: 'Sprints, roadmaps, OKRs & tracking' },
];

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  cover?: CoverConfig;
  content: unknown;
}

// ── Builder helpers ────────────────────────────────────────────────────────

const h2 = (text: string) => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] });
const h3 = (text: string) => ({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] });
const p = (...runs: (string | { text: string; bold?: boolean; italic?: boolean })[]) => ({
  type: 'paragraph',
  content: runs.map((r) => {
    if (typeof r === 'string') return r ? { type: 'text', text: r } : null;
    const marks: { type: string }[] = [];
    if (r.bold) marks.push({ type: 'bold' });
    if (r.italic) marks.push({ type: 'italic' });
    return { type: 'text', text: r.text, ...(marks.length ? { marks } : {}) };
  }).filter(Boolean),
});
const bullet = (...items: string[]) => ({
  type: 'bulletList',
  content: items.map((text) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })),
});
const numbered = (...items: string[]) => ({
  type: 'orderedList',
  content: items.map((text) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })),
});
const todo = (...items: { text: string; checked?: boolean }[]) => ({
  type: 'taskList',
  content: items.map(({ text, checked = false }) => ({
    type: 'taskItem', attrs: { checked },
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  })),
});
const hr = () => ({ type: 'horizontalRule' });
const quote = (text: string) => ({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });
const callout = (emoji: string, text: string) => ({
  type: 'calloutBlock', attrs: { emoji },
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});
const doc = (...nodes: unknown[]) => ({ type: 'doc', content: nodes.filter(Boolean) });

// ══════════════════════════════════════════════════════════════════
// WORK TEMPLATES
// ══════════════════════════════════════════════════════════════════

const operationsSOP = doc(
  callout('💡', 'Use this template to document processes, SOPs, and operational workflows for your team.'),
  h2('🏢 Operations Hub'),
  p('Central place for all operational processes, SOPs, and team knowledge.'),
  hr(),
  h2('📋 Standard Operating Procedures'),
  h3('SOP Template'),
  p({ text: 'Process Name: ', bold: true }, '[Name the process]'),
  p({ text: 'Owner: ', bold: true }, '[Name]  ·  ', { text: 'Last Updated: ', bold: true }, '[Date]  ·  ', { text: 'Version: ', bold: true }, '1.0'),
  p({ text: 'Purpose: ', bold: true }, '[Why this process exists]'),
  h3('Steps'),
  numbered('Step 1: [Action] — [Details]', 'Step 2: [Action] — [Details]', 'Step 3: [Action] — [Details]', 'Step 4: Review and confirm completion'),
  h3('Notes & Exceptions'),
  bullet('[Exception or edge case 1]', '[Exception or edge case 2]'),
  hr(),
  h2('🚨 Incident Log'),
  p({ text: 'Severity levels: ', bold: true }, 'P0 (critical) · P1 (high) · P2 (medium) · P3 (low)'),
  bullet('Incident #001 — [Date] — [Description] — Status: Resolved', 'Incident #002 — [Date] — [Description] — Status: Investigating'),
  hr(),
  h2('📅 Team Meeting Notes'),
  h3('Weekly Ops Sync'),
  p({ text: 'Date: ', bold: true }, '[Date]  ·  ', { text: 'Attendees: ', bold: true }, '[Names]'),
  todo({ text: 'Review open incidents' }, { text: 'Process improvement proposals' }, { text: 'Metrics review' }),
  hr(),
  h2('📚 Company Wiki'),
  bullet('→ Engineering Runbook', '→ Marketing Guidelines', '→ HR Policies', '→ Finance Procedures'),
);

const marketingHub = doc(
  callout('🎯', 'Your marketing command center — campaigns, content calendar, and brand assets in one place.'),
  h2('📣 Marketing Hub'),
  hr(),
  h2('📅 Content Calendar Overview'),
  p({ text: 'This month\'s focus: ', bold: true }, '[Campaign theme or initiative]'),
  p({ text: 'Channels: ', bold: true }, 'Instagram · LinkedIn · Email · Blog · YouTube'),
  hr(),
  h2('🚀 Active Campaigns'),
  h3('Campaign: [Name]'),
  p({ text: 'Status: ', bold: true }, 'Active  ·  ', { text: 'Start: ', bold: true }, '[Date]  ·  ', { text: 'End: ', bold: true }, '[Date]'),
  p({ text: 'Goal: ', bold: true }, '[Conversion target or metric]  ·  ', { text: 'Budget: ', bold: true }, '$[Amount]'),
  todo({ text: 'Brief copywriter', checked: true }, { text: 'Design assets', checked: true }, { text: 'Schedule posts', checked: false }, { text: 'Track performance' }),
  hr(),
  h2('✍️ Blog Pipeline'),
  bullet('📝 Draft: [Article title]', '👀 Review: [Article title]', '✅ Published: [Article title]'),
  hr(),
  h2('🔍 SEO Keywords'),
  p({ text: 'Target cluster: ', bold: true }, '[Topic]'),
  bullet('[Primary keyword] — Vol: [number] — Difficulty: [Low/Med/High]', '[Secondary keyword] — Vol: [number]', '[Long-tail keyword] — Vol: [number]'),
  hr(),
  h2('🏷️ Brand Assets'),
  p({ text: 'Primary color: ', bold: true }, '#[hex]  ·  ', { text: 'Secondary: ', bold: true }, '#[hex]'),
  p({ text: 'Fonts: ', bold: true }, '[Heading font] / [Body font]'),
  p({ text: 'Logo files: ', bold: true }, '[Link to drive or assets folder]'),
);

const designStudio = doc(
  callout('🎨', 'Design project tracker, brand guidelines, and component library — all in one place.'),
  h2('🎨 Design Studio'),
  hr(),
  h2('🗂️ Active Projects'),
  h3('Project: [Name]'),
  p({ text: 'Status: ', bold: true }, 'In Progress  ·  ', { text: 'Designer: ', bold: true }, '[Name]  ·  ', { text: 'Due: ', bold: true }, '[Date]'),
  p({ text: 'Brief: ', bold: true }, '[One sentence describing the design goal]'),
  numbered('📋 Brief received', '🔍 Research & moodboard', '✏️ Wireframes', '🎨 Visual design', '🔁 Client review', '🚢 Ship'),
  hr(),
  h2('📐 Brand Guidelines'),
  h3('Typography'),
  bullet('Heading: [Font Name], Bold', 'Body: [Font Name], Regular', 'Mono: [Font Name]'),
  h3('Colors'),
  bullet('Primary: #[hex] — [Usage]', 'Secondary: #[hex] — [Usage]', 'Accent: #[hex] — [Usage]', 'Background: #[hex]', 'Text: #[hex]'),
  h3('Spacing & Grid'),
  bullet('Base unit: 8px', 'Grid: 12 columns, 24px gutter', 'Border radius: 4px / 8px / 16px'),
  hr(),
  h2('🧩 Component Library'),
  bullet('Buttons (Primary, Secondary, Danger, Ghost)', 'Form inputs (Text, Select, Checkbox, Radio)', 'Cards (Default, Elevated, Bordered)', 'Navigation (Sidebar, Topbar, Breadcrumb)', 'Feedback (Toast, Modal, Alert)'),
  hr(),
  h2('💬 Design Critique Log'),
  p({ text: 'Latest review: ', bold: true }, '[Date]  ·  ', { text: 'Reviewer: ', bold: true }, '[Name]'),
  quote('[Feedback or decision from last design review]'),
);

const engineeringHub = doc(
  callout('⚙️', 'Engineering workspace — sprint board, bug tracker, docs, and runbooks.'),
  h2('⚙️ Engineering Hub'),
  hr(),
  h2('🏃 Sprint Board'),
  p({ text: 'Sprint #[N]: ', bold: true }, '[Sprint goal in one sentence]'),
  p({ text: 'Dates: ', bold: true }, '[Start] → [End]  ·  ', { text: 'Team: ', bold: true }, '[Names]'),
  h3('This Sprint'),
  todo({ text: '[Task] — @[Owner] — [Story points]pts', checked: true }, { text: '[Task] — @[Owner] — [Story points]pts', checked: false }, { text: '[Task] — @[Owner] — [Story points]pts', checked: false }),
  hr(),
  h2('🐛 Bug Tracker'),
  h3('Open Bugs'),
  bullet('🔴 [P0] — [Bug description] — @[Owner]', '🟠 [P1] — [Bug description] — @[Owner]', '🟡 [P2] — [Bug description] — @[Owner]'),
  hr(),
  h2('📖 Technical Docs'),
  h3('Architecture Decision Records (ADR)'),
  bullet('ADR-001: [Decision title] — [Date] — Status: Accepted', 'ADR-002: [Decision title] — [Date] — Status: Proposed'),
  h3('On-Call Runbook'),
  numbered('Check monitoring dashboard at [URL]', 'Identify service with alerts', 'Follow SOP for that service', 'Update incident log', 'Post-mortem within 48h'),
  hr(),
  h2('✅ Deployment Checklist'),
  todo({ text: 'All tests passing in CI' }, { text: 'Security review completed' }, { text: 'Staging tested' }, { text: 'Rollback plan documented' }, { text: 'Stakeholders notified' }),
  h2('🔧 Tech Debt'),
  bullet('[Tech debt item] — Priority: High/Med/Low — Estimated: [hours]', '[Tech debt item] — Priority: [Level]'),
);

const productRoadmap = doc(
  callout('🗺️', 'Your product command center — roadmap, features, PRDs, OKRs, and user research.'),
  h2('🗺️ Product Hub'),
  hr(),
  h2('📍 Roadmap Overview'),
  p({ text: 'Quarter: ', bold: true }, 'Q[N] [Year]  ·  ', { text: 'Theme: ', bold: true }, '[Strategic focus]'),
  h3('Now'),
  bullet('🚀 [Feature] — Status: In development — Owner: [Team]'),
  h3('Next'),
  bullet('🔜 [Feature] — Planned for Q[N]', '🔜 [Feature] — Awaiting design review'),
  h3('Later'),
  bullet('💭 [Feature] — Concept stage', '💭 [Feature] — Requires research'),
  hr(),
  h2('📋 PRD Template'),
  h3('[Feature Name]'),
  p({ text: 'Status: ', bold: true }, 'Draft  ·  ', { text: 'Author: ', bold: true }, '[Name]  ·  ', { text: 'Date: ', bold: true }, '[Date]'),
  p({ text: 'Problem: ', bold: true }, '[What user problem are we solving?]'),
  p({ text: 'Solution: ', bold: true }, '[Proposed approach]'),
  p({ text: 'Success metric: ', bold: true }, '[How will we know it worked?]'),
  hr(),
  h2('💡 Feature Requests'),
  p('Votes | Feature | Requestor | Status'),
  bullet('[N] votes — [Feature] — @[User] — Under Review', '[N] votes — [Feature] — @[User] — Declined', '[N] votes — [Feature] — @[User] — Planned'),
  hr(),
  h2('🔬 User Research'),
  h3('Interview Notes — [Date]'),
  p({ text: 'Participant: ', bold: true }, '[Persona / company type]'),
  p({ text: 'Key insight: ', bold: true }, '[Main finding from the interview]'),
  quote('"[Direct quote from participant]"'),
);

const startupOs = doc(
  callout('🚀', 'Your startup command center — investor CRM, fundraising, KPIs, and hiring.'),
  h2('🚀 Startup OS'),
  hr(),
  h2('💰 Fundraising Pipeline'),
  h3('Round: [Seed/Series A/B]'),
  p({ text: 'Target: ', bold: true }, '$[Amount]  ·  ', { text: 'Timeline: ', bold: true }, '[Date range]  ·  ', { text: 'Lead: ', bold: true }, '[VC firm or lead investor]'),
  bullet('🤝 Warm intros needed: [N]', '📧 Outreach sent: [N]', '☎️ First calls: [N]', '📋 Second meetings: [N]', '✅ Committed: $[Amount]'),
  hr(),
  h2('👥 Investor CRM'),
  p({ text: 'Status legend: ', bold: true }, 'Target → Contacted → Meeting → Due Diligence → Term Sheet → Passed'),
  bullet('[Firm Name] — [Partner] — [email] — Status: Meeting Scheduled', '[Firm Name] — [Partner] — [email] — Status: Passed', '[Firm Name] — [Partner] — [email] — Status: Target'),
  hr(),
  h2('📊 KPI Dashboard'),
  h3('This Month'),
  bullet('ARR: $[Amount] (+[%] MoM)', 'MRR: $[Amount]', 'Customers: [N] (+[N])', 'Churn: [%]', 'CAC: $[Amount]', 'LTV: $[Amount]', 'Runway: [N] months'),
  hr(),
  h2('🧑‍💼 Hiring Tracker'),
  bullet('🔵 Engineering Lead — Sourcing', '🟡 Marketing Manager — 2nd round interviews', '🟢 Sales AE — Offer extended', '⚫ Head of Finance — Closed'),
  hr(),
  h2('📝 Advisor Board'),
  bullet('[Advisor Name] — [Expertise] — [Next check-in date]', '[Advisor Name] — [Expertise] — [Next check-in date]'),
);

const hrCentral = doc(
  callout('🧑‍💼', 'HR workspace — employee directory, onboarding, performance reviews, and job postings.'),
  h2('🧑‍💼 HR Central'),
  hr(),
  h2('👥 Employee Directory'),
  p('Browse all employees by department, role, or location.'),
  bullet('[Name] — [Role] — [Department] — [Location] — Start: [Date]', '[Name] — [Role] — [Department] — [Location]', '[Name] — [Role] — [Department] — [Location]'),
  hr(),
  h2('🎯 Onboarding Checklist'),
  h3('Before Day 1'),
  todo({ text: 'Send welcome email', checked: true }, { text: 'Prepare equipment', checked: true }, { text: 'Set up accounts (email, Slack, GitHub)' }, { text: 'Schedule first-week meetings' }),
  h3('Week 1'),
  todo({ text: 'Team introduction call' }, { text: 'Company culture session' }, { text: 'Role-specific training begins' }, { text: '1:1 with manager' }),
  h3('Month 1'),
  todo({ text: '30-day check-in' }, { text: 'First project assigned' }, { text: 'OKRs set for the quarter' }),
  hr(),
  h2('📊 Performance Reviews'),
  h3('Q[N] Review — [Name]'),
  p({ text: 'Rating: ', bold: true }, '[ Exceeds / Meets / Needs improvement ]'),
  p({ text: 'Key wins: ', bold: true }, '[Accomplishments this quarter]'),
  p({ text: 'Growth areas: ', bold: true }, '[What to work on next quarter]'),
  p({ text: 'Goals for next quarter: ', bold: true }, '[3 specific goals]'),
  hr(),
  h2('🧑‍💼 Job Board'),
  bullet('🟢 [Role] — [Department] — Open — [N] applicants', '🟡 [Role] — [Department] — Interviewing — [N] candidates', '✅ [Role] — [Department] — Offer extended', '⚫ [Role] — [Department] — Closed'),
);

const salesCrm = doc(
  callout('💼', 'Your sales CRM — pipeline, contacts, deals, and email templates.'),
  h2('💼 Sales CRM'),
  hr(),
  h2('📈 Pipeline Overview'),
  p({ text: 'This Month: ', bold: true }, '$[Amount] pipeline  ·  ', { text: 'Won: ', bold: true }, '$[Amount]  ·  ', { text: 'Lost: ', bold: true }, '$[Amount]'),
  h3('By Stage'),
  bullet('Lead: [N] deals — $[Amount]', 'Qualified: [N] deals — $[Amount]', 'Proposal: [N] deals — $[Amount]', 'Negotiation: [N] deals — $[Amount]', 'Won: [N] deals — $[Amount]'),
  hr(),
  h2('👥 Contacts'),
  p({ text: 'Recent: ', bold: true }),
  bullet('[Name] — [Company] — [email] — Stage: Proposal — Deal: $[Amount]', '[Name] — [Company] — [email] — Stage: Qualified', '[Name] — [Company] — [email] — Stage: Lead'),
  hr(),
  h2('📅 Meeting Log'),
  h3('[Date] — Call with [Name] from [Company]'),
  p({ text: 'Summary: ', bold: true }, '[What was discussed]'),
  p({ text: 'Next step: ', bold: true }, '[What happens next and by when]'),
  todo({ text: 'Send follow-up email' }, { text: 'Schedule demo' }, { text: 'Send proposal' }),
  hr(),
  h2('✉️ Email Templates'),
  h3('Initial Outreach'),
  quote('Hi [Name], I noticed [personalized observation]. We help [company type] achieve [outcome]. Would a 15-minute call make sense?'),
  h3('Follow-up'),
  quote('Hi [Name], just circling back on my previous note. Wanted to share [value prop]. Is this relevant for [Company]?'),
);

const meetingHub = doc(
  callout('📋', 'Centralized meeting hub — recurring logs, standup templates, and 1:1 trackers.'),
  h2('📋 Meeting Hub'),
  hr(),
  h2('📅 Recurring Meetings'),
  h3('Weekly Team Sync'),
  p({ text: 'When: ', bold: true }, 'Every Monday, 10:00 AM  ·  ', { text: 'Duration: ', bold: true }, '45 min  ·  ', { text: 'Facilitator: ', bold: true }, '[Name]'),
  h3('Meeting Notes — [Date]'),
  p({ text: 'Attendees: ', bold: true }, '[Names]'),
  p({ text: 'Key decisions: ', bold: true }),
  bullet('[Decision made and rationale]', '[Decision made and rationale]'),
  p({ text: 'Action items: ', bold: true }),
  todo({ text: '[@Name] — [Action] by [Date]' }, { text: '[@Name] — [Action] by [Date]' }),
  hr(),
  h2('⚡ Daily Standup'),
  p({ text: 'Format: ', bold: true }, 'Yesterday · Today · Blockers'),
  h3('[Date]'),
  bullet('[Name]: Yesterday [X], Today [Y], Blocker: [Z or "none"]', '[Name]: Yesterday [X], Today [Y], Blocker: [Z or "none"]'),
  hr(),
  h2('🤝 1:1 Tracker'),
  h3('[Manager] ↔ [Report] — [Date]'),
  p({ text: 'Their agenda: ', bold: true }),
  bullet('[Topic they raised]', '[Career question or concern]'),
  p({ text: 'Your agenda: ', bold: true }),
  bullet('[Feedback to share]', '[Project update]'),
  todo({ text: 'Follow up on [action]' }, { text: 'Send resources on [topic]' }),
);

const companyWiki = doc(
  callout('📚', 'Your company knowledge base — department wikis, getting started guide, and FAQs.'),
  h2('📚 Company Wiki'),
  hr(),
  h2('🗂️ Departments'),
  bullet('→ Engineering', '→ Product', '→ Marketing', '→ Sales', '→ HR & People', '→ Finance & Legal'),
  hr(),
  h2('👋 Getting Started Guide'),
  h3('Day 1 Checklist'),
  todo({ text: 'Read the company handbook', checked: true }, { text: 'Set up all accounts', checked: true }, { text: 'Meet your team', checked: false }, { text: 'Complete security training', checked: false }),
  h3('Our Mission'),
  quote('[Company mission statement — why we exist and who we serve]'),
  h3('Values'),
  bullet('🎯 [Value 1]: [What it means in practice]', '🤝 [Value 2]: [What it means in practice]', '🚀 [Value 3]: [What it means in practice]'),
  hr(),
  h2('❓ FAQ'),
  h3('How do I request time off?'),
  p('[Process or link to HR tool]'),
  h3('Where are the design assets?'),
  p('[Link to Figma or asset folder]'),
  h3('Who do I contact for IT help?'),
  p('[IT contact or ticket process]'),
  hr(),
  h2('📖 Glossary'),
  bullet('CAC — Customer Acquisition Cost: [definition]', 'ARR — Annual Recurring Revenue: [definition]', 'OKR — Objective and Key Result: [definition]'),
);

// ══════════════════════════════════════════════════════════════════
// SCHOOL TEMPLATES
// ══════════════════════════════════════════════════════════════════

const studyPlanner = doc(
  callout('📚', 'Your semester study command center — assignments, exams, grades, and study sessions.'),
  h2('📚 Study Planner'),
  p({ text: 'Semester: ', bold: true }, '[Fall/Spring] [Year]  ·  ', { text: 'University: ', bold: true }, '[Name]'),
  hr(),
  h2('📋 My Subjects'),
  bullet('📐 [Subject 1] — Prof. [Name] — [Credits] credits', '📊 [Subject 2] — Prof. [Name] — [Credits] credits', '📖 [Subject 3] — Prof. [Name] — [Credits] credits', '🧬 [Subject 4] — Prof. [Name] — [Credits] credits'),
  hr(),
  h2('📝 Assignment Tracker'),
  todo({ text: '[Subject] — [Assignment] — Due: [Date] — Weight: [%]' }, { text: '[Subject] — [Assignment] — Due: [Date] — Weight: [%]', checked: true }, { text: '[Subject] — [Assignment] — Due: [Date] — Weight: [%]' }),
  hr(),
  h2('📅 Exam Schedule'),
  bullet('📅 [Subject] Midterm — [Date] — Location: [Room]', '📅 [Subject] Final — [Date] — Location: [Room]', '📅 [Subject] Quiz — [Date]'),
  hr(),
  h2('📊 Grade Tracker'),
  bullet('[Subject 1]: Midterm [%] · HW [%] · Final [%] → GPA: [letter]', '[Subject 2]: [%] → GPA: [letter]', '[Subject 3]: [%] → GPA: [letter]'),
  hr(),
  h2('⏱️ Study Log'),
  p('Tracking study hours per subject this week:'),
  bullet('[Subject 1]: [N] hours', '[Subject 2]: [N] hours', '[Subject 3]: [N] hours'),
);

const studentDashboard = doc(
  callout('🎓', 'Your student home — classes, deadlines, notes, habits, and goals in one view.'),
  h2('🎓 Student Dashboard'),
  p({ text: 'Name: ', bold: true }, '[Your Name]  ·  ', { text: 'Major: ', bold: true }, '[Major]  ·  ', { text: 'Year: ', bold: true }, '[Freshman/Sophomore/Junior/Senior]'),
  hr(),
  h2('📅 This Week'),
  todo({ text: '[Subject] Assignment due [Day]' }, { text: 'Study for [Subject] midterm' }, { text: 'Office hours with Prof. [Name]' }, { text: 'Club meeting: [Name]' }),
  hr(),
  h2('📚 My Notebooks'),
  bullet('📐 [Subject 1] Notes', '📊 [Subject 2] Notes', '📖 [Subject 3] Notes', '🧬 [Subject 4] Notes'),
  hr(),
  h2('🎯 Semester Goals'),
  todo({ text: 'Maintain [GPA] GPA' }, { text: 'Complete internship applications by [Date]' }, { text: 'Join [Club/Organization]' }, { text: 'Read [N] books outside coursework' }),
  hr(),
  h2('✅ Daily Habits'),
  todo({ text: 'Review notes from today\'s lectures' }, { text: '30 min focused study session' }, { text: 'Physical activity' }, { text: 'Read for pleasure (20 min)' }),
  hr(),
  h2('💭 Quick Notes'),
  p('[Capture anything here — ideas, to-dos, thoughts]'),
);

const classNotes = doc(
  callout('📓', 'Structured lecture notes using Cornell method — capture, review, and remember everything.'),
  h2('📓 Class Notes'),
  p({ text: 'Course: ', bold: true }, '[Course Name]  ·  ', { text: 'Professor: ', bold: true }, '[Name]  ·  ', { text: 'Term: ', bold: true }, '[Semester Year]'),
  hr(),
  h2('Lecture Notes — [Date]: [Topic]'),
  h3('📝 Notes'),
  p('[Write your lecture notes here in real-time]'),
  bullet('[Key point 1]', '[Key point 2]', '[Example or case study]'),
  h3('🔑 Key Concepts'),
  p({ text: '[Term]: ', bold: true }, '[Definition in your own words]'),
  p({ text: '[Term]: ', bold: true }, '[Definition in your own words]'),
  h3('❓ Questions'),
  bullet('[Question you have about today\'s material]', '[Something you want to follow up on]'),
  h3('📋 Summary'),
  p('[Summarize the lecture in 2-3 sentences]'),
  hr(),
  h2('📋 Cornell Notes Format'),
  p({ text: 'Cues column (left): ', bold: true }, 'Key words, questions, main topics'),
  p({ text: 'Notes column (right): ', bold: true }, 'Detailed notes from lecture'),
  p({ text: 'Summary (bottom): ', bold: true }, 'Your takeaway in your own words'),
  hr(),
  h2('🔁 Review Schedule'),
  todo({ text: 'Review within 24 hours' }, { text: 'Review at end of week' }, { text: 'Review before midterm' }, { text: 'Review before final' }),
);

const careerBuilder = doc(
  callout('💼', 'Build your career — resume, job applications, interview prep, and networking.'),
  h2('💼 Career Builder'),
  hr(),
  h2('📄 Resume'),
  h3('Summary'),
  p('[2-3 sentence professional summary highlighting your value]'),
  h3('Experience'),
  p({ text: '[Company] — [Role]', bold: true }, ' · [Start] – [End]'),
  bullet('[Achievement with quantified impact]', '[Achievement with quantified impact]', '[Responsibility or skill demonstrated]'),
  h3('Education'),
  p({ text: '[University] — [Degree]', bold: true }, ' · [Year]'),
  h3('Skills'),
  bullet('Technical: [Skills list]', 'Tools: [Tools list]', 'Soft skills: [Skills]'),
  hr(),
  h2('📋 Job Application Tracker'),
  todo({ text: '[Company] — [Role] — Applied [Date] — Status: Phone screen' }, { text: '[Company] — [Role] — Applied [Date] — Status: Take-home project', checked: false }, { text: '[Company] — [Role] — Applied [Date] — Status: Offer received' }),
  hr(),
  h2('🎤 Interview Prep'),
  h3('STAR Stories (Situation, Task, Action, Result)'),
  p({ text: 'Story 1 — Leadership: ', bold: true }, '[Your STAR example]'),
  p({ text: 'Story 2 — Conflict: ', bold: true }, '[Your STAR example]'),
  p({ text: 'Story 3 — Achievement: ', bold: true }, '[Your STAR example]'),
  h3('Questions to ask'),
  bullet('What does success look like in the first 90 days?', 'How does the team handle disagreements?', 'What\'s the biggest challenge the team is facing?'),
  hr(),
  h2('🤝 Networking Log'),
  bullet('[Name] — [Company] — [Role] — Met at [Event] — Follow up: [Date]', '[Name] — [Company] — [Role] — LinkedIn connection — Status: Warm'),
);

const teachingToolkit = doc(
  callout('📐', 'Teacher\'s workspace — lesson plans, student roster, grading, and curriculum.'),
  h2('📐 Teaching Toolkit'),
  hr(),
  h2('📅 Lesson Plan'),
  h3('Lesson: [Topic] — [Date]'),
  p({ text: 'Subject: ', bold: true }, '[Subject]  ·  ', { text: 'Grade: ', bold: true }, '[Grade]  ·  ', { text: 'Duration: ', bold: true }, '[N] minutes'),
  p({ text: 'Objectives: ', bold: true }, 'By the end students will be able to…'),
  bullet('[Learning objective 1]', '[Learning objective 2]'),
  h3('Materials'),
  bullet('[Material 1]', '[Material 2]', '[Technology needed]'),
  h3('Lesson Structure'),
  numbered('Warm-up ([N] min): [Activity]', 'Introduction ([N] min): [What to teach]', 'Guided practice ([N] min): [Activity]', 'Independent work ([N] min): [Task]', 'Wrap-up ([N] min): Review + homework'),
  h3('Assessment'),
  p('[How you\'ll know students understood the lesson]'),
  hr(),
  h2('📊 Student Roster & Progress'),
  bullet('[Student Name] — [Notes on progress or needs]', '[Student Name] — [Notes]', '[Student Name] — [Notes]'),
  hr(),
  h2('📖 Curriculum Map'),
  h3('Unit 1: [Topic]'),
  bullet('Week 1: [Lessons]', 'Week 2: [Lessons]', 'Week 3: [Lessons]', 'Assessment: [Type]'),
  hr(),
  h2('📩 Parent Communication Log'),
  bullet('[Date] — [Student] — [Parent] — [Subject] — [Outcome]', '[Date] — [Student] — [Parent] — [Subject] — [Outcome]'),
);

// ══════════════════════════════════════════════════════════════════
// LIFE TEMPLATES
// ══════════════════════════════════════════════════════════════════

const personalProductivity = doc(
  callout('⚡', 'GTD-inspired personal productivity system — capture, process, plan, and review.'),
  h2('⚡ Personal Productivity'),
  hr(),
  h2('📥 Inbox (Quick Capture)'),
  p('[Capture anything here — clear daily]'),
  bullet('[Task or thought to process]', '[Idea to explore later]'),
  hr(),
  h2('📅 Today'),
  p({ text: 'Date: ', bold: true }, '[Date]  ·  ', { text: 'Top priority: ', bold: true }, '[The ONE thing that matters today]'),
  todo({ text: 'Most important task' }, { text: 'Second priority' }, { text: 'Quick task' }, { text: 'Follow-up' }),
  hr(),
  h2('📁 Projects'),
  bullet('🔵 [Active project] — Next action: [Task]', '🟡 [Active project] — Next action: [Task]', '⚫ [On hold] — Waiting for: [Person/thing]'),
  hr(),
  h2('🎯 Goals'),
  h3('This Quarter'),
  todo({ text: '[Goal 1] — Milestone: [Checkpoint]' }, { text: '[Goal 2] — Milestone: [Checkpoint]' }, { text: '[Goal 3] — Milestone: [Checkpoint]' }),
  hr(),
  h2('🔁 Weekly Review (Every Friday)'),
  todo({ text: 'Clear inbox to zero' }, { text: 'Review all projects' }, { text: 'Plan next week priorities' }, { text: 'Celebrate one win from this week' }),
  hr(),
  h2('📆 Someday / Maybe'),
  bullet('[Idea for later]', '[Trip to plan eventually]', '[Skill to learn]'),
);

const budgetFinance = doc(
  callout('💰', 'Personal finance hub — monthly budget, spending tracker, savings goals, and subscriptions.'),
  h2('💰 Budget & Finance'),
  hr(),
  h2('📊 Monthly Budget — [Month Year]'),
  h3('Income'),
  bullet('Salary: $[Amount]', 'Side income: $[Amount]', 'Other: $[Amount]', '→ Total: $[Amount]'),
  h3('Fixed Expenses'),
  bullet('Rent/Mortgage: $[Amount]', 'Insurance: $[Amount]', 'Subscriptions: $[Amount]', 'Loan payments: $[Amount]'),
  h3('Variable Expenses'),
  bullet('Food & groceries: $[Amount]', 'Transport: $[Amount]', 'Entertainment: $[Amount]', 'Personal care: $[Amount]', 'Miscellaneous: $[Amount]'),
  h3('Summary'),
  p({ text: 'Income: ', bold: true }, '$[Amount]  ·  ', { text: 'Expenses: ', bold: true }, '$[Amount]  ·  ', { text: 'Saved: ', bold: true }, '$[Amount] ([%]%)'),
  hr(),
  h2('🎯 Savings Goals'),
  todo({ text: 'Emergency fund: $[Amount] of $[Goal]' }, { text: 'Vacation fund: $[Amount] of $[Goal]' }, { text: '[Goal]: $[Amount] of $[Goal]' }),
  hr(),
  h2('📱 Subscriptions'),
  bullet('Netflix — $[Amount]/mo — Renews [Date]', 'Gym — $[Amount]/mo — Renews [Date]', 'Cloud storage — $[Amount]/mo', '[Service] — $[Amount]/mo — Renews [Date]'),
  hr(),
  h2('📈 Net Worth Tracker'),
  p({ text: 'Assets: ', bold: true }, '$[Amount]  ·  ', { text: 'Liabilities: ', bold: true }, '$[Amount]  ·  ', { text: 'Net worth: ', bold: true }, '$[Amount]'),
);

const habitTracker = doc(
  callout('✅', 'Build consistent habits — track streaks, weekly progress, and monthly momentum.'),
  h2('✅ Habit Tracker'),
  hr(),
  h2('🗓️ This Week'),
  p({ text: 'Week of: ', bold: true }, '[Date range]  ·  ', { text: 'Completion: ', bold: true }, '[N]/[total] habits'),
  h3('Daily Habits'),
  bullet('💪 Exercise — Mon ✓ · Tue ✓ · Wed · Thu · Fri · Sat · Sun', '📚 Read 20 min — Mon ✓ · Tue ✓ · Wed ✓ · Thu · Fri · Sat · Sun', '🧘 Meditate — Mon · Tue · Wed · Thu · Fri · Sat · Sun', '💧 8 glasses water — Mon ✓ · Tue · Wed · Thu · Fri · Sat · Sun', '📵 No social media — Mon ✓ · Tue ✓ · Wed · Thu · Fri · Sat · Sun'),
  hr(),
  h2('🔥 Streaks'),
  bullet('💪 Exercise: [N] days ← current streak', '📚 Reading: [N] days', '🧘 Meditation: [N] days'),
  hr(),
  h2('🔁 Weekly Review'),
  p({ text: 'Best habit this week: ', bold: true }, '[Which habit went best]'),
  p({ text: 'Hardest to maintain: ', bold: true }, '[Which habit was a struggle]'),
  p({ text: 'Adjustment for next week: ', bold: true }, '[What you\'ll change or keep]'),
  hr(),
  h2('📅 Monthly Overview'),
  p('[Visual grid or log of habit completion per day]'),
  p({ text: 'Monthly completion rate: ', bold: true }, '[N]%  ·  ', { text: 'Best streak: ', bold: true }, '[N] days'),
);

const fitnessLog = doc(
  callout('💪', 'Track workouts, body measurements, meals, sleep, and personal records.'),
  h2('💪 Health & Fitness'),
  hr(),
  h2('🏋️ Workout Log'),
  h3('[Date] — [Workout Type]'),
  p({ text: 'Duration: ', bold: true }, '[N] min  ·  ', { text: 'Energy: ', bold: true }, '[1-5]  ·  ', { text: 'Notes: ', bold: true }, '[How it felt]'),
  bullet('Exercise 1: [Name] — [Sets]×[Reps] @ [Weight]', 'Exercise 2: [Name] — [Sets]×[Reps] @ [Weight]', 'Exercise 3: [Name] — [Sets]×[Reps] @ [Weight]'),
  hr(),
  h2('📅 Weekly Program'),
  bullet('Monday: [Upper body / Push]', 'Tuesday: [Lower body / Legs]', 'Wednesday: [Rest or active recovery]', 'Thursday: [Upper body / Pull]', 'Friday: [Full body or cardio]', 'Saturday: [Sport or outdoor activity]', 'Sunday: [Rest]'),
  hr(),
  h2('📊 Body Measurements'),
  p({ text: 'Date: ', bold: true }, '[Date]  ·  ', { text: 'Weight: ', bold: true }, '[N] kg  ·  ', { text: 'Body fat: ', bold: true }, '[N]%'),
  bullet('Chest: [N]cm', 'Waist: [N]cm', 'Hips: [N]cm', 'Bicep: [N]cm', 'Thigh: [N]cm'),
  hr(),
  h2('🏆 Personal Records'),
  bullet('Squat: [N]kg × [Reps] — [Date]', 'Deadlift: [N]kg × [Reps] — [Date]', 'Bench press: [N]kg × [Reps] — [Date]', '5K run: [Time] — [Date]'),
  hr(),
  h2('😴 Sleep Log'),
  bullet('[Date]: [N]h [N]m — Quality: [1-5] — Notes: [Observations]', '[Date]: [N]h [N]m — Quality: [1-5]'),
);

const journal = doc(
  callout('✍️', 'Daily journal with mood tracking, gratitude, reflections, and monthly reviews.'),
  h2('✍️ Journal'),
  hr(),
  h2('📅 Daily Entry — [Date]'),
  p({ text: '😊 Mood: ', bold: true }, '[ 😄 🙂 😐 😔 😤 ]'),
  p({ text: '⚡ Energy: ', bold: true }, '[ 🔥 💪 😐 🥱 😴 ]'),
  hr(),
  h3('🌅 Morning'),
  p({ text: '3 things I\'m grateful for: ', bold: true }),
  numbered('[Gratitude 1]', '[Gratitude 2]', '[Gratitude 3]'),
  p({ text: 'My intention for today: ', bold: true }, '[What you want to focus on or feel]'),
  hr(),
  h3('📖 Free Writing'),
  p('[Write whatever is on your mind — no judgment, no editing]'),
  hr(),
  h3('🌙 Evening Reflection'),
  p({ text: 'Highlight of the day: ', bold: true }, '[Best moment]'),
  p({ text: 'Challenge I faced: ', bold: true }, '[Difficulty and how I handled it]'),
  p({ text: 'Something I learned: ', bold: true }, '[Insight or lesson]'),
  p({ text: 'One word to describe today: ', bold: true }, '[Word]'),
  hr(),
  h2('📆 Monthly Review — [Month]'),
  p({ text: 'Theme that emerged: ', bold: true }, '[Pattern or recurring topic]'),
  p({ text: 'Biggest win: ', bold: true }, '[Achievement you\'re proud of]'),
  p({ text: 'Biggest challenge: ', bold: true }, '[What was hard]'),
  p({ text: 'Goal for next month: ', bold: true }, '[What you want to focus on]'),
);

const mealPlanner = doc(
  callout('🍽️', 'Weekly meal planning, recipe library, grocery list, and nutrition tracking.'),
  h2('🍽️ Meal Planner'),
  hr(),
  h2('📅 This Week\'s Plan'),
  bullet('Monday: Breakfast [Recipe] · Lunch [Recipe] · Dinner [Recipe]', 'Tuesday: Breakfast [Recipe] · Lunch [Recipe] · Dinner [Recipe]', 'Wednesday: Breakfast [Recipe] · Lunch [Recipe] · Dinner [Recipe]', 'Thursday: Breakfast [Recipe] · Lunch [Recipe] · Dinner [Recipe]', 'Friday: Breakfast [Recipe] · Lunch [Recipe] · Dinner [Recipe]', 'Saturday: [Flexible / Eat out]', 'Sunday: [Meal prep day]'),
  hr(),
  h2('🛒 Grocery List'),
  h3('Produce'),
  todo({ text: '[Ingredient]' }, { text: '[Ingredient]' }, { text: '[Ingredient]' }),
  h3('Proteins'),
  todo({ text: '[Ingredient]' }, { text: '[Ingredient]' }),
  h3('Pantry & Dry Goods'),
  todo({ text: '[Ingredient]' }, { text: '[Ingredient]' }),
  hr(),
  h2('📖 Recipe Library'),
  h3('[Recipe Name]'),
  p({ text: 'Prep time: ', bold: true }, '[N] min  ·  ', { text: 'Cook time: ', bold: true }, '[N] min  ·  ', { text: 'Serves: ', bold: true }, '[N]'),
  p({ text: 'Ingredients: ', bold: true }),
  bullet('[N] [unit] [ingredient]', '[N] [unit] [ingredient]', '[N] [unit] [ingredient]'),
  p({ text: 'Instructions: ', bold: true }),
  numbered('[Step 1]', '[Step 2]', '[Step 3]'),
);

const entertainmentTracker = doc(
  callout('🎬', 'Track everything you\'re watching, reading, playing, and listening to.'),
  h2('🎬 Entertainment Tracker'),
  hr(),
  h2('🎥 Movies'),
  bullet('✅ [Movie] — [Year] — ⭐⭐⭐⭐ — [Brief note]', '👀 [Movie] — Currently watching', '📋 [Movie] — Want to watch', '📋 [Movie] — Want to watch'),
  hr(),
  h2('📺 TV Shows'),
  bullet('✅ [Show] — S[N]E[N] — ⭐⭐⭐⭐⭐', '👀 [Show] — Currently on S[N]E[N]', '📋 [Show] — Want to start', '📋 [Show] — On hiatus'),
  hr(),
  h2('📚 Books'),
  bullet('✅ [Book] by [Author] — ⭐⭐⭐⭐ — [Finished date]', '📖 [Book] — Page [N] of [N]', '📋 [Book] — On wishlist'),
  hr(),
  h2('🎮 Games'),
  bullet('✅ [Game] — [Platform] — Completed — ⭐⭐⭐⭐', '🎮 [Game] — [Platform] — Currently playing', '📋 [Game] — [Platform] — Backlog'),
  hr(),
  h2('🎵 Podcasts'),
  bullet('🎧 [Podcast] — Ep [N] — Topic: [Topic]', '📋 [Podcast] — In my list'),
  hr(),
  h2('💡 Recommendations'),
  p({ text: 'From [Name]: ', bold: true }, '[Title] — [Their note]'),
  p({ text: 'From [Name]: ', bold: true }, '[Title] — [Their note]'),
);

const weddingPlanner = doc(
  callout('💍', 'Complete wedding planning hub — checklist, guest list, vendors, budget, and timeline.'),
  h2('💍 Wedding Planner'),
  p({ text: 'Date: ', bold: true }, '[Wedding Date]  ·  ', { text: 'Venue: ', bold: true }, '[Venue Name]  ·  ', { text: 'Guest count: ', bold: true }, '[N]'),
  hr(),
  h2('✅ Master Checklist'),
  h3('12 Months Before'),
  todo({ text: 'Set budget' }, { text: 'Create guest list draft' }, { text: 'Book venue' }, { text: 'Choose wedding date' }, { text: 'Start looking at photographers' }),
  h3('6 Months Before'),
  todo({ text: 'Send save-the-dates' }, { text: 'Book photographer & videographer' }, { text: 'Book florist & caterer' }, { text: 'Order dress/suit' }, { text: 'Book honeymoon' }),
  h3('1 Month Before'),
  todo({ text: 'Confirm all vendors' }, { text: 'Final dress fitting' }, { text: 'Finalize seating chart' }, { text: 'Create day-of timeline' }),
  hr(),
  h2('👥 Guest List'),
  bullet('[Name] — [Email] — RSVP: Yes/No/Pending — Meal: [Choice] — Table: [N]', '[Name] — [Email] — RSVP: Pending', '[Name] — [Email] — RSVP: Yes — Meal: Vegetarian'),
  hr(),
  h2('🛎️ Vendor Tracker'),
  bullet('📷 Photographer: [Name] — $[Amount] — Deposit paid: ✅/❌', '🌸 Florist: [Name] — $[Amount] — Deposit paid: ✅/❌', '🎵 DJ/Band: [Name] — $[Amount] — Deposit paid: ✅/❌', '🍰 Cake: [Name] — $[Amount]', '🚗 Transport: [Name] — $[Amount]'),
  hr(),
  h2('💰 Budget'),
  p({ text: 'Total budget: ', bold: true }, '$[Amount]  ·  ', { text: 'Spent so far: ', bold: true }, '$[Amount]  ·  ', { text: 'Remaining: ', bold: true }, '$[Amount]'),
  bullet('Venue: $[Amount] of $[Budget]', 'Catering: $[Amount] of $[Budget]', 'Photography: $[Amount] of $[Budget]', 'Flowers: $[Amount] of $[Budget]', 'Dress/Attire: $[Amount] of $[Budget]', 'Music: $[Amount] of $[Budget]', 'Honeymoon: $[Amount] of $[Budget]'),
);

const homeManager = doc(
  callout('🏠', 'Home management hub — chores, maintenance log, inventory, bills, and emergency contacts.'),
  h2('🏠 Home Manager'),
  hr(),
  h2('🧹 Chores Tracker'),
  h3('Weekly'),
  todo({ text: 'Vacuum all rooms' }, { text: 'Mop kitchen & bathroom' }, { text: 'Clean bathrooms' }, { text: 'Take out trash & recycling' }, { text: 'Grocery shopping' }),
  h3('Monthly'),
  todo({ text: 'Clean oven & appliances' }, { text: 'Change HVAC filter' }, { text: 'Check smoke detector batteries' }, { text: 'Deep clean refrigerator' }),
  hr(),
  h2('🔧 Maintenance Log'),
  bullet('[Date] — [Repair/task] — Cost: $[Amount] — Contractor: [Name]', '[Date] — [Repair/task] — Cost: $[Amount] — DIY', '[Date] — [Repair/task] — Scheduled for [Future date]'),
  hr(),
  h2('📋 Home Inventory'),
  h3('Electronics'),
  bullet('[Item] — Model: [N] — Serial: [N] — Purchase: [Date] — Warranty: [Date]', '[Item] — Model: [N] — Warranty: [Date]'),
  h3('Appliances'),
  bullet('[Appliance] — Brand: [N] — Model: [N] — Warranty: [Date]', '[Appliance] — Purchased: [Date]'),
  hr(),
  h2('💡 Utilities & Bills'),
  bullet('Electricity: [Provider] — Account: [N] — Avg: $[Amount]/mo', 'Gas: [Provider] — Account: [N] — Avg: $[Amount]/mo', 'Water: [Provider] — Account: [N] — Avg: $[Amount]/mo', 'Internet: [Provider] — Account: [N] — $[Amount]/mo'),
  hr(),
  h2('🚨 Emergency Contacts'),
  bullet('Plumber: [Name] — [Phone]', 'Electrician: [Name] — [Phone]', 'HVAC: [Name] — [Phone]', 'Building manager: [Name] — [Phone]', 'Nearest hospital: [Name] — [Phone/Address]'),
);

// ══════════════════════════════════════════════════════════════════
// FULL TEMPLATE LIST
// ══════════════════════════════════════════════════════════════════

const G = (value: string): CoverConfig => ({ type: 'gradient', value, position: 50 });
const C = (value: string): CoverConfig => ({ type: 'color', value, position: 50 });

// ── All legacy/reused template content (must be before TEMPLATES array) ─────

const travelPlannerContent = doc(
  h2('✈️ Trip Overview'), p({ text: 'Destination: ', bold: true }, '[City, Country]'), p({ text: 'Dates: ', bold: true }, '[Arrival] → [Departure]'), p({ text: 'Budget: ', bold: true }, '$[Total]'), hr(),
  h2('📅 Day-by-day Itinerary'), h3('Day 1 — Arrival'), todo({ text: 'Check in to accommodation' }, { text: 'Explore the neighbourhood' }, { text: '[Dinner restaurant]' }),
  h2('🎒 Packing List'), todo({ text: 'Passport' }, { text: 'Travel insurance' }, { text: 'Phone + charger' }, { text: 'Adapters' }),
  h2('💳 Budget Breakdown'), bullet('Flights: $[amount]', 'Accommodation: $[amount]', 'Activities: $[amount]', 'Food: $[amount]'),
);
const readingListContent = doc(
  h2('📚 Book Library'), bullet('[Title] by [Author] — ⭐⭐⭐⭐⭐ — [Status]', '[Title] by [Author] — Currently reading', '[Title] by [Author] — Want to read'), hr(),
  h2('💬 Highlights & Quotes'), quote('"[Favourite quote]" — [Book], p.[N]'), hr(),
  h2('🎯 Reading Goals'), todo({ text: 'Read [N] books this year' }, { text: 'One book per month minimum' }),
);
const meetingNotesContent = doc(
  p({ text: 'Date: ', bold: true }, '[Date]  ·  ', { text: 'Attendees: ', bold: true }, '[Names]'), hr(),
  h2('📌 Agenda'), numbered('Topic 1 (10 min)', 'Topic 2 (15 min)', 'Topic 3 (10 min)'), hr(),
  h2('💬 Discussion'), p('[Notes…]'), hr(),
  h2('✅ Action Items'), todo({ text: '[@Owner] — [Action] by [Date]' }, { text: '[@Owner] — [Action] by [Date]' }),
);
const projectBriefContent = doc(
  callout('💡', 'Fill in all sections before sharing with stakeholders.'),
  h2('Overview'), p('[1–2 sentences describing what this project is and why it matters.]'),
  h2('Goals'), bullet('🎯 Goal 1 — measured by [metric]', '🎯 Goal 2 — measured by [metric]'),
  h2('Scope'), h3('In scope'), bullet('[Feature]'), h3('Out of scope'), bullet('[Exclusion]'),
  h2('Timeline'), numbered('Phase 1: Discovery', 'Phase 2: Build', 'Phase 3: Launch'),
);
const weeklyReviewContent = doc(
  h2('🏆 Wins this week'), bullet('[What went well]', '[Accomplishment]'),
  h2('😓 Challenges'), bullet('[What was hard]', '[Obstacle]'),
  h2('📚 Learnings'), bullet('[Insight]', '[Skill improved]'),
  h2('🔮 Next week priorities'), todo({ text: 'Top priority 1' }, { text: 'Top priority 2' }, { text: 'Top priority 3' }),
);
const oneOnOneContent = doc(
  p({ text: 'Date: ', bold: true }, '[Date]  ·  ', { text: 'With: ', bold: true }, '[Name]'), hr(),
  h2('👋 Check-in'), p('[How are you doing? Any blockers?]'),
  h2('🗣️ Their agenda'), bullet('[Topic they want to discuss]'),
  h2('📣 Your agenda'), bullet('[Feedback to give]', '[Project update]'),
  h2('✅ Action items'), todo({ text: '[@They]: [Action]' }, { text: '[@You]: [Action]' }),
);
const dailyJournalContent = doc(
  p({ text: '😊 Mood: ', bold: true }, '[ 😄 🙂 😐 😔 ]'), hr(),
  h2('🌅 Morning'), p({ text: 'Intention for today: ', bold: true }),
  p({ text: 'Grateful for: ', bold: true }), bullet('[Thing 1]', '[Thing 2]', '[Thing 3]'),
  h2('🌙 Evening'), p({ text: 'What went well: ', bold: true }), p({ text: 'What I would change: ', bold: true }),
);
const okrsContent = doc(
  p({ text: 'Quarter: ', bold: true }, 'Q[N] [Year]'), hr(),
  h2('🎯 Objective 1'), p({ text: 'Objective: ', bold: true }, '[Inspirational goal]'),
  todo({ text: 'KR1: [Outcome] — Target: [N]' }, { text: 'KR2: [Outcome] — Target: [N]' }),
  h2('🎯 Objective 2'), p({ text: 'Objective: ', bold: true }, '[Inspirational goal]'),
  todo({ text: 'KR1: [Outcome] — Target: [N]' }),
);
const bugReportContent = doc(
  p({ text: '🔴 Severity: ', bold: true }, 'Critical / High / Medium / Low'), hr(),
  h2('📝 Description'),
  h2('🔁 Steps to reproduce'), numbered('Go to [page]', 'Click [element]', 'Observe [what happens]'),
  h2('✅ Expected'), h2('❌ Actual'),
);
const productSpecContent = doc(
  p({ text: 'Status: ', bold: true }, 'Draft  ·  ', { text: 'Author: ', bold: true }, '[Name]'), hr(),
  h2('🎯 Problem'), p('[User problem being solved]'),
  h2('👤 User stories'), bullet('As a [user], I want to [action] so that [benefit]'),
  h2('✅ Acceptance criteria'), todo({ text: 'Given [context], when [action], then [result]' }),
);
const studyNotesContent = doc(
  p({ text: 'Course: ', bold: true }, '[Course]  ·  ', { text: 'Date: ', bold: true }, '[Date]'), hr(),
  h2('🎯 Learning objectives'), bullet('[By end I should understand…]'),
  h2('🗒️ Core concepts'), h3('Concept 1'), p('[Explanation in your own words]'),
  h2('❓ Questions'), bullet('[Question]'), h2('📖 Summary'), p('[3-sentence summary]'),
);

export const TEMPLATES: Template[] = [
  // ── Work ─────────────────────────────────────────────────────────────────
  { id: 'operations-sop',    name: 'Operations SOP',      description: 'SOPs, process tracker, incident log and team wiki',                    icon: '⚙️', category: 'Work',               cover: G('linear-gradient(135deg,#434343,#000)'),                        content: operationsSOP },
  { id: 'marketing-hub',     name: 'Marketing Hub',        description: 'Content calendar, campaigns, social media and brand assets',           icon: '📣', category: 'Work',               cover: G('linear-gradient(135deg,#f093fb,#f5576c)'),                     content: marketingHub },
  { id: 'design-studio',     name: 'Design Studio',        description: 'Design tracker, brand guidelines and component library',               icon: '🎨', category: 'Work',               cover: G('linear-gradient(135deg,#a18cd1,#fbc2eb)'),                     content: designStudio },
  { id: 'engineering-hub',   name: 'Engineering Hub',      description: 'Sprint board, bug tracker, docs and runbooks',                         icon: '⚙️', category: 'Work',               cover: G('linear-gradient(135deg,#4facfe,#00f2fe)'),                     content: engineeringHub },
  { id: 'product-roadmap',   name: 'Product Roadmap',      description: 'Roadmap, feature requests, PRDs and user research',                    icon: '🗺️', category: 'Work',               cover: G('linear-gradient(135deg,#43e97b,#38f9d7)'),                     content: productRoadmap },
  { id: 'startup-os',        name: 'Startup OS',           description: 'Investor CRM, fundraising pipeline, KPIs and hiring tracker',          icon: '🚀', category: 'Work',               cover: G('linear-gradient(135deg,#667eea,#764ba2)'),                     content: startupOs },
  { id: 'hr-central',        name: 'HR Central',           description: 'Employee directory, onboarding, performance reviews, job board',       icon: '👥', category: 'Work',               cover: G('linear-gradient(135deg,#fa709a,#fee140)'),                     content: hrCentral },
  { id: 'sales-crm',         name: 'Sales CRM',            description: 'Pipeline, contacts, deals, meeting log and email templates',           icon: '💼', category: 'Work',               cover: G('linear-gradient(135deg,#11998e,#38ef7d)'),                     content: salesCrm },
  { id: 'meeting-hub',       name: 'Meeting Hub',          description: 'Recurring meeting logs, standup template and 1:1 tracker',             icon: '📋', category: 'Work',               cover: G('linear-gradient(135deg,#764ba2,#667eea)'),                     content: meetingHub },
  { id: 'company-wiki',      name: 'Company Wiki',         description: 'Department pages, getting started guide and FAQ',                      icon: '📚', category: 'Work',               cover: G('linear-gradient(135deg,#f7971e,#ffd200)'),                     content: companyWiki },

  // ── School ────────────────────────────────────────────────────────────────
  { id: 'study-planner',     name: 'Study Planner',        description: 'Semester overview, assignments, exams and grade tracker',              icon: '📐', category: 'School',             cover: G('linear-gradient(135deg,#d4fc79,#96e6a1)'),                     content: studyPlanner },
  { id: 'student-dashboard', name: 'Student Dashboard',    description: 'Your class schedule, deadlines, notebooks and habits',                 icon: '🎓', category: 'School',             cover: G('linear-gradient(135deg,#89f7fe,#66a6ff)'),                     content: studentDashboard },
  { id: 'class-notes',       name: 'Class Notes',          description: 'Cornell notes format, lecture templates and review schedule',          icon: '📓', category: 'School',             cover: G('linear-gradient(135deg,#a1c4fd,#c2e9fb)'),                     content: classNotes },
  { id: 'career-builder',    name: 'Career Builder',       description: 'Resume, job applications, interview prep and networking',              icon: '💼', category: 'School',             cover: G('linear-gradient(135deg,#ffecd2,#fcb69f)'),                     content: careerBuilder },
  { id: 'teaching-toolkit',  name: 'Teaching Toolkit',     description: 'Lesson plans, student roster, grading and curriculum map',            icon: '📐', category: 'School',             cover: G('linear-gradient(135deg,#fddb92,#d1fdff)'),                     content: teachingToolkit },

  // ── Life ──────────────────────────────────────────────────────────────────
  { id: 'personal-productivity', name: 'Personal Productivity', description: 'GTD-style inbox, daily planner, projects and weekly review',      icon: '⚡', category: 'Life',               cover: G('linear-gradient(135deg,#f6d365,#fda085)'),                     content: personalProductivity },
  { id: 'budget-finance',    name: 'Budget & Finance',     description: 'Monthly budget, transaction log, savings goals and subscriptions',     icon: '💰', category: 'Life',               cover: G('linear-gradient(135deg,#11998e,#38ef7d)'),                     content: budgetFinance },
  { id: 'habit-tracker',     name: 'Habit Tracker',        description: 'Daily habits, streak counter, weekly progress and monthly review',     icon: '✅', category: 'Life',               cover: G('linear-gradient(135deg,#43e97b,#38f9d7)'),                     content: habitTracker },
  { id: 'fitness-log',       name: 'Health & Fitness',     description: 'Workout log, body measurements, sleep tracker and personal records',   icon: '💪', category: 'Life',               cover: G('linear-gradient(135deg,#f093fb,#f5576c)'),                     content: fitnessLog },
  { id: 'travel-planner',    name: 'Travel Planner',       description: 'Trip itinerary, packing list, budget breakdown and bucket list',       icon: '✈️', category: 'Life',               cover: G('linear-gradient(135deg,#89f7fe,#66a6ff)'),                     content: travelPlannerContent },
  { id: 'reading-list',      name: 'Reading List',         description: 'Books database with ratings, quotes and reading goals',                icon: '📚', category: 'Life',               cover: G('linear-gradient(135deg,#a18cd1,#fbc2eb)'),                     content: readingListContent },
  { id: 'journal',           name: 'Journal',              description: 'Daily entries, mood tracker, gratitude and monthly reviews',           icon: '✍️', category: 'Life',               cover: G('linear-gradient(135deg,#f6d365,#fda085)'),                     content: journal },
  { id: 'meal-planner',      name: 'Meal Planner',         description: 'Weekly meal plan, recipe library and grocery list',                    icon: '🍽️', category: 'Life',               cover: G('linear-gradient(135deg,#fa709a,#fee140)'),                     content: mealPlanner },
  { id: 'entertainment',     name: 'Entertainment Tracker',description: 'Movies, shows, books, games and podcasts all in one place',            icon: '🎬', category: 'Life',               cover: G('linear-gradient(135deg,#434343,#000)'),                        content: entertainmentTracker },
  { id: 'wedding-planner',   name: 'Wedding Planner',      description: 'Master checklist, guest list, vendor tracker and budget',              icon: '💍', category: 'Life',               cover: G('linear-gradient(135deg,#ffecd2,#fcb69f)'),                     content: weddingPlanner },
  { id: 'home-manager',      name: 'Home Manager',         description: 'Chores, maintenance log, home inventory and utility bills',            icon: '🏠', category: 'Life',               cover: G('linear-gradient(135deg,#667eea,#764ba2)'),                     content: homeManager },

  // ── Project Management ────────────────────────────────────────────────────
  { id: 'meeting-notes',     name: 'Meeting Notes',        description: 'Capture agenda, discussion points and action items',                   icon: '📋', category: 'Project Management', cover: G('linear-gradient(135deg,#667eea,#764ba2)'),                     content: meetingNotesContent },
  { id: 'project-brief',     name: 'Project Brief',        description: 'Define scope, goals, timeline and stakeholders',                       icon: '🚀', category: 'Project Management', cover: G('linear-gradient(135deg,#4facfe,#00f2fe)'),                     content: projectBriefContent },
  { id: 'weekly-review',     name: 'Weekly Review',        description: 'Reflect on wins, challenges, learnings and plan next week',            icon: '🗓️', category: 'Project Management', cover: G('linear-gradient(135deg,#43e97b,#38f9d7)'),                     content: weeklyReviewContent },
  { id: 'one-on-one',        name: '1:1 Meeting',          description: 'Structured template for manager and direct report',                    icon: '🤝', category: 'Project Management', cover: G('linear-gradient(135deg,#fa709a,#fee140)'),                     content: oneOnOneContent },
  { id: 'daily-journal',     name: 'Daily Journal',        description: 'Morning intentions and evening reflection',                            icon: '✍️', category: 'Project Management', cover: G('linear-gradient(135deg,#f6d365,#fda085)'),                     content: dailyJournalContent },
  { id: 'okrs',              name: 'OKRs',                 description: 'Objectives and Key Results for the quarter',                           icon: '🎯', category: 'Project Management', cover: G('linear-gradient(135deg,#fddb92,#d1fdff)'),                     content: okrsContent },
  { id: 'bug-report',        name: 'Bug Report',           description: 'Document bugs with steps to reproduce and severity',                   icon: '🐛', category: 'Project Management', cover: C('#C4403D'),                                                     content: bugReportContent },
  { id: 'product-spec',      name: 'Product Spec',         description: 'Feature specification with user stories and acceptance criteria',       icon: '📐', category: 'Project Management', cover: G('linear-gradient(135deg,#89dceb,#66a6ff)'),                     content: productSpecContent },
  { id: 'study-notes',       name: 'Study Notes',          description: 'Structured lecture and study material capture',                        icon: '🎓', category: 'Project Management', cover: G('linear-gradient(135deg,#d4fc79,#96e6a1)'),                     content: studyNotesContent },
];

export const TEMPLATE_CATEGORIES: { label: TemplateCategory; icon: string; count: number }[] = [
  { label: 'Work',               icon: '💼', count: TEMPLATES.filter((t) => t.category === 'Work').length },
  { label: 'School',             icon: '🎓', count: TEMPLATES.filter((t) => t.category === 'School').length },
  { label: 'Life',               icon: '🌿', count: TEMPLATES.filter((t) => t.category === 'Life').length },
  { label: 'Project Management', icon: '📊', count: TEMPLATES.filter((t) => t.category === 'Project Management').length },
];
