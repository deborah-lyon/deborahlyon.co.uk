const markdownIt = require("markdown-it");
const Image = require("@11ty/eleventy-img");

// Responsive image shortcode: resizes CMS-uploaded images and serves WebP
// (with an original-format fallback) so a large photo uploaded via the CMS
// is scaled down automatically at build time. Accepts CMS paths with or
// without a leading slash (e.g. "/img/x.jpg" or "img/x.jpg").
async function imageShortcode(src, alt, className, sizes, loading, fetchpriority) {
  if (!src) return "";
  const inputPath = src.replace(/^\//, "");
  try {
    const metadata = await Image(inputPath, {
      widths: [400, 800, 1200, 1600],
      formats: ["webp", "auto"],
      outputDir: "./_site/img/optimized/",
      urlPath: "/img/optimized/",
    });
    const attrs = {
      alt: alt || "",
      sizes: sizes || "100vw",
      loading: loading || "lazy",
      decoding: "async",
    };
    if (className) attrs.class = className;
    if (fetchpriority) attrs.fetchpriority = fetchpriority;
    return Image.generateHTML(metadata, attrs);
  } catch (e) {
    // Never break the build over one bad image path - fall back to the original.
    console.warn(`[image] could not optimise ${src}: ${e.message}`);
    const cls = className ? ` class="${className}"` : "";
    return `<img src="${src}" alt="${alt || ""}"${cls} loading="${loading || "lazy"}" decoding="async">`;
  }
}

module.exports = function(eleventyConfig) {

  eleventyConfig.addAsyncShortcode("image", imageShortcode);

  // Configure markdown-it for inline markdown rendering
  const md = markdownIt({
    html: true,
    breaks: false,
    linkify: true
  });

  // Add markdown filter for inline content
  eleventyConfig.addFilter("markdown", (content) => {
    return md.renderInline(content);
  });

  // Add markdownFull filter for block-level content (paragraphs, lists, etc.)
  eleventyConfig.addFilter("markdownFull", (content) => {
    return md.render(content);
  });

  // Convert 24h time to 12h display format (e.g., "19:30" -> "7:30 PM")
  eleventyConfig.addFilter("formatTime", (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  });

  // Format phone number for display (e.g., "+447825335039" -> "0782 533 5039")
  eleventyConfig.addFilter("formatPhone", (phone) => {
    if (!phone) return "";
    // Remove +44 and replace with 0, or just strip non-digits
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("44")) {
      digits = "0" + digits.slice(2);
    }
    // Format as: 0XXX XXX XXXX
    if (digits.length === 11) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    return phone; // Return original if format doesn't match
  });

  // Add current year as a global data variable
  eleventyConfig.addGlobalData("currentYear", () => {
    return new Date().getFullYear();
  });

  // Pass through img folder to _site
  eleventyConfig.addPassthroughCopy("img");

  // Pass through admin folder for Netlify CMS
  eleventyConfig.addPassthroughCopy("admin");

  // Pass through robots.txt
  eleventyConfig.addPassthroughCopy("robots.txt");

  // Pass through fonts folder
  eleventyConfig.addPassthroughCopy("fonts");

  // Pass through JS files from src
  eleventyConfig.addPassthroughCopy("src/script.js");

  // Watch content folder for changes
  eleventyConfig.addWatchTarget("./content/");

  // Watch CSS partials for changes
  eleventyConfig.addWatchTarget("./src/css/");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "partials",
      layouts: "layouts",
      data: "../content"
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
