// lunr-init.js
let idx = null;
let posts = [];

function initLunrSearch(searchData) {
  posts = searchData;
  idx = lunr(function () {
    this.field("title");
    this.field("content");
    this.ref("url");

    posts.forEach(function (doc) {
      this.add(doc);
    }, this);
  });
}

function liveSearch(inputId, resultsId) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);

  if (!input || !results || !idx) return;

  input.addEventListener("input", function () {
    const query = input.value.trim();
    results.innerHTML = "";

    if (query.length > 1) {
      const matches = idx.search(query);
      if (matches.length > 0) {
        matches.slice(0, 5).forEach((match) => {
          const post = posts.find((p) => p.url === match.ref);
          const item = document.createElement("div");
          item.className = "search-result";
          item.innerHTML = `<a href="${post.url}">${post.title}</a>`;
          results.appendChild(item);
        });
      } else {
        results.innerHTML = "<div class='no-results'>No results</div>";
      }
    }
  });
}
