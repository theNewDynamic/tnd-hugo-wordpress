const dedent = require( './dedent')
module.exports = ({ content, template }) => {
  // createMarkdownContent({
  // content = object, the content item
  // imagesPath = string, the base path for Ghost images
  // assetsPath = string, the new path for images
  // layout = string, the layout name
  // });

  // Format tags into a comma separated string
  const formatTags = (tags) => {
    if (tags) {
      return JSON.stringify(tags);
    }
    return "";
  };

  // Create the markdown template
  const templates = {
    page: `
      ---
      date: ${content.date}
      title: "${content.title ? content.title.rendered : ""}"
      remote_id: ${content.id}
      excerpt: "${content.excerpt ? content.excerpt.rendered : ""}"
      ---
      ${
        content.content
          ? content.content.rendered
          : ""
      }
    `,
    publication: `
      ---
      title: "${content.title ? content.title.rendered : ""}"
      slug: "${content.slug}"
      remote_id: ${content.id}
      authors: ${formatTags(content.tax_profile)}
      work_types: ${formatTags(content.tax_work_type)}
      excerpt: "${content.custom_excerpt ? content.custom_excerpt : ""}"
      ---
      ${
        content.content
          ? content.content.rendered
          : ""
      }
    `,
    work_type: `
      ---
      title: "${content.name}"
      slug: "${content.slug}"
      remote_id: ${content.id}
      description: ${content.description}
      ---
      ${
        content.content
          ? content.content.rendered
          : ""
      }
    `,
    author: `
      ---
      title: "${content.name}"
      remote_id: ${content.id}
      slug: "${content.slug}"
      excerpt: "${content.custom_excerpt ? content.custom_excerpt : ""}"
      ---
    `
  }

  // Return the template without the indentation
  return dedent({ string: templates[template] });
};