import { readStorage, writeStorage, STORAGE_KEYS } from "./storage.js";

function completeTask(id) {
  const tasks = readStorage(STORAGE_KEYS.tasks);

  const task = tasks.find((task) => task.id === id);

  if (!task) return;

  task.completed = true;

  writeStorage(STORAGE_KEYS.tasks, tasks);

  renderSavedTasks();
  renderDoneTasks();
}

document.addEventListener("change", (event) => {
  if (!event.target.classList.contains("task-check")) return;

  if (!event.target.checked) return;

  const article = event.target.closest("article");
  const id = article.dataset.id;

  completeTask(id);
});
