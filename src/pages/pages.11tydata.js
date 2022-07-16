module.exports = {
  layout: 'layout',
  tags: "page",
  permalink: data => `/${ data.page.fileSlug }/`
};