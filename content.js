import { DEFAULT_CONTENT, mergeContent } from "./content-defaults.js";

const content = mergeContent(DEFAULT_CONTENT);
window.PAWDERM_CONTENT = content;
renderFooters(content);
hydrateContent(content);
refreshIcons();

export function hydrateContent(contentObject = window.PAWDERM_CONTENT || DEFAULT_CONTENT) {
  document.querySelectorAll("[data-content]").forEach((node) => {
    const value = getPath(contentObject, node.dataset.content);
    if (value !== undefined) {
      node.textContent = value;
    }
  });

  document.querySelectorAll("[data-content-placeholder]").forEach((node) => {
    const value = getPath(contentObject, node.dataset.contentPlaceholder);
    if (value !== undefined) {
      node.setAttribute("placeholder", value);
    }
  });

  document.querySelectorAll("[data-content-href]").forEach((node) => {
    const value = getPath(contentObject, node.dataset.contentHref);
    if (value !== undefined) {
      node.setAttribute("href", value);
    }
  });
}

export function renderFooters(contentObject = window.PAWDERM_CONTENT || DEFAULT_CONTENT) {
  document.querySelectorAll(".site-footer").forEach((footer) => {
    footer.innerHTML = `
      <div class="footer-brand">
        <a class="brand" href="index.html">
          <span class="brand-mark" aria-hidden="true"><i data-lucide="stethoscope"></i></span>
          <span>
            <strong>${escapeHtml(getPath(contentObject, "brand.name") || "PawDerm AI")}</strong>
            <small>${escapeHtml(getPath(contentObject, "brand.tagline") || "Dog and cat skin notes")}</small>
          </span>
        </a>
        <p>${escapeHtml(getPath(contentObject, "brand.footerDescription") || "")}</p>
      </div>
      <div class="footer-columns">
        <div>
          <h3>${escapeHtml(getPath(contentObject, "footer.productTitle") || "Product")}</h3>
          <a href="pricing.html">${escapeHtml(getPath(contentObject, "footer.pricing") || "Pricing")}</a>
          <a href="login.html">${escapeHtml(getPath(contentObject, "footer.login") || "Log in")}</a>
          <a href="contact.html">${escapeHtml(getPath(contentObject, "footer.demo") || "Get a demo")}</a>
          <a href="contact.html">${escapeHtml(getPath(contentObject, "footer.contact") || "Contact")}</a>
        </div>
        <div>
          <h3>${escapeHtml(getPath(contentObject, "footer.resourcesTitle") || "Resources")}</h3>
          <a href="docs.html">${escapeHtml(getPath(contentObject, "footer.docs") || "Documentation")}</a>
          <a href="blog.html">${escapeHtml(getPath(contentObject, "footer.blog") || "News and Blog")}</a>
          <a href="index.html#demo">${escapeHtml(getPath(contentObject, "footer.liveDemo") || "Live demo")}</a>
        </div>
        <div>
          <h3>${escapeHtml(getPath(contentObject, "footer.legalTitle") || "Legal")}</h3>
          <a href="terms.html">${escapeHtml(getPath(contentObject, "footer.terms") || "Terms and Conditions")}</a>
          <a href="regulatory.html">${escapeHtml(getPath(contentObject, "footer.regulatory") || "Regulatory Status")}</a>
          <a href="regulatory.html">${escapeHtml(getPath(contentObject, "footer.safety") || "Safety notes")}</a>
        </div>
      </div>
    `;
  });
}

export function getPath(source, path) {
  return path.split(".").reduce((cursor, key) => (cursor && key in cursor ? cursor[key] : undefined), source);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  } else {
    window.addEventListener("load", () => window.lucide?.createIcons(), { once: true });
  }
}
