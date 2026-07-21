/**
 * Runtime used only by exported/published documents that contain a Product
 * Collection block. The builder renders its own saved sample data and never
 * evaluates this script.
 */

export interface StorefrontRuntimeConfig {
  workspaceId?: string | null;
  apiBaseUrl?: string | null;
}

const WORKSPACE_ID_PATTERN = /^[a-f\d]{24}$/i;

export const isStorefrontWorkspaceId = (value?: string | null): value is string =>
  typeof value === "string" && WORKSPACE_ID_PATTERN.test(value);

export const getStorefrontApiBaseUrl = (apiBaseUrl?: string | null) => {
  const value = typeof apiBaseUrl === "string" ? apiBaseUrl.trim() : "";
  if (!value) return "";

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
};

const safeInlineValue = (value: string) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

/**
 * Produces a small progressive-enhancement runtime for Product Collection
 * blocks. Product names, images, prices, and descriptions are assigned via
 * DOM APIs (not interpolated HTML), so catalog records cannot inject markup
 * into a generated site.
 */
export const buildStorefrontRuntimeScript = ({
  workspaceId,
  apiBaseUrl,
}: StorefrontRuntimeConfig): string => {
  if (!isStorefrontWorkspaceId(workspaceId)) return "";

  const apiBase = getStorefrontApiBaseUrl(apiBaseUrl);
  if (!apiBase) return "";

  return `
    <script data-stackly-storefront="product-collection">
      (function () {
        "use strict";

        if (window.__stackly_preview || window.__stackly_draft || window.__stacklyStorefrontRuntimeLoaded) return;
        window.__stacklyStorefrontRuntimeLoaded = true;

        var workspaceId = ${safeInlineValue(workspaceId)};
        var apiBaseUrl = ${safeInlineValue(apiBase)};
        var maxPageSize = 24;
        var maxProductIds = 24;

        function clamp(value, minimum, maximum, fallback) {
          var number = Number(value);
          if (!Number.isFinite(number)) return fallback;
          return Math.max(minimum, Math.min(maximum, Math.floor(number)));
        }

        function text(value, fallback, maximum) {
          if (typeof value !== "string") return fallback;
          return value.trim().slice(0, maximum || 240);
        }

        function bool(value, fallback) {
          return typeof value === "boolean" ? value : fallback;
        }

        function oneOf(value, allowed, fallback) {
          return allowed.indexOf(value) >= 0 ? value : fallback;
        }

        function isProductId(value) {
          return typeof value === "string" && /^[a-f\\d]{24}$/i.test(value);
        }

        function configFor(section) {
          var parsed = {};
          try {
            parsed = JSON.parse(section.getAttribute("data-stackly-product-config") || "{}");
          } catch (error) {}

          var requestedIds = Array.isArray(parsed.productIds) ? parsed.productIds : [];
          var productIds = requestedIds.filter(isProductId).slice(0, maxProductIds);
          var variant = oneOf(parsed.variant, ["grid", "featured", "carousel", "category", "best-sellers", "latest", "single", "collection"], "grid");
          var selection = oneOf(parsed.selection, ["manual", "category", "best-sellers", "latest"], "manual");
          var category = text(parsed.category, "", 96);
          var sort = oneOf(parsed.sort, ["manual", "newest", "price-asc", "price-desc", "best-selling"], "newest");

          if (variant === "category" && category) selection = "category";
          if (variant === "latest") selection = "latest";
          if (variant === "best-sellers") selection = "best-sellers";
          if (variant === "single") {
            selection = "manual";
            productIds = productIds.slice(0, 1);
          }

          return {
            category: category,
            columns: clamp(parsed.columns, 1, 4, 3),
            ctaLabel: text(parsed.ctaLabel, "Add to cart", 64),
            emptyStateLabel: text(parsed.emptyStateLabel, "No products are available right now.", 160),
            limit: clamp(parsed.limit, 1, maxPageSize, 8),
            pagination: bool(parsed.pagination, false),
            productIds: productIds,
            selection: selection,
            showBadges: bool(parsed.showBadges, true),
            showFilters: bool(parsed.showFilters, false),
            showPrices: bool(parsed.showPrices, true),
            sort: sort,
            variant: variant
          };
        }

        function request(url, options) {
          if (typeof window.fetch !== "function") return Promise.reject(new Error("Catalog loading is not supported by this browser."));
          return window.fetch(url, options || {}).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (payload) {
              if (!response.ok) throw new Error(payload && payload.message ? payload.message : "Unable to load products.");
              return payload;
            });
          });
        }

        function publicCatalogUrl(category, page, limit, productIds) {
          var params = new URLSearchParams();
          params.set("page", String(page));
          params.set("limit", String(limit));
          if (category) params.set("category", category);
          if (Array.isArray(productIds) && productIds.length) params.set("ids", productIds.join(","));
          return apiBaseUrl + "/ecommerce/store/" + encodeURIComponent(workspaceId) + "/products?" + params.toString();
        }

        function productPrice(product) {
          var sale = Number(product && product.salePrice);
          var regular = Number(product && product.price);
          return Number.isFinite(sale) && sale >= 0 ? sale : (Number.isFinite(regular) ? regular : 0);
        }

        function formatPrice(value, currency) {
          var safeCurrency = typeof currency === "string" && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : "INR";
          try {
            return new Intl.NumberFormat(undefined, { style: "currency", currency: safeCurrency, maximumFractionDigits: 2 }).format(value);
          } catch (error) {
            return safeCurrency + " " + value.toFixed(2);
          }
        }

        function orderedProducts(products, config) {
          var result = Array.isArray(products) ? products.slice() : [];

          if (config.selection === "manual" && config.productIds.length) {
            var positions = {};
            config.productIds.forEach(function (id, index) { positions[id] = index; });
            result = result.filter(function (product) { return product && positions[product._id] !== undefined; });
            result.sort(function (left, right) { return positions[left._id] - positions[right._id]; });
          }

          // The current public product API does not expose sales totals. A
          // best-seller presentation therefore preserves server order rather
          // than inventing a sales ranking. A future API can add that signal.
          if (config.sort === "price-asc") result.sort(function (left, right) { return productPrice(left) - productPrice(right); });
          if (config.sort === "price-desc") result.sort(function (left, right) { return productPrice(right) - productPrice(left); });
          if (config.variant === "featured") {
            result.sort(function (left, right) {
              return Number(Boolean(right && right.salePrice != null)) - Number(Boolean(left && left.salePrice != null));
            });
          }

          return result.slice(0, config.limit);
        }

        function setStatus(status, message, error) {
          if (!status) return;
          status.textContent = message || "";
          status.dataset.state = error ? "error" : "ready";
        }

        function ensureStyles() {
          if (document.getElementById("stackly-storefront-product-styles")) return;
          var style = document.createElement("style");
          style.id = "stackly-storefront-product-styles";
          style.textContent = ".stackly-product-grid{display:grid;gap:18px}.stackly-product-card{display:flex;min-width:0;flex-direction:column;overflow:hidden;border:1px solid #dbe3ef;border-radius:12px;background:#fff;box-shadow:0 1px 2px rgba(15,35,75,.04)}.stackly-product-card img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#f4f7fb}.stackly-product-card-body{display:flex;flex:1;flex-direction:column;gap:10px;padding:16px}.stackly-product-card h3{margin:0;font-size:1.05rem}.stackly-product-card p{margin:0;color:#566583;line-height:1.5}.stackly-product-price{font-size:1.05rem;font-weight:800}.stackly-product-compare{margin-left:8px;color:#7c8799;font-size:.85rem;font-weight:500;text-decoration:line-through}.stackly-product-badge{align-self:flex-start;border-radius:999px;background:#eaf1ff;color:#174ea6;padding:4px 8px;font-size:.75rem;font-weight:700}.stackly-product-card button{margin-top:auto}.stackly-product-card button:disabled{cursor:not-allowed;opacity:.58}.stackly-product-pagination{display:flex;justify-content:center;margin-top:16px}.stackly-product-filter{display:flex;align-items:center;gap:8px;margin:0 0 16px}.stackly-product-filter select{max-width:260px}.stackly-product-status{min-height:1.2em;margin:10px 0;color:#566583;font-size:.9rem}.stackly-product-status[data-state=error]{color:#b42318}@media (max-width:640px){.stackly-product-grid{grid-template-columns:1fr!important}.stackly-product-card-body{padding:14px}}";
          document.head.appendChild(style);
        }

        function token() {
          try { return window.localStorage.getItem("stackly-auth-token") || ""; } catch (error) { return ""; }
        }

        function updateCartButton(button, status, config, product) {
          if (!product || !product._id || !isProductId(String(product._id))) return;
          button.addEventListener("click", function () {
            var authToken = token();
            if (!authToken) {
              setStatus(status, "Sign in to add products to your saved cart.", true);
              return;
            }

            button.disabled = true;
            setStatus(status, "Adding to cart…", false);
            request(apiBaseUrl + "/cart/" + encodeURIComponent(workspaceId) + "/items", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": "Bearer " + authToken },
              body: JSON.stringify({ productId: product._id, quantity: 1 })
            }).then(function () {
              setStatus(status, "Added to your saved cart. Continue to checkout from your cart.", false);
            }).catch(function (error) {
              setStatus(status, error && error.message ? error.message : "Unable to add this product to cart.", true);
            }).finally(function () {
              button.disabled = Number(product.inventory) <= 0;
            });
          });
        }

        function makeCard(product, config, status) {
          var card = document.createElement("article");
          card.className = "stackly-product-card";
          card.dataset.productId = String(product && product._id || "");

          var imageUrl = Array.isArray(product && product.images) ? product.images[0] : "";
          if (typeof imageUrl === "string" && imageUrl) {
            var image = document.createElement("img");
            image.src = imageUrl;
            image.alt = text(product && product.name, "Product", 160);
            image.loading = "lazy";
            image.decoding = "async";
            card.appendChild(image);
          }

          var body = document.createElement("div");
          body.className = "stackly-product-card-body";
          var badge = text(product && (product.badge || (product.salePrice != null ? "Sale" : "")), "", 40);
          if (config.showBadges && badge) {
            var badgeElement = document.createElement("span");
            badgeElement.className = "stackly-product-badge";
            badgeElement.textContent = badge;
            body.appendChild(badgeElement);
          }

          var name = document.createElement("h3");
          name.textContent = text(product && product.name, "Untitled product", 160);
          body.appendChild(name);

          var description = text(product && product.description, "", 360);
          if (description) {
            var descriptionElement = document.createElement("p");
            descriptionElement.textContent = description;
            body.appendChild(descriptionElement);
          }

          if (config.showPrices) {
            var price = document.createElement("div");
            price.className = "stackly-product-price";
            price.textContent = formatPrice(productPrice(product), product && product.currency);
            var compareAt = Number(product && product.price);
            if (product && product.salePrice != null && Number.isFinite(compareAt) && compareAt > productPrice(product)) {
              var compare = document.createElement("span");
              compare.className = "stackly-product-compare";
              compare.textContent = formatPrice(compareAt, product.currency);
              price.appendChild(compare);
            }
            body.appendChild(price);
          }

          var button = document.createElement("button");
          button.type = "button";
          var outOfStock = Number(product && product.inventory) <= 0;
          button.disabled = outOfStock;
          button.textContent = outOfStock ? "Out of stock" : config.ctaLabel;
          updateCartButton(button, status, config, product);
          body.appendChild(button);
          card.appendChild(body);
          return card;
        }

        function drawProducts(grid, products, config, status) {
          grid.replaceChildren();
          grid.style.gridTemplateColumns = "repeat(" + config.columns + ", minmax(0, 1fr))";
          if (!products.length) {
            setStatus(status, config.emptyStateLabel, false);
            return;
          }
          products.forEach(function (product) { grid.appendChild(makeCard(product, config, status)); });
        }

        function addFilter(section, state, reload) {
          var holder = section.querySelector("[data-stackly-product-filters]");
          if (!holder || !state.config.showFilters) return;
          holder.replaceChildren();
          var label = document.createElement("label");
          label.className = "stackly-product-filter";
          label.textContent = "Category";
          var select = document.createElement("select");
          var categories = state.products.reduce(function (all, product) {
            var category = text(product && product.category, "", 96);
            if (category && all.indexOf(category) < 0) all.push(category);
            return all;
          }, []);
          var allOption = document.createElement("option");
          allOption.value = "";
          allOption.textContent = "All categories";
          select.appendChild(allOption);
          categories.forEach(function (category) {
            var option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
          });
          select.value = state.category || "";
          select.addEventListener("change", function () {
            state.category = select.value;
            state.page = 1;
            reload();
          });
          label.appendChild(select);
          holder.appendChild(label);
        }

        function addPagination(section, state, reload) {
          var holder = section.querySelector("[data-stackly-product-pagination]");
          if (!holder) return;
          holder.replaceChildren();
          if (!state.config.pagination || !state.pagination || state.page >= Number(state.pagination.pages || 1)) return;
          var more = document.createElement("button");
          more.type = "button";
          more.textContent = "Load more products";
          more.addEventListener("click", function () {
            state.page += 1;
            reload(true);
          });
          holder.appendChild(more);
        }

        function initCollection(section) {
          var grid = section.querySelector("[data-stackly-product-grid]");
          if (!grid) return;
          section.dataset.stacklyCatalogMode = "live";
          var status = section.querySelector("[data-stackly-product-status]");
          var state = { category: "", config: configFor(section), page: 1, pagination: null, products: [] };
          state.category = state.config.selection === "category" ? state.config.category : "";

          function load(append) {
            setStatus(status, "Loading products…", false);
            var requestLimit = state.config.selection === "manual" && state.config.productIds.length
              ? state.config.productIds.length
              : state.config.limit;
            request(publicCatalogUrl(state.category, state.page, requestLimit, state.config.productIds), { method: "GET", credentials: "omit" })
              .then(function (payload) {
                var incoming = orderedProducts(payload && payload.products, state.config);
                state.products = append ? state.products.concat(incoming) : incoming;
                state.pagination = payload && payload.pagination || null;
                drawProducts(grid, state.products, state.config, status);
                addFilter(section, state, function () { load(false); });
                addPagination(section, state, function (loadMore) { load(Boolean(loadMore)); });
                setStatus(status, state.products.length ? "" : state.config.emptyStateLabel, false);
              })
              .catch(function (error) {
                setStatus(status, error && error.message ? error.message : "Unable to load products.", true);
              });
          }

          load(false);
        }

        function start() {
          ensureStyles();
          Array.prototype.forEach.call(document.querySelectorAll("[data-stackly-product-collection]"), initCollection);
        }

        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
        else start();
      })();
    </script>`;
};
