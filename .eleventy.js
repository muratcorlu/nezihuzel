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

    const allPosts = collection.getFilteredByGlob("./src/posts/**/*.md");

    return allCategories.map((category) => ({
      title: category,
      slug: strToSlug(category),
      totalCount: allPosts.filter(post => post.data.categories.includes(category)).length
    }));
  });

  const postsByYears = (acc = {}, curr) => {
    const year = curr.date.getFullYear();
    acc[year] = acc[year] || [];
    acc[year].push(post);
    return acc;
  }

  // eleventyConfig.addCollection('postsByYears', (collection) => {
  //   let allBlogposts = collection
  //     .getFilteredByGlob("./src/posts/*.md")
  //     .reverse();

  // });

  // create flattened paginated blogposts per categories collection
  // based on Zach Leatherman's solution - https://github.com/11ty/eleventy/issues/332
  eleventyConfig.addCollection("blogpostsByCategories", function (collection) {
    const itemsPerPage = 20;
    let blogpostsByCategories = [];
    let allBlogposts = collection
      .getFilteredByGlob("./src/posts/*.md")
      .reverse();
    let blogpostsCategories = getAllKeyValues(allBlogposts, "categories");

    // walk over each unique category
    blogpostsCategories.forEach((category) => {
      let sanitizedCategory = lodash.deburr(category).toLowerCase();
      // create array of posts in that category
      let postsInCategory = allBlogposts.filter((post) => {
        let postCategories = post.data.categories ? post.data.categories : [];
        let sanitizedPostCategories = postCategories.map((item) =>
          lodash.deburr(item).toLowerCase()
        );
        return sanitizedPostCategories.includes(sanitizedCategory);
      });

      // chunck the array of posts
      let chunkedPostsInCategory = lodash.chunk(postsInCategory, itemsPerPage);

      // create array of page slugs
      let pagesSlugs = [];
      for (let i = 0; i < chunkedPostsInCategory.length; i++) {
        let categorySlug = strToSlug(category);
        let pageSlug = i > 0 ? `${categorySlug}/${i + 1}` : `${categorySlug}`;
        pagesSlugs.push(pageSlug);
      }

      // create array of objects
      chunkedPostsInCategory.forEach((posts, index) => {
        blogpostsByCategories.push({
          title: category,
          slug: pagesSlugs[index],
          pageNumber: index,
          totalPages: pagesSlugs.length,
          totalCount: postsInCategory.length,
          pageSlugs: {
            all: pagesSlugs,
            next: pagesSlugs[index + 1] || null,
            previous: pagesSlugs[index - 1] || null,
            first: pagesSlugs[0] || null,
            last: pagesSlugs[pagesSlugs.length - 1] || null,
          },
          items: posts
        });
      });
    });

    return blogpostsByCategories;
  });

  eleventyConfig.addFilter('filter', (posts, key, value) => {
    console.log(key, value);
    return posts.filter(post => {
      if (typeof post.data[key] === 'array') {
        return post.data[key].includes(value);
      }

      return post.data[key] === value;
    });
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
