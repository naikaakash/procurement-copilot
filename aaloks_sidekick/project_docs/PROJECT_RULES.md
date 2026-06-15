# 📐 Project Execution Rules

These rules represent Aalok's non-negotiable coding guardrails.

1. **No direct CSV/database reading in UI pages**: All data operations must live in the service/data layer.
2. **Full Page Scrolling**: Never lock the main window's scroll list in layout viewports.
3. **Dynamic filter dropdown lists**: Dropdown arrays must query endpoints, not be hardcoded in client select options.
4. **No LLMs in read-only visualizers**: Explicitly block chatbot additions during early stages.
