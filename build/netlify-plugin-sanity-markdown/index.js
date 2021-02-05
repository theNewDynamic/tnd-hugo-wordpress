const slugify = require('slugify')
module.exports = {
  onPreBuild: async ({
    inputs: {
      projectID,
      dataset = "production",
      contentDir
    },
    utils
  }) => {
    console.log("Starting plugin");
    //imports
    const fs = require("fs-extra");
    const toMarkdown = require("@sanity/block-content-to-markdown");
    const client = require("@sanity/client")({
      projectId: projectID,
      dataset,
      useCdn: false,
    });

    //add any serializers for your portable text
    const serializers = {
      types: {
        code: (props) =>
          "```" + props.node.language + "\n" + props.node.code + "\n```",
      },
    };
    if(true) {
      fs.rmdir(`./${contentDir}`, { recursive: true })
      .then(() => console.log(`Deleting: ${contentDir}`))
    }
    try {
      await client
        .fetch(require('./groq/default.js'))
        .then((res) =>
          res.map(async (post) => {

            //output YAML frontmatter here
 
            const frontmatter = require(`./templates/${post._type}.js`)(post)

            const wholePost = `${frontmatter}\n${toMarkdown(post.overview, {
              serializers,
            })}`;
            let slug = slugify(post.title, {
              lower: true,
              strict: true,
            })

            if(typeof post.slug !== 'undefined') {
              slug = post.slug.current
            }

            const filePath = `./${contentDir}/${post._type}/${slug}.md`;
            fs.outputFile(filePath, wholePost, function (err, data) {
              if (err) {
                return console.log(err);
              }
            });
          })
        );
    } catch (error) {
      utils.build.failBuild("Failure message", { error });
    }
  },
};