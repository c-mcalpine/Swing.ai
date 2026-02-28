# What Triggers the Daily Plan to Populate

## Short answer

**A completed swing analysis** (record a new swing → analysis runs → curriculum is built).  
“Swing review” (Review tab) does **not** build the curriculum. You need to **record and analyze a new swing** from the Capture flow.

## Flow

1. **You record a swing**  
   Capture → record video → upload → app calls `analyzeSwing(captureId)` and waits.

2. **Swing-analysis edge function runs**  
   - Saves analysis (e.g. `issue_scores`) to `swing_analysis`.  
   - Calls **`build_curriculum_queue(capture_id)`**.

3. **`build_curriculum_queue` (DB function)**  
   - Reads **only** `issue_scores` from that analysis (not `recommended_lesson_ids` / `recommended_drill_ids`).  
   - For each issue slug in the JSONB, finds `swing_error` (by slug) and **any `lesson` where `lesson.primary_error_id = swing_error.id`**.  
   - Inserts into **`user_curriculum_queue`** only when that join returns a row. If no lesson targets that error, that slug adds **no** queue row.  
   - Sets one lesson to `active` and returns.

4. **Daily plan (edge function)**  
   - Does **not** write anything.  
   - When the app calls **getDailyPlan**, it **reads** `user_curriculum_queue` and returns `active_lesson` + items (lesson + drills from `drill_error` for those issues).

So: **content appears only after at least one swing has been analyzed** and your DB has lessons (and optionally drills) that match the analysis issue slugs.

**Slug alignment:** The swing-analysis edge function fetches `swing_error.slug` and `swing_mechanic.slug` from the DB and injects them into the AI prompt. The model must use only those slugs as keys in `issue_scores` and `mechanic_scores`. Parsed output is filtered so only keys that exist in the DB are persisted, so `build_curriculum_queue` (which joins on `swing_error.slug`) always sees matching slugs.

## If nothing shows up

1. **Do a new swing capture**  
   Not “swing review”. Go to Capture → record a swing and wait until analysis finishes (you can then land on the Analysis screen). That run triggers `build_curriculum_queue`.

2. **Queue empty = no lesson targets your issues**  
   The queue only gets rows when **for at least one slug in `issue_scores`** there is a **lesson** with `primary_error_id` = that `swing_error.id`.  
   - Check: `SELECT id, slug FROM swing_error;` and `SELECT id, title, primary_error_id FROM lesson;`.  
   - If every `lesson.primary_error_id` is NULL (or points to an error that’s not in your `issue_scores`), the queue stays empty.  
   - Fix: set `primary_error_id` on at least one lesson to a `swing_error.id` whose `slug` appears in your analyses (e.g. `over-the-top`, `casting`). See `database-records/scripts/ensure_curriculum_lesson.sql` for a runnable fix.

3. **Deploy the daily-plan function**  
   The Quick Drills and “first lesson” behavior use the updated **daily-plan** edge function. Deploy it so the app gets the new response shape and logic.

4. **Avoid stale cache**  
   Restart the app or pull-to-refresh on Home so the app refetches the daily plan.

## Summary

| Trigger              | What it does |
|----------------------|--------------|
| **New swing analyzed** | Fills `user_curriculum_queue` (if lessons exist for those issues). |
| **Opening Home / refetch** | Calls getDailyPlan and shows whatever is in the queue (active lesson + drills). |

So: **yes, you need to do another swing (record + analyze) for the curriculum to be built.** After that, Today’s Practice and Quick Drills will show as long as the DB has matching lessons and (for drills) `drill_error` rows, and the daily-plan function is deployed.
