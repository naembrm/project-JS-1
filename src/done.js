const doneList = document.getElementById("done-list");

document.querySelectorAll(".task-check").forEach((check) => {
  check.addEventListener("change", function () {
    if (!this.checked) return;

    const article = this.closest("article");

    const title = article.querySelector("h2").textContent;
    const color = article.querySelector("span").className;

    const newTask = document.createElement("div");

    newTask.className = "task-card relative";

    newTask.innerHTML = `
      <div
        class="flex items-center justify-between gap-3 bg-white h-[80px] p-4 shadow-sm dark:bg-[#121c29] rounded-xl"
      >
<span class="${color}"></span>
        <input class="ml-2" type="checkbox" checked>

        <p class="flex-1 text-right line-through text-gray-400 dark:text-Neutral-8">
          ${title}
        </p>

        <button>
          <svg
            width="4"
            height="18"
            viewBox="0 0 4 18"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            class="w-2 h-6 dark:text-Neutral-8"
          >
            <circle cx="2" cy="2" r="2"/>
            <circle cx="2" cy="9" r="2"/>
            <circle cx="2" cy="16" r="2"/>
          </svg>
        </button>

      </div>
    `;

    doneList.prepend(newTask);

    article.remove();
  });
});
