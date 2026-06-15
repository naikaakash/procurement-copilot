export type ModuleStatus = 'enabled' | 'not_configured' | 'future_capability' | 'experimental';

export interface ModuleConfig {
  key: string;
  label: string;
  icon: string;
  group: 'workbench' | 'ai_platform';
  enabled: boolean;
  status: ModuleStatus;
  description: string;
  prerequisiteNote?: string;
}

export const MODULE_CONFIGS: ModuleConfig[] = [
  // --- WORKBENCH GROUP ---
  {
    key: 'overview',
    label: 'Executive Overview',
    icon: '📊',
    group: 'workbench',
    enabled: true,
    status: 'enabled',
    description: 'High-level dashboard highlighting active spend, critical overdue lines, stock risk, and supplier counts.'
  },
  {
    key: 'overdue',
    label: 'Overdue PO Workbench',
    icon: '⏳',
    group: 'workbench',
    enabled: true,
    status: 'enabled',
    description: 'Core buyer worklist highlighting overdue PO schedule lines with granular filters and direct actions.'
  },
  {
    key: 'acknowledgement',
    label: 'Supplier Acks',
    icon: '🤝',
    group: 'workbench',
    enabled: true,
    status: 'enabled',
    description: 'Workspace identifying missing acknowledgements, late commitments, or price disputes.'
  },
  {
    key: 'recommendations',
    label: 'Recommendation Worklist',
    icon: '📋',
    group: 'workbench',
    enabled: true,
    status: 'enabled',
    description: 'Buyer-facing worklist displaying purchase order recommendations and sync verification statuses.'
  },
  {
    key: 'part',
    label: 'Part Availability',
    icon: '📦',
    group: 'workbench',
    enabled: false,
    status: 'not_configured',
    description: 'Inventory and part availability shortage workbench.',
    prerequisiteNote: 'Requires material requirements planning (MRP) live feed integration.'
  },
  {
    key: 'supplier-analytics',
    label: 'Supplier Analytics',
    icon: '🏭',
    group: 'workbench',
    enabled: true,
    status: 'enabled',
    description: 'Supplier scorecards detailing on-time delivery percentages, tier status, and compliance risks.'
  },
  {
    key: 'exception-analytics',
    label: 'Exception Analytics',
    icon: '📈',
    group: 'workbench',
    enabled: false,
    status: 'not_configured',
    description: 'Granular statistics and visual breakdown of exceptions by plant, buyer, and category.',
    prerequisiteNote: 'Requires analytics reporting pipeline configuration.'
  },
  {
    key: 'buyer-productivity',
    label: 'Buyer Productivity',
    icon: '🎯',
    group: 'workbench',
    enabled: false,
    status: 'not_configured',
    description: 'Historical logging of buyer activities, task checklists, and follow-up metrics.',
    prerequisiteNote: 'Requires team collaboration database implementation.'
  },
  {
    key: 'control-tower',
    label: 'Control Tower',
    icon: '🎛️',
    group: 'workbench',
    enabled: false,
    status: 'not_configured',
    description: 'Admin hub checking ERP integration health, static connection data, and import configurations.',
    prerequisiteNote: 'Requires ERP/SAP backend connection setup.'
  },
  
  // --- AI PLATFORM GROUP ---
  {
    key: 'copilot',
    label: 'AI Sourcing Copilot',
    icon: '🤖',
    group: 'ai_platform',
    enabled: true,
    status: 'enabled',
    description: 'Interactive AI chatbot assisting buyers with sourcing questions and contract reviews.',
    prerequisiteNote: 'Requires LLM API key and retrieval-augmented generation (RAG) knowledge base.'
  },
  {
    key: 'reminders',
    label: 'Automated Reminders',
    icon: '⚡',
    group: 'ai_platform',
    enabled: false,
    status: 'future_capability',
    description: 'Automated supplier follow-up email reminder generation and draft queues.',
    prerequisiteNote: 'Requires outbound email gateway approval.'
  },
  {
    key: 'collaboration',
    label: 'Planner Collaboration',
    icon: '🤝',
    group: 'ai_platform',
    enabled: false,
    status: 'future_capability',
    description: 'Internal thread coordinator facilitating buyer-planner chats and updates.',
    prerequisiteNote: 'Requires internal chat server configurations.'
  },
  {
    key: 'workflow-pipeline',
    label: 'Multi-Agent Pipeline',
    icon: '⛓️',
    group: 'ai_platform',
    enabled: false,
    status: 'future_capability',
    description: 'Multi-agent pipeline displaying autonomous action proposals and approval flows.',
    prerequisiteNote: 'Requires multi-agent simulation server integration.'
  },
  {
    key: 'autonomous-monitoring',
    label: 'Autonomous Monitor',
    icon: '🛰️',
    group: 'ai_platform',
    enabled: false,
    status: 'future_capability',
    description: 'Background scanning registry logs showing detected discrepancies and system anomalies.',
    prerequisiteNote: 'Requires scheduler daemon activation.'
  }
];
