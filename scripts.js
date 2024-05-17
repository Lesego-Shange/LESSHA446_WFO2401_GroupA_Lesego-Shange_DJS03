// Importing data and constants
import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

// Initializing variables
let page = 1; // Current page number
let matches = books; // Array of books to display

/**
 * Helper function to create an element with attributes and children
 * @param {string} tag - The HTML tag name.
 * @param {Object} attributes - A key-value map of attributes to set on the element.
 * @param {...(string|Node)} children - Child nodes or text to append to the element.
 * @returns {HTMLElement} The created HTML element.
 */
const createElement = (tag, attributes = {}, ...children) => {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) =>
    element.setAttribute(key, value)
  );
  children.forEach((child) =>
    element.appendChild(
      typeof child === "string" ? document.createTextNode(child) : child
    )
  );
  return element;
};

/**
 * Function to create an <option> element
 * @param {string} value - The value attribute of the option.
 * @param {string} text - The text content of the option.
 * @returns {HTMLOptionElement} The created option element.
 */
const createOption = (value, text) => createElement("option", { value }, text);

/**
 * Function to append multiple children to a parent element
 * @param {HTMLElement} parent - The parent element to append children to.
 * @param {Array<HTMLElement>} children - An array of child elements to append.
 */
const appendChildren = (parent, children) => {
  children.forEach((child) => parent.appendChild(child));
};

/**
 * Function to render a book preview button
 * @param {Object} book - The book object containing book details.
 * @param {string} book.author - The author ID of the book.
 * @param {string} book.id - The unique ID of the book.
 * @param {string} book.image - The URL of the book cover image.
 * @param {string} book.title - The title of the book.
 * @returns {HTMLButtonElement} The created button element.
 */
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

/**
 * Function to update the book list on the UI
 * @param {Array<Object>} books - The array of book objects to display.
 * @param {HTMLElement} container - The container element to append book previews to.
 */
const updateBookList = (books, container) => {
  container.innerHTML = ""; // Clearing existing content
  const fragment = document.createDocumentFragment();
  books
    .slice(0, BOOKS_PER_PAGE)
    .forEach((book) => fragment.appendChild(renderBook(book)));
  container.appendChild(fragment);
};

/**
 * Function to setup dropdown options
 * @param {HTMLElement} container - The container element to append options to.
 * @param {Object} data - The data object containing ID-name pairs for the options.
 * @param {string} defaultText - The default option text.
 */
const setupDropdown = (container, data, defaultText) => {
  const fragment = document.createDocumentFragment();
  fragment.appendChild(createOption("any", defaultText));
  Object.entries(data).forEach(([id, name]) =>
    fragment.appendChild(createOption(id, name))
  );
  container.appendChild(fragment);
};

/**
 * Function to handle theme change
 * @param {string} theme - The selected theme ("night" or "day").
 */
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

/**
 * Function to initialize the theme based on user preference
 */
const initializeTheme = () => {
  const theme =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "night"
      : "day";
  document.querySelector("[data-settings-theme]").value = theme;
  handleThemeChange(theme);
};

/**
 * Function to setup event listeners
 */
const setupEventListeners = () => {
  document
    .querySelector("[data-search-cancel]")
    .addEventListener("click", () => {
      document.querySelector("[data-search-overlay]").open = false;
    });

  document
    .querySelector("[data-settings-cancel]")
    .addEventListener("click", () => {
      document.querySelector("[data-settings-overlay]").open = false;
    });

  document
    .querySelector("[data-header-search]")
    .addEventListener("click", () => {
      document.querySelector("[data-search-overlay]").open = true;
      document.querySelector("[data-search-title]").focus();
    });

  document
    .querySelector("[data-header-settings]")
    .addEventListener("click", () => {
      document.querySelector("[data-settings-overlay]").open = true;
    });

  document.querySelector("[data-list-close]").addEventListener("click", () => {
    document.querySelector("[data-list-active]").open = false;
  });

  document
    .querySelector("[data-settings-form]")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const { theme } = Object.fromEntries(formData);
      handleThemeChange(theme);
      document.querySelector("[data-settings-overlay]").open = false;
    });

  document
    .querySelector("[data-search-form]")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const filters = Object.fromEntries(formData);

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

      updateBookList(matches, document.querySelector("[data-list-items]"));
      document.querySelector("[data-list-button]").disabled =
        matches.length - page * BOOKS_PER_PAGE < 1;

      document.querySelector("[data-list-button]").innerHTML = `
            <span>Show more</span>
            <span class="list__remaining"> (${
              matches.length - page * BOOKS_PER_PAGE > 0
                ? matches.length - page * BOOKS_PER_PAGE
                : 0
            })</span>
        `;

      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("[data-search-overlay]").open = false;
    });

  document.querySelector("[data-list-button]").addEventListener("click", () => {
    const fragment = document.createDocumentFragment();
    matches
      .slice(page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE)
      .forEach((book) => fragment.appendChild(renderBook(book)));
    document.querySelector("[data-list-items]").appendChild(fragment);
    page += 1;
  });

  document
    .querySelector("[data-list-items]")
    .addEventListener("click", (event) => {
      const pathArray = Array.from(event.path || event.composedPath());
      let active = null;

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

/**
 * Initializes the application by setting up the book list, dropdown menus, theme, and event listeners.
 */
const init = () => {
  // Update the book list with the initial set of matches
  updateBookList(matches, document.querySelector("[data-list-items]"));

  // Setup genre dropdown menu
  setupDropdown(
    document.querySelector("[data-search-genres]"),
    genres,
    "All Genres"
  );

  // Setup author dropdown menu
  setupDropdown(
    document.querySelector("[data-search-authors]"),
    authors,
    "All Authors"
  );

  // Initialize theme based on user preference
  initializeTheme();

  // Setup initial state and text for the 'Show more' button
  document.querySelector("[data-list-button]").innerText = `Show more (${
    books.length - BOOKS_PER_PAGE
  })`;
  document.querySelector("[data-list-button]").disabled =
    matches.length - page * BOOKS_PER_PAGE <= 0;

  // Setup inner HTML for the 'Show more' button
  document.querySelector("[data-list-button]").innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${
          matches.length - page * BOOKS_PER_PAGE > 0
            ? matches.length - page * BOOKS_PER_PAGE
            : 0
        })</span>
    `;

  // Setup all required event listeners
  setupEventListeners();
};

// Call the init function to start the application
init();

/**
 * Original code for reference:
 *
 * import { books, authors, genres, BOOKS_PER_PAGE } from './data.js'
 *
 * let page = 1;
 * let matches = books;
 *
 * // Create a document fragment for initial book list
 * const starting = document.createDocumentFragment();
 *
 * for (const { author, id, image, title } of matches.slice(0, BOOKS_PER_PAGE)) {
 *     const element = document.createElement('button');
 *     element.classList = 'preview';
 *     element.setAttribute('data-preview', id);
 *
 *     element.innerHTML = `
 *         <img
 *             class="preview__image"
 *             src="${image}"
 *         />
 *
 *         <div class="preview__info">
 *             <h3 class="preview__title">${title}</h3>
 *             <div class="preview__author">${authors[author]}</div>
 *         </div>
 *     `;
 *
 *     starting.appendChild(element);
 * }
 *
 * document.querySelector('[data-list-items]').appendChild(starting);
 *
 * // Setup genre dropdown menu
 * const genreHtml = document.createDocumentFragment();
 * const firstGenreElement = document.createElement('option');
 * firstGenreElement.value = 'any';
 * firstGenreElement.innerText = 'All Genres';
 * genreHtml.appendChild(firstGenreElement);
 *
 * for (const [id, name] of Object.entries(genres)) {
 *     const element = document.createElement('option');
 *     element.value = id;
 *     element.innerText = name;
 *     genreHtml.appendChild(element);
 * }
 *
 * document.querySelector('[data-search-genres]').appendChild(genreHtml);
 *
 * // Setup author dropdown menu
 * const authorsHtml = document.createDocumentFragment();
 * const firstAuthorElement = document.createElement('option');
 * firstAuthorElement.value = 'any';
 * firstAuthorElement.innerText = 'All Authors';
 * authorsHtml.appendChild(firstAuthorElement);
 *
 * for (const [id, name] of Object.entries(authors)) {
 *     const element = document.createElement('option');
 *     element.value = id;
 *     element.innerText = name;
 *     authorsHtml.appendChild(element);
 * }
 *
 * document.querySelector('[data-search-authors]').appendChild(authorsHtml);
 *
 * // Initialize theme based on user preference
 * if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
 *     document.querySelector('[data-settings-theme]').value = 'night';
 *     document.documentElement.style.setProperty('--color-dark', '255, 255, 255');
 *     document.documentElement.style.setProperty('--color-light', '10, 10, 20');
 * } else {
 *     document.querySelector('[data-settings-theme]').value = 'day';
 *     document.documentElement.style.setProperty('--color-dark', '10, 10, 20');
 *     document.documentElement.style.setProperty('--color-light', '255, 255, 255');
 * }
 *
 * document.querySelector('[data-list-button]').innerText = `Show more (${books.length - BOOKS_PER_PAGE})`;
 * document.querySelector('[data-list-button]').disabled = (matches.length - (page * BOOKS_PER_PAGE)) > 0;
 *
 * document.querySelector('[data-list-button]').innerHTML = `
 *     <span>Show more</span>
 *     <span class="list__remaining"> (${(matches.length - (page * BOOKS_PER_PAGE)) > 0 ? (matches.length - (page * BOOKS_PER_PAGE)) : 0})</span>
 * `;
 *
 * // Event listeners for various actions
 * document.querySelector('[data-search-cancel]').addEventListener('click', () => {
 *     document.querySelector('[data-search-overlay]').open = false;
 * });
 *
 * document.querySelector('[data-settings-cancel]').addEventListener('click', () => {
 *     document.querySelector('[data-settings-overlay]').open = false;
 * });
 *
 * document.querySelector('[data-header-search]').addEventListener('click', () => {
 *     document.querySelector('[data-search-overlay]').open = true;
 *     document.querySelector('[data-search-title]').focus();
 * });
 *
 * document.querySelector('[data-header-settings]').addEventListener('click', () => {
 *     document.querySelector('[data-settings-overlay]').open = true;
 * });
 *
 * document.querySelector('[data-list-close]').addEventListener('click', () => {
 *     document.querySelector('[data-list-active]').open = false;
 * });
 *
 * document.querySelector('[data-settings-form]').addEventListener('submit', (event) => {
 *     event.preventDefault();
 *     const formData = new FormData(event.target);
 *     const { theme } = Object.fromEntries(formData);
 *
 *     if (theme === 'night') {
 *         document.documentElement.style.setProperty('--color-dark', '255, 255, 255');
 *         document.documentElement.style.setProperty('--color-light', '10, 10, 20');
 *     } else {
 *         document.documentElement.style.setProperty('--color-dark', '10, 10, 20');
 *         document.documentElement.style.setProperty('--color-light', '255, 255, 255');
 *     }
 *
 *     document.querySelector('[data-settings-overlay]').open = false;
 * });
 *
 * document.querySelector('[data-search-form]').addEventListener('submit', (event) => {
 *     event.preventDefault();
 *     const formData = new FormData(event.target);
 *     const filters = Object.fromEntries(formData);
 *     const result = [];
 *
 *     for (const book of books) {
 *         let genreMatch = filters.genre === 'any';
 *
 *         for (const singleGenre of book.genres) {
 *             if (genreMatch) break;
 *             if (singleGenre === filters.genre) { genreMatch = true }
 *         }
 *
 *         if (
 *             (filters.title.trim() === '' || book.title.toLowerCase().includes(filters.title.toLowerCase())) &&
 *             (filters.author === 'any' || book.author === filters.author) &&
 *             genreMatch
 *         ) {
 *             result.push(book);
 *         }
 *     }
 *
 *     page = 1;
 *     matches = result;
 *
 *     if (result.length < 1) {
 *         document.querySelector('[data-list-message]').classList.add('list__message_show');
 *     } else {
 *         document.querySelector('[data-list-message]').classList.remove('list__message_show');
 *     }
 *
 *     document.querySelector('[data-list-items]').innerHTML = '';
 *     const newItems = document.createDocumentFragment();
 *
 *     for (const { author, id, image, title } of result.slice(0, BOOKS_PER_PAGE)) {
 *         const element = document.createElement('button');
 *         element.classList = 'preview';
 *         element.setAttribute('data-preview', id);
 *
 *         element.innerHTML = `
 *             <img
 *                 class="preview__image"
 *                 src="${image}"
 *             />
 *
 *             <div class="preview__info">
 *                 <h3 class="preview__title">${title}</h3>
 *                 <div class="preview__author">${authors[author]}</div>
 *             </div>
 *         `;
 *
 *         newItems.appendChild(element);
 *     }
 *
 *     document.querySelector('[data-list-items]').appendChild(newItems);
 *     document.querySelector('[data-list-button]').disabled = (matches.length - (page * BOOKS_PER_PAGE)) < 1;
 *
 *     document.querySelector('[data-list-button]').innerHTML = `
 *         <span>Show more</span>
 *         <span class="list__remaining"> (${(matches.length - (page * BOOKS_PER_PAGE)) > 0 ? (matches.length - (page * BOOKS_PER_PAGE)) : 0})</span>
 *   `
 *
 *   window.scrollTo({top: 0, behavior: 'smooth'});
 *  document.querySelector('[data-search-overlay]').open = false
 *})
 *
 *document.querySelector('[data-list-button]').addEventListener('click', () => {
 *  const fragment = document.createDocumentFragment()
 *
 *   for (const { author, id, image, title } of matches.slice(page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE)) {
 *       const element = document.createElement('button')
 *       element.classList = 'preview'
 *       element.setAttribute('data-preview', id)
 *
 *       element.innerHTML = `
 *           <img
 *               class="preview__image"
 *               src="${image}"
 *           />
 *
 *           <div class="preview__info">
 *               <h3 class="preview__title">${title}</h3>
 *               <div class="preview__author">${authors[author]}</div>
 *           </div>
 *       `
 *
 *       fragment.appendChild(element)
 *   }
 *
 *   document.querySelector('[data-list-items]').appendChild(fragment)
 *   page += 1
 *})
 *
 *document.querySelector('[data-list-items]').addEventListener('click', (event) => {
 *   const pathArray = Array.from(event.path || event.composedPath())
 *   let active = null
 *
 *   for (const node of pathArray) {
 *       if (active) break
 *
 *       if (node?.dataset?.preview) {
 *           let result = null
 *
 *           for (const singleBook of books) {
 *               if (result) break;
 *               if (singleBook.id === node?.dataset?.preview) result = singleBook
 *           }
 *
 *           active = result
 *       }
 *   }
 *
 *   if (active) {
 *       document.querySelector('[data-list-active]').open = true
 *       document.querySelector('[data-list-blur]').src = active.image
 *       document.querySelector('[data-list-image]').src = active.image
 *       document.querySelector('[data-list-title]').innerText = active.title
 *       document.querySelector('[data-list-subtitle]').innerText = `${authors[active.author]} (${new Date(active.published).getFullYear()})`
 *       document.querySelector('[data-list-description]').innerText = active.description
 *   }
 *})**/
