const dayjs = require('dayjs');
const lodash = require("lodash");
const slugify = require("slugify");
const embedYouTube = require("eleventy-plugin-youtube-embed");

/**
 * Get all unique key values from a collection
 *
 * @param {Array} collectionArray - collection to loop through
 * @param {String} key - key to get values from
 */
function getAllKeyValues(collectionArray, key) {
  // get all values from collection
  let allValues = collectionArray.map((item) => {
    let values = item.data[key] ? item.data[key] : [];
    return values;
  });

  // flatten values array
  allValues = lodash.flattenDeep(allValues);
  // remove duplicates
  allValues = [...new Set(allValues)];
  // order alphabetically
  allValues = allValues.sort(function (a, b) {
    return a.localeCompare(b, "en", { sensitivity: "base" });
  });
  // return
  return allValues;
}

/**
 * Transform a string into a slug
 * Uses slugify package
 *
 * @param {String} str - string to slugify
 */
function strToSlug(str) {
  const options = {
    replacement: "-",
    remove: /[&,+()$~%.'":*?<>{}]/g,
    lower: true,
  };

  return slugify(str, options);
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("./src/css");
  eleventyConfig.addPassthroughCopy("./src/uploads");

  eleventyConfig.addPlugin(embedYouTube, { lite: true });

  eleventyConfig.addFilter('date', (date, format) => dayjs(date).format(format));

  eleventyConfig.addCollection('categories', function (collection) {
    let allCategories = getAllKeyValues(
      collection.getFilteredByGlob("./src/posts/**/*.md"),
      "categories"
    );

    return allCategories.map((category) => ({
      title: category,
      slug: strToSlug(category),
    }));
  });

  return {
    // passthroughFileCopy: true,
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
    },
  };
};
