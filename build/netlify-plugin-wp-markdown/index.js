const fs = require("fs-extra");
const path = require("path");
const fetch = require("node-fetch");
const url = require("url");
const { cyan, green, yellow } = require("chalk");
const WPAPI = require( 'wpapi' );
const log = ({ color, label, value = false }) => {
  // log({
  // color = chalk color
  // label = string, text label
  // value = var, value being read out
  // });
  console.log(`${color(label)}${value ? color(`: ${color.bold(value)}`) : ""}`);
};

/**
 * Transform a string into a slug
 * Uses slugify package
 *
 * @param {String} str - string to slugify
 */
strToSlug = function(str) {
  const options = {
    replacement: "-",
    remove: /[&,+()$~%.'":*?<>{}]/g,
    lower: true
  };

  return slugify(str, options);
}

const dedent = ({ string }) => {
  // dedent({
  // string = string, the template content
  // });

  // Take any string and remove indentation
  string = string.replace(/^\n/, "");
  const match = string.match(/^\s+/);
  const dedentedString = match
    ? string.replace(new RegExp("^" + match[0], "gm"), "")
    : string;

  return dedentedString;
};

const createMarkdownContent = ({ content, template }) => {
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


const writeFile = async ({ fullFilePath, content, failPlugin }) => {
  // writeFile({
  // fullFilePath = string, the full file path and name with extension
  // content = contents of the file
  // failPlugin = failPlugin
  //});

  try {
    // Output file using path and name with it's content within
    await fs.outputFile(fullFilePath, content);
  } catch (error) {
    failPlugin(`Error writing ${fullFilePath}`, { error });
  }
};


const getCacheTimestamp = async ({ cache, fullFilePath, failPlugin }) => {
  // getCacheTimestamp({
  // cache = cache
  // fullFilePath = string, the local file path and name
  // failPlugin: failPlugin
  // });

  if (await cache.has(fullFilePath)) {
    await cache.restore(fullFilePath);
    const cacheDate = await readFile({
      file: fullFilePath,
      failPlugin: failPlugin
    });

    // Log cache timestamp in console
    log({
      color: yellow,
      label: "Restoring markdown cache from",
      value: cacheDate
    });
    return new Date(cacheDate);
  } else {
    // Log no cache file found
    log({
      color: yellow,
      label: "No cache file found"
    });
    return 0;
  }
};

const writeCacheTimestamp = async ({ cache, fullFilePath, failPlugin }) => {
  // writeCacheTimestamp({
  // cache = cache
  // fullFilePath = string, the local file path and name
  // failPlugin = failPlugin
  // });

  // Get the timestamp of right now
  const now = new Date();
  const nowISO = now.toISOString();

  // Write the time into a cache file
  await writeFile({
    fullFilePath: fullFilePath,
    content: `"${nowISO}"`,
    failPlugin: failPlugin
  });

  await cache.save(fullFilePath);

  // Log cache timestamp creation time
  log({
    color: yellow,
    label: "Caching markdown at",
    value: nowISO
  });
};

const readFile = async ({ file, failPlugin }) => {
  // readFile({
  // file = string, the local file path and name
  // failPlugin = failPlugin
  // });

  // Replace root path syntax with environment
  const fullFilePath = file.replace("./", `${process.cwd()}/`);
  const fileContent = require(fullFilePath);

  // Return file content
  return fileContent;
};
const wpAPI = async function(endpoint) {
  const wpURL = 'https://agnionline.bu.edu/wordpress/wp-json/wp/v2/'

  return fetch(wpURL + endpoint).then(response => {
    const output = response.json()
    return output
  })
}

const wpNodeAPI = async function() {
  const wp = new WPAPI({ endpoint: 'https://agnionline.bu.edu/wordpress/wp-json' });
  wp.publication().then(function( data ) {
      return data.json()
  }).catch(function( err ) {
      // handle error
  });
}
// Begin plugin export
module.exports = {
  onPreBuild: async ({
    inputs: {
      wpURL,
      pagesDir = "./remote/pages/",
      authorsDir ="./remote/authors/",
      postsDir = "./remote/publications/",
      postDatePrefix = true,
      cacheFile = "./remote/cache/wpMarkdownCache.json"
    },
    utils: {
      build: { failPlugin },
      cache
    }
  }) => {

    // Initialise Ghost Content API
    const remotePosts = wpAPI('publication?per_page=100')
    const remotePages = wpAPI('pages')
    const remoteAuthors = wpAPI('tax_profile?per_page=100')
    const remoteWorkTypes = wpAPI('tax_work_type?per_page=100')
    const [cacheDate, pages, posts, authors, work_types] = await Promise.all([
      getCacheTimestamp({
        cache: cache,
        fullFilePath: cacheFile,
        failPlugin: failPlugin
      }),
      remotePages,
      remotePosts,
      remoteAuthors,
      remoteWorkTypes,
    ]);

    await Promise.all([
      ...pages.map(async (page) => {
        // Set the file name using the post slug
        let fileName = `${page.slug}.md`;

        // If postDatePrefix is true prefix file with post date
        if (postDatePrefix) {
          fileName = `${page.date}-${page.slug}.md`;
        }

        // The full file path and name
        const fullFilePath = pagesDir + fileName;

        // Get the post updated date and last cached date
        const postUpdatedAt = new Date(page.updated_at ? page.updated_at : page.date);

        if ((await cache.has(fullFilePath)) && cacheDate > postUpdatedAt) {
          // Restore markdown from cache
          await cache.restore(fullFilePath);

          log({
            color: cyan,
            label: "Restored from cache",
            value: fullFilePath
          });
        } else {
          // Generate markdown file
          await writeFile({
            fullFilePath: fullFilePath,
            content: createMarkdownContent({
              content: page,
              template: 'page'
            })
          });
          // Cache the markdown file
          await cache.save(fullFilePath);

          log({
            color: green,
            label: "Generated and cached",
            value: fullFilePath
          });
        }
      }),
      ...posts.map(async (post) => {
        // Set the file name using the page slug
        let fileName = `${post.slug}.md`;

        // The full file path and name
        const fullFilePath = postsDir + fileName;

        // Get the page updated date and last cached date
        const postUpdatedAt = new Date(post.updated_at ? post.updated_at : post.date);

        if ((await cache.has(fullFilePath)) && cacheDate > postUpdatedAt) {
          // Restore markdown from cache
          await cache.restore(fullFilePath);

          log({
            color: cyan,
            label: "Restored from cache",
            value: fullFilePath
          });
        } else {
          // Generate markdown file
          await writeFile({
            fullFilePath: fullFilePath,
            content: createMarkdownContent({
              content: post,
              template: 'publication'
            })
          });
          // Cache the markdown file
          await cache.save(fullFilePath);

          log({
            color: green,
            label: "Generated and cached",
            value: fullFilePath
          });
        }
      }),
      ...authors.map(async (author) => {
        // Set the file name using the page slug
        let fileName = `${author.slug}.md`;

        // The full file path and name
        const fullFilePath = authorsDir + fileName;

        // Get the page updated date and last cached date
        const postUpdatedAt = new Date(author.updated_at ? author.updated_at : author.date);

        if ((await cache.has(fullFilePath)) && cacheDate > postUpdatedAt) {
          // Restore markdown from cache
          await cache.restore(fullFilePath);

          log({
            color: cyan,
            label: "Restored from cache",
            value: fullFilePath
          });
        } else {
          // Generate markdown file
          await writeFile({
            fullFilePath: fullFilePath,
            content: createMarkdownContent({
              content: author,
              template: 'author'
            })
          });
          // Cache the markdown file
          await cache.save(fullFilePath);

          log({
            color: green,
            label: "Generated and cached",
            value: fullFilePath
          });
        }
      }),
      ...work_types.map(async (work_type) => {
        // Set the file name using the page slug
        let fileName = `${work_type.slug}.md`;

        // The full file path and name
        const fullFilePath = './remote/work_types/' + fileName;

        // Get the page updated date and last cached date
        const postUpdatedAt = new Date(work_type.updated_at ? work_type.updated_at : work_type.date);

        if ((await cache.has(fullFilePath)) && cacheDate > postUpdatedAt) {
          // Restore markdown from cache
          await cache.restore(fullFilePath);

          log({
            color: cyan,
            label: "Restored from cache",
            value: fullFilePath
          });
        } else {
          // Generate markdown file
          await writeFile({
            fullFilePath: fullFilePath,
            content: createMarkdownContent({
              content: work_type,
              template: 'work_type'
            })
          });
          // Cache the markdown file
          await cache.save(fullFilePath);

          log({
            color: green,
            label: "Generated and cached",
            value: fullFilePath
          });
        }
      }),
    ]).then(async (response) => {
      // Write a new cache file
      await writeCacheTimestamp({
        cache: cache,
        fullFilePath: cacheFile,
        failPlugin: failPlugin
      });
    });
  }
};
