const fs = require("fs-extra");
const path = require("path");
const fetch = require("node-fetch");
const url = require("url");
const { cyan, green, yellow } = require("chalk");
const createMarkdownContent = require('./utils/createMarkdownContent')
const log = ({ color, label, value = false }) => {
  // log({
  // color = chalk color
  // label = string, text label
  // value = var, value being read out
  // });
  console.log(`${color(label)}${value ? color(`: ${color.bold(value)}`) : ""}`);
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

// Begin plugin export
module.exports = {
  onPreBuild: async ({
    inputs: {
      wpURL,
      contentDir = "./remote/wp",
      postDatePrefix = true,
      cacheFile = "./remote/wp/cache/wpMarkdownCache.json"
    },
    utils: {
      build: { failPlugin },
      cache
    }
  }) => {

    const wpAPI = async function(endpoint) {
      const wpAPIURL = wpURL + '/wp-json/wp/v2/'
    
      return fetch(wpAPIURL + endpoint).then(response => {
        const output = response.json()
        return output
      })
    }

    // Initialise Ghost Content API
    const pagesDir = contentDir + "/pages/"
    const authorsDir = contentDir + "/authors/"
    const postsDir = contentDir + "/publications/"
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
        const fullFilePath = contentDir + '/work_types/' + fileName;

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
