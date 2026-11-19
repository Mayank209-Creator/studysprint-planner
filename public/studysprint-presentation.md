# StudySprint — presentation notes

## The problem and who it helps

Students often keep deadlines in different places, making it easy to overlook what is due next. StudySprint gives students one simple place to list assignments, see today's and upcoming work, and mark progress as they go. It is designed for an individual student and keeps tasks on the current browser and device; it does not sync to other devices.

## One-minute demo script

“This is StudySprint, a lightweight planner for students. The sample assignments make the dashboard ready to explore: I can see what is due today, what is coming up, and what I have completed. I’ll add a task called ‘Prepare lab notes’ for Biology, choose a due date and priority, and save it. It appears in my task list and updates the dashboard. Now I can mark it complete, switch between all tasks, to-do, and done, and edit or delete a task if plans change. Finally, I’ll refresh the page. The new task is still here because StudySprint saves on this browser. This version is intentionally local-only, so it does not sync between devices.”

## Five likely lecturer questions

1. **Where are tasks stored?** In this browser's local storage on this device. This demo has no account or online database, so tasks do not sync across devices.
2. **What happens when I refresh?** The app reads the saved tasks from the browser and shows them again.
3. **Can I change or remove a task?** Yes. Each task has controls to edit its details, mark it complete, or delete it.
4. **Does it need the internet or a paid service?** No external service or login is required to use the task app after it loads.
5. **What would you add next?** Optional accounts and a secure shared database could enable backup and syncing between a student's devices.

## How another student could build a similar app

1. Sketch the dashboard and decide what information a task needs: title, subject, due date, priority, and completion status.
2. Create the task form, list, and dashboard totals using a frontend framework such as React.
3. Add the core actions: create, edit, complete, delete, and filter tasks.
4. Save and load the task list from browser local storage; handle an empty or invalid saved list gracefully.
5. Add clearly labeled sample tasks, test the counts and filters, then try the add–complete–filter–refresh demo on both a phone-sized and desktop screen.

## Run locally

From the project folder, install dependencies with `bun install`, then start the preview with `bun run dev`. Open the local address printed in the terminal. Node.js with npm can also run this project using `npm install` followed by `npm run dev`.