// STATE

let page = null; // "home" | "favorites"
let category = null; // "muscles" | "bodypart" | "equipment"
let filter = null; // string | null
let currentPage = null; // number | null
let searchText = null; // string | null
let ratingOverlayId = null; // string | null


// DOM OBJECTS

const navLinks = document.querySelectorAll("nav .nav-item");
const menu = document.querySelector(".mobile-menu");

const hero = document.querySelector("section.hero");

const main = document.querySelector("section.main div.main");
const mainTitle = document.querySelector(".route .title");
const mainSeparator = document.querySelector(".route .separator");
const mainRoute = document.querySelector(".route .category-title");
const search = document.querySelector(".filters .search-bar");
const categories = document.querySelector(".filters .categories");

const catGrid = document.querySelector("section.main .results .categories");
const exerGrid = document.querySelector("section.main .results .exercises");
const favGrid = document.querySelector("section.main .results .favorites");

const paginator = document.querySelector("section.main .results .paginator");

const exerciseTemplate = document.querySelector("#super-hidden .exercise");

const exerciseOverlayElement = document.querySelector("#exercise-overlay");
const rateOverlayElement = document.querySelector("#rate-overlay");


// STATE SETTERS

function setPage(it) {
  if (page === it) return;

  page = it;

  navLinks.forEach((link) => {
    link.classList.remove("active");
    const text = link.firstElementChild.textContent;
    const needed = it.charAt(0).toUpperCase() + it.slice(1);
    if (text === needed) {
      link.classList.add("active");
    }
  });

  hero.style.display = it === "home" ? "" : "none";

  mainTitle.textContent = it === "home" ? "Exercises" : "Favorites";

  if (it === "home") {
    main.classList.remove("fav");
    favGrid.style.display = "none";
    categories.style.display = "flex";
    if (filter !== null) {
      catGrid.style.display = "none";
      exerGrid.style.display = "grid";
      search.style.display = "flex";
      mainSeparator.style.display = "block";
      mainRoute.style.display = "block";
    } else {
      catGrid.style.display = "grid";
      exerGrid.style.display = "none";
      search.style.display = "none";
      mainSeparator.style.display = "none";
      mainRoute.style.display = "none";
    }
  } else {
    main.classList.add("fav");
    catGrid.style.display = "none";
    exerGrid.style.display = "none";
    favGrid.style.display = "grid";
    categories.style.display = "none";
    search.style.display = "none";
    mainSeparator.style.display = "none";
    mainRoute.style.display = "none";
    updateFavorites(1).then((n) => setPaginator(n));
  }
}

async function setCategory(it, page) {
  if (category === it) return;

  category = it;
  filter = null;
  searchText = null;
  search.firstElementChild.value = "";
  search.style.display = "none";

  catGrid.style.display = "grid";
  exerGrid.style.display = "none";
  mainSeparator.style.display = "none";
  mainRoute.style.display = "none";
  
  Array.from(categories.children).forEach((cat) => {
    cat.classList.remove("active");
    if (cat.textContent === "Muscles" && it === "muscles") 
      cat.classList.add("active");
    if (cat.textContent === "Body parts" && it === "bodypart") 
      cat.classList.add("active");
    if (cat.textContent === "Equipment" && it === "equipment") 
      cat.classList.add("active");
  });

  const totalPages = await updateCategory(it, 1);

  setPaginator(totalPages);
}

async function updateCategory(it, page) {
  let name;
  if (it === "muscles") name = "Muscles";
  if (it === "bodypart") name = "Body%20parts";
  if (it === "equipment") name = "Equipment";

  const response = await fetch(`https://your-energy.b.goit.study/api/filters?page=${page}&limit=12&filter=${name}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  const result = await response.json();

  while (catGrid.firstChild) {
    catGrid.removeChild(catGrid.firstChild);
  }

  result.results.forEach(res => {
    const newCat = document.createElement("a");

    newCat.style.backgroundImage = "url("+res.imgURL+")";

    newCat.addEventListener("click", () => setFilter(res.name));

    const newTitle = document.createElement("span");
    newTitle.textContent = res.name.charAt(0).toUpperCase() + res.name.slice(1);
    newCat.appendChild(newTitle);

    const newText = document.createElement("span");
    newText.textContent = res.filter;
    newCat.appendChild(newText);

    catGrid.appendChild(newCat);
  });

  return result.totalPages;
}

async function setFilter(it) {
  filter = it;

  catGrid.style.display = "none";
  exerGrid.style.display = "grid";
  mainSeparator.style.display = "block";
  mainRoute.style.display = "block";
  search.style.display = "flex";

  mainRoute.textContent = it.charAt(0).toUpperCase() + it.slice(1);

  const totalPages = await updateExercises(it, 1, searchText);

  setPaginator(totalPages);
}

async function updateExercises(it, page, keyword) {
  const api = `https://your-energy.b.goit.study/api/exercises?${category}=${it}&page=${page !== null ? page : 1}&limit=10${ keyword != null ? "&keyword="+keyword : "" }`;
  const response = await fetch(api, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  const result = await response.json();

  while (exerGrid.firstChild) {
    exerGrid.removeChild(exerGrid.firstChild);
  }

  if (result.results.length === 0) {
    const noResults = document.createElement("p");
    noResults.classList.add("no-results");
    noResults.textContent = "Your search query yilded no results...";
    exerGrid.appendChild(noResults);
  } else {
    result.results.forEach(res => {
      const newEx = exerciseTemplate.cloneNode(true);

      newEx.addEventListener("click", () => exerciseOverlay(res));

      newEx.querySelector(".rating p").textContent = res.rating;
      newEx.querySelector(".exercise-title").textContent = res.name.charAt(0).toUpperCase() + res.name.slice(1);
      newEx.querySelector(".third > :nth-child(1) > :last-child").textContent = res.burnedCalories;
      newEx.querySelector(".third > :nth-child(2) > :last-child").textContent = res.bodyPart;
      newEx.querySelector(".third > :nth-child(3) > :last-child").textContent = res.target;

      exerGrid.appendChild(newEx);
    });
  }

  return result.totalPages;
}

async function updateFavorites(pageN) {
  const favs = JSON.parse(localStorage.getItem('favorites')) || {};

  while (favGrid.firstChild) {
    favGrid.removeChild(favGrid.firstChild);
  }
  const noResults = document.createElement("p");
  noResults.classList.add("no-results");

  if (Object.keys(favs).length === 0) {
    noResults.textContent = "It appears that you haven't added any exercises to your favorites yet. To get started, you can add exercises that you like to your favorites for easier access in the future.";
    favGrid.appendChild(noResults);
    return 0;
  }
  noResults.textContent = "Loading...";
  favGrid.appendChild(noResults);

  let responces = [];

  Object.keys(favs).slice(10*(pageN-1), 10*pageN).forEach((id) => {
    const api = `https://your-energy.b.goit.study/api/exercises/${id}`;
    responces.push(
      fetch(api, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      })
    );
  });
 
  responces = await Promise.all(responces);

  let results = [];
  responces.forEach((r) => results.push(r.json()));

  results = await Promise.all(results);

  favGrid.removeChild(favGrid.firstChild);
  results.forEach(res => {
    const newEx = exerciseTemplate.cloneNode(true);

    newEx.addEventListener("click", () => exerciseOverlay(res));

    newEx.querySelector(".exercise-title").textContent = res.name.charAt(0).toUpperCase() + res.name.slice(1);
    newEx.querySelector(".third > :nth-child(1) > :last-child").textContent = res.burnedCalories;
    newEx.querySelector(".third > :nth-child(2) > :last-child").textContent = res.bodyPart;
    newEx.querySelector(".third > :nth-child(3) > :last-child").textContent = res.target;

    favGrid.appendChild(newEx);
  });
  
  return Math.ceil(Object.keys(favs).length/10);
}

function setPaginator(n) {
  currentPage = 1;

  if (n < 2) {
    paginator.style.display = "none";
    return;
  }

  paginator.style.display = "";

  while (paginator.firstChild) {
    paginator.removeChild(paginator.firstChild);
  }

  for (let i = 1; i <= n; i++) {
    const pageToggle = document.createElement("a");

    pageToggle.textContent = i;

    pageToggle.setAttribute('aria-label', `Enter page ${i}`);

    if (i === 1) pageToggle.classList.add("active");

    pageToggle.addEventListener("click", async () => {
      if (i !== currentPage) {
        Array.from(paginator.children)[currentPage-1].classList.remove('active');
        Array.from(paginator.children)[i-1].classList.add('active');
        currentPage = i;
        if (page === "home") {
          if (filter == null) {
            await updateCategory(category, i);
          } else {
            await updateExercises(filter, i, searchText);
          }
        } else {
          await updateFavorites(i);
        }
        main.querySelector(".results").scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });

    paginator.appendChild(pageToggle);
  }
}


// OVERLAYS

function exerciseOverlay(exercise) {
  exerciseOverlayElement.querySelector(".exercise-image").setAttribute("src", exercise.gifUrl);
  exerciseOverlayElement.querySelector(".title").textContent = exercise.name.charAt(0).toUpperCase() + exercise.name.slice(1);
  exerciseOverlayElement.querySelector(".rating p").textContent = exercise.rating;
  exerciseOverlayElement.querySelector(".params > :nth-child(1) > :last-child").textContent = exercise.target;
  exerciseOverlayElement.querySelector(".params > :nth-child(2) > :last-child").textContent = exercise.bodyPart;
  exerciseOverlayElement.querySelector(".params > :nth-child(3) > :last-child").textContent = exercise.equipment;
  exerciseOverlayElement.querySelector(".params > :nth-child(4) > :last-child").textContent = exercise.popularity;
  exerciseOverlayElement.querySelector(".params > :nth-child(5) > :last-child").textContent = exercise.burnedCalories;
  exerciseOverlayElement.querySelector(".description").textContent = exercise.description;

  const favs = JSON.parse(localStorage.getItem('favorites')) || {};

  const id = exercise._id;
  ratingOverlayId = id;
  const favBtn = exerciseOverlayElement.querySelector(".buttons :first-child");

  if (Object.hasOwn(favs, id)) {
    favBtn.classList.add("remove");
    favBtn.classList.remove("add");
    favBtn.firstElementChild.textContent = "Remove favorite";
  } else {
    favBtn.classList.add("add");
    favBtn.classList.remove("remove");
    favBtn.firstElementChild.textContent = "Add to favorites";
  }

  function fav(e) {
    if (favBtn.classList.contains("add")) {
      favs[id] = true;
      favBtn.classList.add("remove");
      favBtn.classList.remove("add");
      favBtn.firstElementChild.textContent = "Remove favorite";
    } else {
      delete favs[id];
      favBtn.classList.add("add");
      favBtn.classList.remove("remove");
      favBtn.firstElementChild.textContent = "Add to favorites";
    }
    localStorage.setItem('favorites', JSON.stringify(favs));
    if (page === "favorites") updateFavorites(currentPage);
  }

  function rate(e) {
    ratingOverlay();
  }

  function close(e) {
    if (e.target !== e.currentTarget) return;
    exerciseOverlayElement.removeEventListener("click", close);
    exerciseOverlayElement.querySelector(".close-icon img").removeEventListener("click", close);
    favBtn.removeEventListener("click", fav);
    exerciseOverlayElement.querySelector(".buttons .rate").removeEventListener("click", rate);
    exerciseOverlayElement.style.display = "none";
    ratingOverlayId = null;
  }

  exerciseOverlayElement.addEventListener("click", close);
  exerciseOverlayElement.querySelector(".close-icon img").addEventListener("click", close);
  favBtn.addEventListener("click", fav);
  exerciseOverlayElement.querySelector(".buttons .rate").addEventListener("click", rate);

  exerciseOverlayElement.style.display = "flex";
}

function ratingOverlay() {
  exerciseOverlayElement.style.display = "none";
  rateOverlayElement.style.display = "flex";

  document.querySelector("#rate-overlay form").reset();

  function close(e) {
    if (e.target !== e.currentTarget) return;
    exerciseOverlayElement.removeEventListener("click", close);
    exerciseOverlayElement.querySelector(".close-icon img").removeEventListener("click", close);
    exerciseOverlayElement.style.display = "flex";
    rateOverlayElement.style.display = "none";
  }

  rateOverlayElement.addEventListener("click", close);
  rateOverlayElement.querySelector(".close-icon img").addEventListener("click", close);
}


// LISTENERS

navLinks[0].addEventListener("click", () => setPage("home"));
navLinks[1].addEventListener("click", () => setPage("favorites"));

document.querySelector("nav .nav-menu-toggle").addEventListener("click", () => {
  menu.style.display = "flex";
});
document.querySelector(".close-mobile-menu").addEventListener("click", () => {
  menu.style.display = "none";
});
document.querySelector(".mobile-middle").firstElementChild.firstElementChild.addEventListener("click", () => {
  setPage("home");
  menu.style.display = "none";
});
document.querySelector(".mobile-middle").lastElementChild.firstElementChild.addEventListener("click", () => {
  setPage("favorites");
  menu.style.display = "none";
});

let debounceTimeout;
search.firstElementChild.addEventListener("input", (e) => {
  clearTimeout(debounceTimeout);
  
  while (exerGrid.firstChild) {
    exerGrid.removeChild(exerGrid.firstChild);
  }

  const noResults = document.createElement("p");
  noResults.classList.add("no-results");
  noResults.textContent = "Loading...";
  exerGrid.appendChild(noResults);

  debounceTimeout = setTimeout(async () => {
    searchText = e.target.value.trim();

    const max = await updateExercises(filter, currentPage, searchText);
    
    setPaginator(max);
  }, 1000);
});

document.querySelector("footer form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector("footer #email").value;

  try {
    const response = await fetch("https://your-energy.b.goit.study/api/subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong, please try again");
    }

    alert(data.message);
    document.querySelector("footer form").reset();

  } catch (error) {
    alert(error);
  }
});

let ratingDebounce;
const ratingInput = document.querySelector("#rate-overlay #rating");
ratingInput.addEventListener('input', () => {
  clearTimeout(ratingDebounce);
  ratingDebounce = setTimeout(() => {
    let value = parseFloat(ratingInput.value);

    if (isNaN(value)) {
      ratingInput.value = '';
      return;
    }

    value = Math.min(Math.max(value, 0), 5);

    ratingInput.value = value.toFixed(2);
  }, 1000);
});

document.querySelector("#rate-overlay form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector("#rate-overlay #email").value;
  const rating = parseFloat(document.querySelector("#rate-overlay #rating").value);
  const comment = document.querySelector("#rate-overlay #comment").value;

  try {
    const response = await fetch(`https://your-energy.b.goit.study/api/exercises/${ratingOverlayId}/rating`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        rate: rating,
        email: email,
        review: comment
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong, please try again");
    }

    alert("Your feedback has been accepted. Thank you for contributing to our community!");
    document.querySelector("#rate-overlay form").reset();

  } catch (error) {
    alert(error);
  }
});

// INIT

setPage("home");
setCategory("muscles");

const QUOTE_KEY = "dailyQuote";
const QUOTE_DATE_KEY = "dailyQuoteDate";

function setQuote({ quote, author }) {
  document.querySelector(".quote .quote-text").textContent = quote;
  document.querySelector(".quote .quote-author").textContent = author;
}

function isToday(storedDate) {
  const today = new Date().toISOString().split("T")[0];
  return storedDate === today;
}

const storedQuote = localStorage.getItem(QUOTE_KEY);
const storedDate = localStorage.getItem(QUOTE_DATE_KEY);

if (storedQuote && storedDate && isToday(storedDate)) {
  setQuote(JSON.parse(storedQuote));
} else {
  fetch("https://your-energy.b.goit.study/api/quote", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  }).then(resp => resp.json()).then(content => {
      setQuote(content);
      localStorage.setItem(QUOTE_KEY, JSON.stringify(content));
      localStorage.setItem(
        QUOTE_DATE_KEY,
        new Date().toISOString().split("T")[0]
      );
    }).catch(console.error);
}