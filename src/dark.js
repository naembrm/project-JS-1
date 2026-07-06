// dark&light

const darkBtn = document.getElementById("dark-toggle");
const lightBtn = document.getElementById("light-toggle");

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}

darkBtn.addEventListener("click", () => {
  document.documentElement.classList.add("dark");
  localStorage.setItem("theme", "dark");
});

lightBtn.addEventListener("click", () => {
  document.documentElement.classList.remove("dark");
  localStorage.setItem("theme", "light");
});
const sidebar = document.getElementById("sidebar");

function openMenu() {
  sidebar.classList.remove("hidden");
  sidebar.classList.add(
    "fixed",
    "top-0",
    "right-0",
    "z-50",
    "flex",
    "translate-x-0",
  );
}

// hambergurMenu
const menuBtn = document.getElementById("menu-btn");
const closeBtn = document.getElementById("close-menu");
const overlay = document.getElementById("overlay");
const body = document.body;

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
