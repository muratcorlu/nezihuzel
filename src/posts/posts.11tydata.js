module.exports = {
  layout: 'post',
  author: 'nezih-uzel',
  tags: 'blog',
  permalink: data => `/${ data.date.split('-').join('/') }/${ data.page.fileSlug }/`
};