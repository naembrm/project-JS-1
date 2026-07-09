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
      indicatorClass: "bg-primary-hover-light",
      badgeClass: "bg-primary-hover-light/10 text-primary-hover-light",
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

  function initializeTaskForm() {
    const todoList = document.getElementById("todo-list");
    const titleField = document.getElementById("task-name-field");
    const descriptionField = document.getElementById("task-description-field");
    const prioritySelector = document.getElementById("priority-selector");
    const addTaskButton = document.getElementById("add-task-button");
    const showFormButton = document.getElementById("show-task-form-button");
    const doneList = document.getElementById("done-list");
    const emptyState = document.getElementById("empty-state");
    const remainingTaskCount = document.getElementById("remaining-task-count");

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

    if (showFormButton) {
      showFormButton.addEventListener("click", showTaskForm);
    }

    const originalPriorityHTML = prioritySelector.innerHTML;
    const originalPriorityClass = prioritySelector.className;
    const originalPriorityDirection =
      prioritySelector.getAttribute("dir") || "ltr";
    const defaultAddButtonText = addTaskButton.textContent;

    let selectedPriority = null;
    let tasks = readStorage(STORAGE_KEYS.tasks, []);
    let editingTaskId = null;

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
      const placeholder = normalizeText(field.dataset.placeholder);

      if (value === placeholder) {
        return "";
      }

      if (placeholder && value.endsWith(placeholder)) {
        return normalizeText(value.slice(0, -placeholder.length));
      }

      return value;
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
      return Boolean(
        getEditableValue(titleField) &&
        getEditableValue(descriptionField) &&
        selectedPriority,
      );
    }

    function getFormState() {
      const title = getEditableValue(titleField);
      const description = getEditableValue(descriptionField);

      return {
        title,
        description,
        priority: selectedPriority,
        hasTitle: Boolean(title),
        hasDescription: Boolean(description),
        hasPriority: Boolean(selectedPriority),
        isComplete: Boolean(title && description && selectedPriority),
      };
    }

    function updateAddButton() {
      const isActive = isFormComplete();

      addTaskButton.disabled = false;
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

    function exitEditMode() {
      editingTaskId = null;
      addTaskButton.textContent = defaultAddButtonText;
    }

    function createMoreButton(taskId) {
      const button = document.createElement("button");

      button.type = "button";
      button.dataset.taskId = taskId;
      button.dataset.taskMenuToggle = "true";
      button.setAttribute("aria-label", "گزینه‌های تسک");
      button.setAttribute("aria-expanded", "false");
      Object.assign(button.style, {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "2rem",
        height: "2rem",
        border: "0",
        borderRadius: "0.5rem",
        backgroundColor: "transparent",
        color: "var(--color-Neutral-3, #646466)",
        cursor: "pointer",
      });

      button.innerHTML = `
        <svg width="4" height="18" viewBox="0 0 4 18" fill="currentColor" aria-hidden="true">
          <circle cx="2" cy="2" r="2"/>
          <circle cx="2" cy="9" r="2"/>
          <circle cx="2" cy="16" r="2"/>
        </svg>
      `;

      return button;
    }

    function setMenuItemStyle(button, color = "var(--color-Neutral-2, #323233)") {
      Object.assign(button.style, {
        width: "100%",
        border: "0",
        backgroundColor: "transparent",
        color,
        cursor: "pointer",
        padding: "0.5rem 0.75rem",
        textAlign: "right",
        fontFamily: "inherit",
        fontSize: "0.875rem",
        fontWeight: "600",
        whiteSpace: "nowrap",
      });
    }

    function createMenuItem(taskId, action, label, color) {
      const button = document.createElement("button");

      button.type = "button";
      button.dataset.taskId = taskId;
      button.dataset.taskAction = action;
      button.textContent = label;
      setMenuItemStyle(button, color);

      return button;
    }

    function closeTaskMenus(exceptMenu = null) {
      document.querySelectorAll("[data-task-menu]").forEach((menu) => {
        if (menu === exceptMenu) return;

        menu.hidden = true;
        const toggle = menu.parentElement
          ? menu.parentElement.querySelector("[data-task-menu-toggle]")
          : null;

        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    function createTaskActions(taskId) {
      const actions = document.createElement("div");
      actions.className = "relative shrink-0";
      Object.assign(actions.style, {
        position: "relative",
        flex: "0 0 auto",
      });

      const moreButton = createMoreButton(taskId);
      const menu = document.createElement("div");

      menu.dataset.taskMenu = "true";
      menu.hidden = true;
      Object.assign(menu.style, {
        position: "absolute",
        top: "2.25rem",
        left: "0",
        zIndex: "20",
        minWidth: "7rem",
        overflow: "hidden",
        border: "1px solid #e1e0e5",
        borderRadius: "0.5rem",
        backgroundColor: document.documentElement.classList.contains("dark")
          ? "#121c29"
          : "#ffffff",
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
      });

      menu.append(
        createMenuItem(taskId, "edit", "ویرایش", "var(--color-Neutral-2, #323233)"),
        createMenuItem(taskId, "delete", "حذف", "var(--color-Errors, #e63946)"),
      );

      moreButton.addEventListener("click", (event) => {
        event.stopPropagation();

        const shouldOpen = menu.hidden;
        closeTaskMenus(menu);
        menu.hidden = !shouldOpen;
        moreButton.setAttribute("aria-expanded", String(shouldOpen));
      });

      menu.addEventListener("click", (event) => {
        const button = event.target.closest("[data-task-action]");
        if (!button) return;

        closeTaskMenus();

        if (button.dataset.taskAction === "delete") {
          deleteTask(button.dataset.taskId);
          return;
        }

        if (button.dataset.taskAction === "edit") {
          startEditingTask(button.dataset.taskId);
        }
      });

      actions.append(moreButton, menu);

      return actions;
    }

    function deleteTask(taskId) {
      tasks = tasks.filter((task) => task.id !== taskId);

      if (editingTaskId === taskId) {
        exitEditMode();
        resetForm();
        hideTaskForm();
      }

      writeStorage(STORAGE_KEYS.tasks, tasks);
      renderSavedTasks();
    }

    function startEditingTask(taskId) {
      const task = tasks.find((savedTask) => savedTask.id === taskId);
      if (!task) return;

      editingTaskId = task.id;
      setEditableValue(titleField, task.title);
      setEditableValue(descriptionField, task.description);
      selectPriority(task.priority, false);
      addTaskButton.textContent = "ذخیره تغییرات";
      showTaskForm();
      updateAddButton();
      titleField.focus();
    }

    function createTaskCard(task, completed) {
      const priorityData = PRIORITIES[task.priority] || PRIORITIES.medium;
      const article = document.createElement("article");

      article.dataset.savedTask = "true";
      article.dataset.taskId = task.id;
      article.className =
        "relative flex min-h-[108px] w-full items-start justify-between gap-4 overflow-hidden rounded-xl border border-Neutral-7 bg-Neutral-11 py-6 pr-6 pl-5 dark:border-Neutral-Dark-3 dark:bg-[#121c29]";
      Object.assign(article.style, {
        position: "relative",
        display: "flex",
        minHeight: "108px",
        width: "100%",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        overflow: "hidden",
        borderRadius: "0.75rem",
        border: "1px solid #e1e0e5",
        backgroundColor: document.documentElement.classList.contains("dark")
          ? "#121c29"
          : "#ffffff",
        padding: "1.5rem 1.5rem 1.5rem 1.25rem",
        boxSizing: "border-box",
      });

      const indicator = document.createElement("span");
      indicator.className = `absolute inset-y-3 right-0 w-1 rounded-l-lg ${priorityData.indicatorClass}`;

      const content = document.createElement("div");
      content.className = "flex min-w-0 items-start gap-4";
      Object.assign(content.style, {
        display: "flex",
        minWidth: "0",
        flex: "1 1 auto",
        alignItems: "flex-start",
        gap: "1rem",
      });

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

      article.append(indicator, content, createTaskActions(task.id));

      return article;
    }

    function updateRemainingCount() {
      if (!remainingTaskCount) return;

      const remainingCount = todoList.querySelectorAll(
        "article .task-check:not(:checked)",
      ).length;

      remainingTaskCount.textContent = `${remainingCount} `;
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
      exitEditMode();
      updateAddButton();
    }

    function addTask(event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      const formState = getFormState();
      console.log("[task-form] Add task clicked", formState);

      if (!formState.isComplete) {
        console.warn("[task-form] Task was not added because the form is incomplete", formState);
        return;
      }

      if (editingTaskId) {
        tasks = tasks.map((savedTask) =>
          savedTask.id === editingTaskId
            ? {
                ...savedTask,
                title: getEditableValue(titleField),
                description: getEditableValue(descriptionField),
                priority: selectedPriority,
                updatedAt: new Date().toISOString(),
              }
            : savedTask,
        );
      } else {
        const task = {
          id: createTaskId(),
          title: getEditableValue(titleField),
          description: getEditableValue(descriptionField),
          priority: selectedPriority,
          completed: false,
          createdAt: new Date().toISOString(),
        };

        tasks.unshift(task);
        console.log("[task-form] Task added", {
          task,
          totalTasks: tasks.length,
        });
      }

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

      field.addEventListener("click", () => {
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

    document.addEventListener("click", (event) => {
      if (!event.target.closest("[data-task-menu]") &&
        !event.target.closest("[data-task-menu-toggle]")) {
        closeTaskMenus();
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
