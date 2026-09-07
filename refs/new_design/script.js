var btn = document.getElementById("theme-toggle");
var label = document.getElementById("theme-label");
var icon = document.getElementById("theme-icon");

btn.addEventListener("click", function () {
	var isDark = document.documentElement.classList.toggle("dark");
	icon.textContent = isDark ? "☾" : "☀";
	label.textContent = isDark ? "night.mode" : "day.mode";
});
