// Clear chat (UI only)
document.getElementById("clearChat").addEventListener("click", () => {
  document.querySelector(".messages").innerHTML = "";
});

// Toggle favorite star
document.querySelectorAll(".fav").forEach(star => {
  star.addEventListener("click", (e) => {
    e.stopPropagation();
    star.textContent = star.textContent === "⭐" ? "☆" : "⭐";
  });
});

// Select chat
document.querySelectorAll(".chat-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".chat-item")
      .forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    document.querySelector(".chat-header h3").textContent =
      item.querySelector(".name").textContent;
  });
});
