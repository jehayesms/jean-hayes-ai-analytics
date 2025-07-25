// lunr-init.js
let idx = null;
let posts = [];

fetch("{{ '/search.json' | relative_url }}")
  .then((response) => response.json())
  .then((data) => {
    posts = data;
    idx = lunr(function () {
      this.field("title");
      this.field("content");
      this.ref("url");

      posts.forEach(function (doc) {
        this.add(doc);
      }, this);
    });
  });

function liveSearch(inputId, resultsId) {
  const input = document.getElementById(inputId);
  const results = document.getElementById(resultsId);

  input.addEventListener("input", function () {
    const query = input.value.trim();
    results.innerHTML = "";

    if (query.length > 1 && idx) {
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
