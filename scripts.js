// Importing data and constants
import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

// Initializing variables
let page = 1; // Current page number
let matches = books; // Array of books to display

// Helper function to create an element with attributes and children
const createElement = (tag, attributes = {}, ...children) => {
  const element = document.createElement(tag);
  // Setting attributes
  Object.entries(attributes).forEach(([key, value]) =>
    element.setAttribute(key, value)
  );
  // Appending children
  children.forEach((child) =>
    element.appendChild(
      typeof child === "string" ? document.createTextNode(child) : child
    )
  );
  return element;
};

// Function to create an <option> element
const createOption = (value, text) => createElement("option", { value }, text);

// Function to append multiple children to a parent element
const appendChildren = (parent, children) => {
  children.forEach((child) => parent.appendChild(child));
};

// Function to render a book preview button
const renderBook = ({ author, id, image, title }) => {
  const element = createElement(
    "button",
    { class: "preview", "data-preview": id },
    createElement("img", { class: "preview__image", src: image }),
    createElement(
      "div",
      { class: "preview__info" },
      createElement("h3", { class: "preview__title" }, title),
      createElement("div", { class: "preview__author" }, authors[author])
    )
  );
  return element;
};

// Function to update the book list on the UI
const updateBookList = (books, container) => {
  container.innerHTML = ""; // Clearing existing content
  const fragment = document.createDocumentFragment();
  books
    .slice(0, BOOKS_PER_PAGE)
    .forEach((book) => fragment.appendChild(renderBook(book)));
  container.appendChild(fragment);
};

// Function to setup dropdown options
const setupDropdown = (container, data, defaultText) => {
  const fragment = document.createDocumentFragment();
  fragment.appendChild(createOption("any", defaultText));
  Object.entries(data).forEach(([id, name]) =>
    fragment.appendChild(createOption(id, name))
  );
  container.appendChild(fragment);
};

// Function to handle theme change
const handleThemeChange = (theme) => {
  if (theme === "night") {
    document.documentElement.style.setProperty("--color-dark", "255, 255, 255");
    document.documentElement.style.setProperty("--color-light", "10, 10, 20");
  } else {
    document.documentElement.style.setProperty("--color-dark", "10, 10, 20");
    document.documentElement.style.setProperty(
      "--color-light",
      "255, 255, 255"
    );
  }
};

// Function to initialize the theme based on user preference
const initializeTheme = () => {
  const theme =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "night"
      : "day";
  document.querySelector("[data-settings-theme]").value = theme;
  handleThemeChange(theme);
};

// Function to setup event listeners
const setupEventListeners = () => {
  // Event listener for canceling search overlay
  document
    .querySelector("[data-search-cancel]")
    .addEventListener("click", () => {
      document.querySelector("[data-search-overlay]").open = false;
    });

  // Event listener for canceling settings overlay
  document
    .querySelector("[data-settings-cancel]")
    .addEventListener("click", () => {
      document.querySelector("[data-settings-overlay]").open = false;
    });

  // Event listener for opening search overlay
  document
    .querySelector("[data-header-search]")
    .addEventListener("click", () => {
      document.querySelector("[data-search-overlay]").open = true;
      document.querySelector("[data-search-title]").focus();
    });

  // Event listener for opening settings overlay
  document
    .querySelector("[data-header-settings]")
    .addEventListener("click", () => {
      document.querySelector("[data-settings-overlay]").open = true;
    });

  // Event listener for closing book details
  document.querySelector("[data-list-close]").addEventListener("click", () => {
    document.querySelector("[data-list-active]").open = false;
  });

  // Event listener for submitting settings form
  document
    .querySelector("[data-settings-form]")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const { theme } = Object.fromEntries(formData);
      handleThemeChange(theme); // Update theme based on user choice
      document.querySelector("[data-settings-overlay]").open = false; // Close settings overlay
    });

  // Event listener for submitting search form
  document
    .querySelector("[data-search-form]")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const filters = Object.fromEntries(formData);

      // Filtering books based on search criteria
      matches = books.filter((book) => {
        const genreMatch =
          filters.genre === "any" || book.genres.includes(filters.genre);
        const titleMatch =
          filters.title.trim() === "" ||
          book.title.toLowerCase().includes(filters.title.toLowerCase());
        const authorMatch =
          filters.author === "any" || book.author === filters.author;
        return genreMatch && titleMatch && authorMatch;
      });

      // Resetting page and handling empty result
      page = 1;
      if (matches.length < 1) {
        document
          .querySelector("[data-list-message]")
          .classList.add("list__message_show");
      } else {
        document
          .querySelector("[data-list-message]")
          .classList.remove("list__message_show");
      }

      // Updating book list and button state
      updateBookList(matches, document.querySelector("[data-list-items]"));
      document.querySelector("[data-list-button]").disabled =
        matches.length - page * BOOKS_PER_PAGE < 1;

      // Updating 'Show more' button text
      document.querySelector("[data-list-button]").innerHTML = `
            <span>Show more</span>
            <span class="list__remaining"> (${
              matches.length - page * BOOKS_PER_PAGE > 0
                ? matches.length - page * BOOKS_PER_PAGE
                : 0
            })</span>
        `;

      window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top
      document.querySelector("[data-search-overlay]").open = false; // Close search overlay
    });

  // Event listener for 'Show more' button
  document.querySelector("[data-list-button]").addEventListener("click", () => {
    const fragment = document.createDocumentFragment();
    matches
      .slice(page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE)
      .forEach((book) => fragment.appendChild(renderBook(book)));
    document.querySelector("[data-list-items]").appendChild(fragment);
    page += 1; // Increment page number
  });

  // Event listener for clicking on a book preview
  document
    .querySelector("[data-list-items]")
    .addEventListener("click", (event) => {
      const pathArray = Array.from(event.path || event.composedPath());
      let active = null;

      // Finding the clicked book
      for (const node of pathArray) {
        if (node?.dataset?.preview) {
          active = books.find((book) => book.id === node.dataset.preview);
          break;
        }
      }

      // Displaying book details if found
      if (active) {
        document.querySelector("[data-list-active]").open = true;
        document.querySelector("[data-list-blur]").src = active.image;
        document.querySelector("[data-list-image]").src = active.image;
        document.querySelector("[data-list-title]").innerText = active.title;
        document.querySelector("[data-list-subtitle]").innerText = `${
          authors[active.author]
        } (${new Date(active.published).getFullYear()})`;
        document.querySelector("[data-list-description]").innerText =
          active.description;
      }
    });
};

// Initial setup function
const init = () => {
  updateBookList(matches, document.querySelector("[data-list-items]")); // Update book list
  setupDropdown(
    document.querySelector("[data-search-genres]"),
    genres,
    "All Genres"
  ); // Setup genre dropdown
  setupDropdown(
    document.querySelector("[data-search-authors]"),
    authors,
    "All Authors"
  ); // Setup author dropdown
  initializeTheme(); // Initialize theme based on user preference

  // Setup initial 'Show more' button text and disabled state
  document.querySelector("[data-list-button]").innerText = `Show more (${
    books.length - BOOKS_PER_PAGE
  })`;
  document.querySelector("[data-list-button]").disabled =
    matches.length - page * BOOKS_PER_PAGE <= 0;

  // Setup 'Show more' button inner HTML
  document.querySelector("[data-list-button]").innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${
          matches.length - page * BOOKS_PER_PAGE > 0
            ? matches.length - page * BOOKS_PER_PAGE
            : 0
        })</span>
    `;

  setupEventListeners(); // Setup event listeners
};

init(); // Initialize the application
