(() => {
  "use strict";

  const STORAGE_KEYS = {
    draft: "quera-task-draft",
    tasks: "quera-saved-tasks",
  };

  const PRIORITIES = {
    high: {
      label: "بالا",
      chipBackground: "#ffe2db",
      chipText: "#ff5f37",
      indicatorClass: "bg-Errors",
      badgeClass: "bg-Errors/10 text-Errors",
    },
    medium: {
      label: "متوسط",
      chipBackground: "#fff4df",
      chipText: "#ffaf37",
      indicatorClass: "bg-[#FFAF37]",
      badgeClass: "bg-[#FFAF37]/10 text-[#FFAF37]",
    },
    low: {
      label: "پایین",
      chipBackground: "#dff7ec",
      chipText: "#00a878",
      indicatorClass: "bg-Success",
      badgeClass: "bg-Success/20 text-Success",
    },
  };

  function readStorage(key, fallbackValue) {
    try {
      const savedValue = localStorage.getItem(key);
      return savedValue ? JSON.parse(savedValue) : fallbackValue;
    } catch (error) {
      console.warn(`خطا در خواندن ${key} از localStorage`, error);
      return fallbackValue;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`خطا در ذخیره ${key} در localStorage`, error);
    }
  }

  function createTaskId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function toPersianDigits(num) {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (d) => persianDigits[d]);
  }

  function initializeTaskForm() {
    const todoList = document.getElementById("todo-list");
    const titleField = document.getElementById("task-name-field");
    const descriptionField = document.getElementById("task-description-field");
    const addTaskButton = document.getElementById("add-task-button");
    const showFormButton = document.getElementById("show-task-form-button");
    const doneList = document.getElementById("done-list");
    const emptyState = document.getElementById("empty-state");
    const remainingTaskCount = document.getElementById("remaining-task-count");
    const doneCountText = document.getElementById("done-count-text");
    const prioritySelector = document.getElementById("priority-selector");
    const tagButton = document.getElementById("tag-button");

    if (tagButton && prioritySelector) {
      tagButton.addEventListener("click", () => {
        prioritySelector.classList.toggle("hidden");
      });
    }

    if (
      !todoList ||
      !titleField ||
      !descriptionField ||
      !prioritySelector ||
      !addTaskButton
    ) {
      console.error("المان‌های فرم ثبت تسک پیدا نشدند.");
      return;
    }

    const formCard = addTaskButton.parentElement
      ? addTaskButton.parentElement.parentElement
      : null;

    function showTaskForm() {
      if (!formCard) return;

      formCard.classList.remove("hidden");
      formCard.classList.add("flex");
      emptyState.classList.add("hidden");
      if (showFormButton) {
        showFormButton.classList.remove("flex");
        showFormButton.classList.add("hidden");
      }
    }

    function hideTaskForm() {
      if (!formCard) return;

      formCard.classList.remove("flex");
      formCard.classList.add("hidden");

      if (showFormButton) {
        showFormButton.classList.remove("hidden");
        showFormButton.classList.add("flex");
      }
    }

    const originalPriorityHTML = prioritySelector.innerHTML;
    const originalPriorityClass = prioritySelector.className;
    const originalPriorityDirection =
      prioritySelector.getAttribute("dir") || "ltr";

    let selectedPriority = null;
    let tasks = readStorage(STORAGE_KEYS.tasks, []);

    if (!Array.isArray(tasks)) {
      tasks = [];
    }

    function normalizeText(value) {
      return String(value || "")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function getEditableValue(field) {
      const value = normalizeText(field.textContent);
      return value === field.dataset.placeholder ? "" : value;
    }

    function setEditableValue(field, value) {
      field.textContent = value || field.dataset.placeholder || "";
    }

    function getCurrentDraft() {
      return {
        title: getEditableValue(titleField),
        description: getEditableValue(descriptionField),
        priority: selectedPriority,
      };
    }

    function saveDraft() {
      writeStorage(STORAGE_KEYS.draft, getCurrentDraft());
    }

    function isFormComplete() {
      return Boolean(getEditableValue(titleField) && selectedPriority);
    }

    function updateAddButton() {
      const isActive = isFormComplete();

      addTaskButton.disabled = !isActive;
      addTaskButton.setAttribute("aria-disabled", String(!isActive));
      addTaskButton.classList.toggle("opacity-60", !isActive);
      addTaskButton.classList.toggle("opacity-100", isActive);
      addTaskButton.style.backgroundColor = isActive ? "#007bff" : "";
    }

    function showPriorityOptions() {
      prioritySelector.className = originalPriorityClass;
      prioritySelector.setAttribute("dir", originalPriorityDirection);
      prioritySelector.removeAttribute("style");
      prioritySelector.innerHTML = originalPriorityHTML;
      prioritySelector.classList.add("hidden");
    }

    function showSelectedPriority(priority) {
      const priorityData = PRIORITIES[priority];
      if (!priorityData) return;

      // از استایل مستقیم استفاده می‌شود تا باکس حتی بدون rebuild شدن Tailwind
      // فقط به اندازه محتوای خودش عرض داشته باشد و طراحی اصلی حفظ شود
      prioritySelector.className = "";
      prioritySelector.setAttribute("dir", "rtl");
      Object.assign(prioritySelector.style, {
        display: "inline-flex",
        width: "fit-content",
        maxWidth: "100%",
        flex: "0 0 auto",
        alignSelf: "flex-end",
        marginLeft: "auto",
        marginRight: "0",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.25rem 0.5rem",
        borderRadius: "0.125rem",
        border: "0",
        boxShadow: "none",
        backgroundColor: priorityData.chipBackground,
      });

      prioritySelector.innerHTML = `
        <div data-clear-priority data-svg-wrapper data-style="2-shade" class="relative" role="button" tabindex="0" aria-label="حذف اولویت">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4L8 8M8 8L12 12M8 8L12 4M8 8L4 12" stroke="var(--Labels---Vibrant-Primary, #1A1A1A)" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="text-right justify-center text-sm font-semibold font-['Yekan_Bakh']" style="color: ${priorityData.chipText}">
          ${priorityData.label}
        </div>
      `;
    }

    function selectPriority(priority, shouldSave = true) {
      if (!Object.prototype.hasOwnProperty.call(PRIORITIES, priority)) {
        return;
      }

      selectedPriority = priority;
      showSelectedPriority(priority);

      if (shouldSave) saveDraft();
      updateAddButton();
    }

    function clearPriority(shouldSave = true) {
      selectedPriority = null;
      showPriorityOptions();

      if (shouldSave) saveDraft();
      updateAddButton();
    }

    function createMoreButton(task) {
      const wrapper = document.createElement("div");
      wrapper.className = "relative";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "p-1 text-Neutral-5 hover:bg-Neutral-7 rounded-md";

      button.innerHTML = `
    <svg 
      width="3" 
      height="14" 
      viewBox="0 0 4 18" 
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      class="w-1 h-4"
    >
      <circle cx="2" cy="2" r="1.5" fill="currentColor" />
      <circle cx="2" cy="9" r="1.5" fill="currentColor" />
      <circle cx="2" cy="16" r="1.5" fill="currentColor" />
    </svg>
  `;

      const menu = document.createElement("div");

      menu.className =
        "hidden absolute left-0 top-7 z-20 flex items-center gap-2 rounded-lg border border-Neutral-7 bg-white px-2 py-1 shadow-md dark:bg-[#121c29]";

      menu.innerHTML = `
  <button 
    data-edit 
    type="button"
    class="flex size-7 items-center justify-center rounded-md hover:bg-Neutral-7"
  >
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="text-Neutral-5"
    >
      <path
        d="M4 20H8L19 9C20.1 7.9 20.1 6.1 19 5C17.9 3.9 16.1 3.9 15 5L4 16V20Z"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>

  <span class="h-5 w-px bg-Neutral-7"></span>

  <button 
    data-delete 
    type="button"
    class="flex size-7 items-center justify-center rounded-md hover:bg-Neutral-7"
  >
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="text-Neutral-5"
    >
      <path
        d="M6 7H18M10 11V17M14 11V17M9 7V5C9 4.4 9.4 4 10 4H14C14.6 4 15 4.4 15 5V7M8 7L9 20H15L16 7"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
`;

      button.addEventListener("click", (event) => {
        event.stopPropagation();

        menu.classList.toggle("hidden");
      });

      menu.querySelector("[data-delete]").addEventListener("click", () => {
        tasks = tasks.filter((savedTask) => savedTask.id !== task.id);

        writeStorage(STORAGE_KEYS.tasks, tasks);
        renderSavedTasks();
      });

      menu.querySelector("[data-edit]").addEventListener("click", () => {
        titleField.textContent = task.title;
        descriptionField.textContent = task.description;

        selectPriority(task.priority);

        tasks = tasks.filter((savedTask) => savedTask.id !== task.id);

        writeStorage(STORAGE_KEYS.tasks, tasks);

        showTaskForm();
        menu.classList.add("hidden");
      });

      wrapper.append(button, menu);

      return wrapper;
    }

    function createTaskCard(task, completed) {
      const priorityData = PRIORITIES[task.priority] || PRIORITIES.medium;
      const article = document.createElement("article");

      article.dataset.savedTask = "true";
      article.dataset.taskId = task.id;
      article.className =
        "relative flex min-h-[108px] w-full items-start justify-between gap-4 overflow-hidden rounded-xl border border-Neutral-7 bg-Neutral-11 py-6 pr-6 pl-5 dark:border-Neutral-Dark-3 dark:bg-[#121c29]";

      const indicator = document.createElement("span");
      indicator.className = `absolute inset-y-3 right-0 w-1 rounded-l-lg ${priorityData.indicatorClass}`;

      const content = document.createElement("div");
      content.className = "flex min-w-0 items-start gap-4";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(completed);
      checkbox.className = "task-check mt-0.5 size-5";

      const textContainer = document.createElement("div");
      textContainer.className = "flex min-w-0 flex-col items-start gap-2.5";

      const headingGroup = document.createElement("div");
      headingGroup.className = "flex flex-col flex-wrap items-start gap-3";

      const title = document.createElement("h2");
      title.className =
        "task-title text-base font-bold text-Neutral-2 dark:text-on-background-Dark";
      title.textContent = task.title;

      const badge = document.createElement("span");
      badge.className = `rounded-sm px-2 py-0.5 text-xs font-semibold ${priorityData.badgeClass}`;
      badge.textContent = priorityData.label;

      const description = document.createElement("p");
      description.className =
        "text-sm font-normal text-Neutral-3 dark:text-Neutral-Dark-5";
      description.textContent = task.description;

      if (completed) {
        title.classList.add("line-through", "opacity-60");
        description.classList.add("line-through", "opacity-60");
      }

      headingGroup.append(title, badge);
      textContainer.append(headingGroup, description);
      content.append(checkbox, textContainer);
      article.append(indicator, content, createMoreButton(task));

      checkbox.addEventListener("change", (event) => {
        event.stopImmediatePropagation();

        tasks = tasks.map((savedTask) =>
          savedTask.id === task.id
            ? { ...savedTask, completed: checkbox.checked }
            : savedTask,
        );

        writeStorage(STORAGE_KEYS.tasks, tasks);
        renderSavedTasks();
      });

      return article;
    }

    function updateRemainingCount() {
      if (!remainingTaskCount) return;

      const remainingCount = todoList.querySelectorAll(
        "article .task-check:not(:checked)",
      ).length;

      remainingTaskCount.textContent = `${remainingCount} `;
    }

    function updateDoneCount() {
      if (!doneCountText) return;

      const doneCount = tasks.filter((task) => task.completed).length;

      doneCountText.textContent =
        doneCount === 0
          ? "هنوز تسکی انجام نشده است."
          : `${toPersianDigits(doneCount)} تسک انجام شده است.`;
    }

    function renderSavedTasks() {
      document
        .querySelectorAll('[data-saved-task="true"]')
        .forEach((taskCard) => taskCard.remove());

      const activeTasks = tasks.filter((task) => !task.completed);
      const completedTasks = tasks.filter((task) => task.completed);

      if (formCard) {
        [...activeTasks].reverse().forEach((task) => {
          formCard.insertAdjacentElement(
            "afterend",
            createTaskCard(task, false),
          );
        });
      }

      if (doneList) {
        completedTasks.forEach((task) => {
          doneList.append(createTaskCard(task, true));
        });
      }

      if (emptyState) {
        const hasActiveTasks = activeTasks.length > 0;
        emptyState.classList.toggle("hidden", hasActiveTasks);
        emptyState.classList.toggle("flex", !hasActiveTasks);
      }

      updateRemainingCount();
      updateDoneCount();
    }

    function resetForm() {
      setEditableValue(titleField, "");
      setEditableValue(descriptionField, "");
      clearPriority(false);
      writeStorage(STORAGE_KEYS.draft, {
        title: "",
        description: "",
        priority: null,
      });
      updateAddButton();
    }

    function addTask(event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (!isFormComplete()) return;

      const task = {
        id: createTaskId(),
        title: getEditableValue(titleField),
        description: getEditableValue(descriptionField),
        priority: selectedPriority,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      tasks.unshift(task);
      writeStorage(STORAGE_KEYS.tasks, tasks);
      renderSavedTasks();
      resetForm();
      hideTaskForm();
    }

    function prepareEditableField(field) {
      field.addEventListener("focus", () => {
        if (!getEditableValue(field)) {
          field.textContent = "";
        }
      });

      field.addEventListener("input", () => {
        saveDraft();
        updateAddButton();
      });

      field.addEventListener("blur", () => {
        if (!getEditableValue(field)) {
          setEditableValue(field, "");
        }

        saveDraft();
        updateAddButton();
      });

      field.addEventListener("paste", (event) => {
        event.preventDefault();
        const pastedText = event.clipboardData
          ? event.clipboardData.getData("text/plain")
          : "";

        if (typeof document.execCommand === "function") {
          document.execCommand("insertText", false, pastedText);
        } else {
          field.textContent += pastedText;
        }
      });
    }

    prepareEditableField(titleField);
    prepareEditableField(descriptionField);

    titleField.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        descriptionField.focus();
      }
    });

    prioritySelector.addEventListener(
      "click",
      (event) => {
        const clearButton = event.target.closest("[data-clear-priority]");
        if (clearButton) {
          clearPriority();
          return;
        }

        const priorityOption = event.target.closest("[data-priority]");
        if (priorityOption) {
          selectPriority(priorityOption.dataset.priority);
        }
      },
      true,
    );

    prioritySelector.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      const clearButton = event.target.closest("[data-clear-priority]");
      const priorityOption = event.target.closest("[data-priority]");

      if (clearButton) {
        event.preventDefault();
        clearPriority();
      } else if (priorityOption) {
        event.preventDefault();
        selectPriority(priorityOption.dataset.priority);
      }
    });

    addTaskButton.addEventListener("click", addTask, true);

    document.addEventListener("change", (event) => {
      if (event.target.matches("#todo-list article .task-check")) {
        window.setTimeout(updateRemainingCount, 0);
      }
    });

    const draft = readStorage(STORAGE_KEYS.draft, {});

    setEditableValue(
      titleField,
      typeof draft.title === "string" ? draft.title : "",
    );
    setEditableValue(
      descriptionField,
      typeof draft.description === "string" ? draft.description : "",
    );

    if (
      draft.priority &&
      Object.prototype.hasOwnProperty.call(PRIORITIES, draft.priority)
    ) {
      selectPriority(draft.priority, false);
    } else {
      clearPriority(false);
    }

    renderSavedTasks();
    updateAddButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeTaskForm, {
      once: true,
    });
  } else {
    initializeTaskForm();
  }
})();
const showTaskFormButton = document.getElementById("show-task-form-button");
const taskFormCard = document.getElementById("task-form-card");
const closeTaskFormButton = document.getElementById("close-task-form-button");
const emptyState = document.getElementById("empty-state");

function updateEmptyState() {
  const tasks = document.querySelectorAll('[data-saved-task="true"]');

  if (tasks.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.classList.add("flex");
  } else {
    emptyState.classList.add("hidden");
    emptyState.classList.remove("flex");
  }
}

// باز کردن فرم
if (showTaskFormButton) {
  showTaskFormButton.addEventListener("click", () => {
    taskFormCard.classList.remove("hidden");
    taskFormCard.classList.add("flex");

    showTaskFormButton.classList.add("hidden");

    emptyState.classList.add("hidden");
  });
}

// بستن فرم با ضربدر
if (closeTaskFormButton) {
  closeTaskFormButton.addEventListener("click", () => {
    taskFormCard.classList.add("hidden");
    taskFormCard.classList.remove("flex");

    showTaskFormButton.classList.remove("hidden");
    showTaskFormButton.classList.add("flex");

    updateEmptyState();
  });
}

// dark & light theme toggle
document.addEventListener("DOMContentLoaded", () => {
  const darkBtn = document.getElementById("dark-toggle");
  const lightBtn = document.getElementById("light-toggle");

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  }

  if (darkBtn) {
    darkBtn.addEventListener("click", () => {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    });
  } else {
    console.error("عنصر #dark-toggle پیدا نشد.");
  }

  if (lightBtn) {
    lightBtn.addEventListener("click", () => {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    });
  } else {
    console.error("عنصر #light-toggle پیدا نشد.");
  }

  // hamburger menu
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("close-menu");
  const overlay = document.getElementById("overlay");
  const body = document.body;

  if (sidebar && menuBtn && closeBtn && overlay) {
    function openMenu() {
      sidebar.classList.remove("translate-x-full");
      overlay.classList.remove("opacity-0", "invisible");
      body.classList.add("overflow-hidden");
    }

    function closeMenu() {
      sidebar.classList.add("translate-x-full");
      overlay.classList.add("opacity-0", "invisible");
      body.classList.remove("overflow-hidden");
    }

    menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openMenu();
    });

    closeBtn.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) {
        closeMenu();
      }
    });
  } else {
    console.error("یکی از عناصر منو پیدا نشد:", {
      sidebar,
      menuBtn,
      closeBtn,
      overlay,
    });
  }

  // today's date (Persian calendar)
  function setTodayDate() {
    const dateEls = document.querySelectorAll("#today-date");
    if (!dateEls.length) {
      console.error("عنصر #today-date پیدا نشد.");
      return;
    }

    const today = new Date();

    const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const parts = formatter.formatToParts(today);
    const get = (type) => parts.find((p) => p.type === type)?.value || "";

    const text = `${get("weekday")}، ${get("day")} ${get("month")} ${get("year")}`;

    dateEls.forEach((el) => {
      el.textContent = text;
    });
  }

  setTodayDate();
});
