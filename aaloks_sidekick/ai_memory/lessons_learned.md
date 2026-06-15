# 🎓 Lessons Learned

*A record of patterns that failed and operational adjustments made.*

### ⚠️ Mistakes to Avoid
1. **Constrained Inner Viewports**: Placing a table inside a restricted flex container without window scrollbars causes major usability issues on high-resolution screens. Always allow full window scrolling and make the side drawer fixed.
2. **Direct CSV/File Parsing in UI**: Putting parser logic inside Next.js components leads to massive code rewrites when moving to PostgreSQL. Keep the UI entirely dumb to the storage medium.
3. **Vague Reference Dates**: Supply chain datasets often use static sample dates (e.g., `2026-05-28`). Without setting a static `TODAY_DATE` baseline, relative calculations yield inaccurate results.

### ✅ What Worked Well
1. **Dynamic Dropdowns**: Sourcing filter bar inputs (plants, suppliers) dynamically from the dataset rather than hardcoding select lists.
2. **Locked Phase Actions**: Adding lock icons and "Phase 1B Feature" tags to out-of-scope buttons prevents scope creep while keeping the workbench interface looking mature.
